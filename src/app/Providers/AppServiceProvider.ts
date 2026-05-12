import { ServiceProvider, ServiceProviderClass } from '@/eloquent/Providers/ServiceProvider';
import {DatabaseServiceProvider} from "@app/Providers/DatabaseServiceProvider";
import {CacheServiceProvider} from "@app/Providers/CacheServiceProvider";
import {RouteServiceProvider} from "@/app";
import {QueueServiceProvider} from "@app/Providers/QueueServiceProvider";
import {EventServiceProvider} from "@app/Providers/EventServiceProvider";
import {BroadcastServiceProvider} from "@app/Providers/BroadcastServiceProvider";
import MiddlewareServiceProvider from "@app/Providers/MiddlewareServiceProvider";
import {DocServiceProvider} from "@app/Providers/DocServiceProvider";
import {AuthService} from "@app/Services/AuthService";
import {UserService} from "@app/Services/UserService";
import {RoleService} from "@app/Services/RoleService";
import {PermissionService} from "@app/Services/PermissionService";
import {FileService} from "@app/Services/FileService";

export class AppServiceProvider extends ServiceProvider {
    /*
    |--------------------------------------------------------------------------
    | Additional Providers to Register
    |--------------------------------------------------------------------------
    |
    | These providers will be registered when this provider is registered.
    | This allows for modular provider organization.
    |
    */
    protected additionalProviders: ServiceProviderClass[] = [
        DatabaseServiceProvider,
        CacheServiceProvider,
        MiddlewareServiceProvider,
        RouteServiceProvider,
        QueueServiceProvider,
        EventServiceProvider,
        BroadcastServiceProvider,
        DocServiceProvider,
        // Example: BillingServiceProvider,
        // Example: NotificationServiceProvider,
    ];

    /*
    |--------------------------------------------------------------------------
    | Register any application services
    |--------------------------------------------------------------------------
    */
    register(): void {
        // Register additional providers
        this.registerProviders(this.additionalProviders);

        // Services
        this.singleton(AuthService);
        this.singleton(UserService);
        this.singleton(RoleService);
        this.singleton(PermissionService);
        this.singleton(FileService);
    }

    /*
    |--------------------------------------------------------------------------
    | Bootstrap any application services
    |--------------------------------------------------------------------------
    */
    boot(): void {
        this.registerObservers();
        this.registerLifecycleCallbacks();
    }

    /*
    |--------------------------------------------------------------------------
    | Register Model Observers
    |--------------------------------------------------------------------------
    */
    protected registerObservers(): void {
        // Example: Register an observer for the User model
        // const models: Array<typeof Model> = [User];
        // for (const model of models) {
        //     if (typeof model.observe === 'function') {
        //         model.observe(YourObserver);
        //     }
        // }
    }

    /*
    |--------------------------------------------------------------------------
    | Register Lifecycle Callbacks
    |--------------------------------------------------------------------------
    */
    protected registerLifecycleCallbacks(): void {
        // Register a callback to run after all providers have booted
        this.booted(() => {
            // This runs after all providers have finished booting
            // Useful for tasks that depend on all services being available
        });
    }
}
