/*
|--------------------------------------------------------------------------
| Query Instrumentation — shared utility
|--------------------------------------------------------------------------
|
| Used by both DB.ts (MySQL executeQuery + MongoDB collection) and
| db.config.ts (mongoCollection shorthand used by EloquentBuilder/Model).
|
| emitQueryEvent()
|   If the application EventDispatcher already has a `db:query` listener
|   (i.e., Telescope is active in this process), fires the event there.
|   Otherwise — we're in a worker process — writes the entry to the shared
|   Cache so the HTTP server's Telescope can poll it.
|
| createMongoQueryProxy()
|   Wraps any MongoCollection in a Proxy that captures timing and calls
|   emitQueryEvent() for every meaningful operation.
|
*/

const CACHE_KEY = `${process.env.APP_NAME || "app"}:telescope:queries`;
const MAX_CACHED_QUERIES = 200;

/** Compact JSON string of a MongoDB filter/pipeline argument (max 300 chars). */
function mongoArgSummary(val: unknown): string {
  try {
    return JSON.stringify(val ?? {}).slice(0, 300);
  } catch {
    return "{}";
  }
}

/** Emit a query event in-process or write to cross-process Cache. */
export async function emitQueryEvent(payload: {
  sql: string;
  bindings?: any[];
  duration: number;
  rows?: number;
  error?: string;
  connection: string;
  collection?: string;
}): Promise<void> {
  try {
    const { getEventDispatcher } = require("@/eloquent/Core/Events/EventDispatcher");
    const dispatcher = getEventDispatcher();

    if (dispatcher.hasListeners("db:query")) {
      // Same process as Telescope — dispatch directly (zero Cache overhead)
      dispatcher.dispatchNow("db:query", {
        sql: payload.sql,
        bindings: payload.bindings ?? [],
        duration: Math.round(payload.duration),
        rows: payload.rows ?? 0,
        error: payload.error,
        connection: payload.connection,
        collection: payload.collection,
      });
      return;
    }

    // Different process (e.g. artisan horizon:work) — write to Cache so
    // the HTTP server's Telescope can pick it up on its next poll.
    const { Cache } = require("@/cache");
    const entry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      sql: payload.sql,
      bindings: payload.bindings ?? [],
      duration: Math.round(payload.duration),
      rows: payload.rows ?? 0,
      error: payload.error,
      connection: payload.connection,
      collection: payload.collection,
      timestamp: Date.now(),
    };

    const existing: any[] = (await Cache.get(CACHE_KEY)) ?? [];
    existing.unshift(entry);
    if (existing.length > MAX_CACHED_QUERIES) existing.length = MAX_CACHED_QUERIES;
    await Cache.set(CACHE_KEY, existing, 3600);
  } catch {
    /* never break the query path */
  }
}

/** Promise-based MongoDB operations that resolve with a result directly. */
const MONGO_PROMISE_OPS = new Set([
  "insertOne", "insertMany",
  "updateOne", "updateMany", "replaceOne",
  "deleteOne", "deleteMany",
  "findOne", "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace",
  "countDocuments", "estimatedDocumentCount", "distinct", "bulkWrite",
]);

/** Cursor-returning MongoDB operations — we instrument toArray(). */
const MONGO_CURSOR_OPS = new Set([
  "find", "aggregate", "listIndexes",
]);

/**
 * Wraps a MongoCollection in a Proxy that times every operation and calls
 * emitQueryEvent() so Telescope captures it regardless of which process runs it.
 */
export function createMongoQueryProxy<T extends object>(
  collectionName: string,
  col: T,
): T {
  const emit = (
    op: string,
    filter: unknown,
    durationMs: number,
    rows?: number,
    error?: string,
  ): void => {
    emitQueryEvent({
      sql: `${collectionName}.${op}(${mongoArgSummary(filter)})`,
      duration: durationMs,
      rows,
      error,
      connection: "mongodb",
      collection: collectionName,
    }).catch(() => {});
  };

  return new Proxy(col, {
    get(target, prop: string | symbol) {
      const value = (target as any)[prop];

      if (typeof prop !== "string" || typeof value !== "function") {
        return value;
      }

      if (MONGO_PROMISE_OPS.has(prop)) {
        return (...args: any[]): Promise<any> => {
          const start = process.hrtime.bigint();
          const filter = args[0];
          return (value.apply(target, args) as Promise<any>)
            .then((res: any) => {
              const dur = Number((process.hrtime.bigint() - start) / 1_000_000n);
              const rowCount =
                res == null ? 0
                : Array.isArray(res) ? res.length
                : (res.insertedCount ?? res.modifiedCount ?? res.deletedCount ?? 1);
              emit(prop, filter, dur, rowCount);
              return res;
            })
            .catch((err: Error) => {
              const dur = Number((process.hrtime.bigint() - start) / 1_000_000n);
              emit(prop, filter, dur, 0, err.message);
              throw err;
            });
        };
      }

      if (MONGO_CURSOR_OPS.has(prop)) {
        return (...args: any[]) => {
          const start = process.hrtime.bigint();
          const filter = args[0];
          const cursor = value.apply(target, args);
          const origToArray = cursor.toArray.bind(cursor);
          cursor.toArray = async (): Promise<any[]> => {
            try {
              const rows: any[] = await origToArray();
              const dur = Number((process.hrtime.bigint() - start) / 1_000_000n);
              emit(prop, filter, dur, rows.length);
              return rows;
            } catch (err: any) {
              const dur = Number((process.hrtime.bigint() - start) / 1_000_000n);
              emit(prop, filter, dur, 0, err.message);
              throw err;
            }
          };
          return cursor;
        };
      }

      return value.bind(target);
    },
  }) as T;
}

/** The Cache key where cross-process query entries are stored. */
export const TELESCOPE_QUERY_CACHE_KEY = CACHE_KEY;
