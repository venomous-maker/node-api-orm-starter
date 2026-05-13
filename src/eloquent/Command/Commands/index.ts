/*
|--------------------------------------------------------------------------
| Eloquent System Commands Index
|--------------------------------------------------------------------------
|
| These are the core framework commands that come with the eloquent package.
| They are registered automatically by the Kernel.
|
*/

// Cache Commands
export {
  CacheClearCommand,
  CacheListCommand,
  CacheGetCommand,
  CacheSetCommand,
  CacheForgetCommand,
  CacheHasCommand,
  CacheKeyCommand,
  CacheDriverCommand,
} from "./CacheCommands";

// Key Commands
export { KeyGenerateCommand } from "./KeyGenerateCommand";

// Migration Commands
export {
  MigrateCommand,
  MigrateFreshCommand,
  MigrateRollbackCommand,
  MigrateStatusCommand,
  MakeMigrationCommand,
} from "./MigrationCommands";

// Database Commands
export { DbSeedCommand, DbWipeCommand, MakeSeederCommand } from "./DatabaseCommands";

// Route Commands
export { RouteListCommand } from "./RouteCommands";

// Queue Commands
export {
  QueueWorkCommand,
  QueueListenCommand,
  QueueRestartCommand,
  QueueRetryCommand,
  QueueForgetCommand,
  QueueFlushCommand,
  QueueFailedCommand,
  QueueClearCommand,
  QueueStatusCommand,
  QueueJobsCommand,
  ScheduleRunCommand,
  ScheduleWorkCommand,
  ScheduleListCommand,
} from "./QueueCommands";

// Event Commands
export {
  EventListCommand,
  EventDispatchCommand,
  EventClearCommand,
  EventGenerateCommand,
  ListenerGenerateCommand,
  SubscriberGenerateCommand,
} from "./EventCommands";

// Broadcast Commands
export {
  BroadcastConnectionsCommand,
  BroadcastChannelsCommand,
  BroadcastTerminateCommand,
  BroadcastSendCommand,
} from "./BroadcastCommands";

// Documentation Commands
export { DocsGenerateCommand, DocsListCommand } from "./DocsCommands";

// Horizon Commands
export {
  HorizonWorkCommand,
  HorizonPauseCommand,
  HorizonContinueCommand,
  HorizonTerminateCommand,
  HorizonStatusCommand,
  HorizonListCommand,
} from "@/eloquent/Horizon/Commands/HorizonCommands";
