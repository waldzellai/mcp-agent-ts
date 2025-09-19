/**
 * Main application class that manages global state and can host workflows
 */

import { EventEmitter } from 'events';
import { Data, Effect, pipe } from 'effect';
import {
    Context,
    Settings,
    initializeContextEffect,
    ServerRegistry,
    ActivityRegistry,
    SignalRegistry,
    WorkflowRegistry,
    DecoratorRegistry,
    ModelSelector,
    ContextInitializationError,
    ContextCleanupError
} from './core/context';
import { MCPServerRegistry } from './mcp/serverRegistry';
import { HumanInputCallback, ElicitationCallback } from './types/callbacks';

/**
 * Configuration options for MCPApp
 */
export interface MCPAppOptions {
    name?: string;
    settings?: Settings;
    human_input_callback?: HumanInputCallback;
    elicitation_callback?: ElicitationCallback;
}

/**
 * Decorator metadata storage
 */
interface DecoratorMetadata {
    type: 'workflow' | 'task' | 'signal';
    target: any;
    propertyKey?: string;
    options?: any;
}

export class AppInitializationError extends Data.TaggedError('AppInitializationError')<{
    readonly cause: unknown;
}> {}

export class AppStopError extends Data.TaggedError('AppStopError')<{
    readonly cause: unknown;
}> {}

export class WorkflowCreationError extends Data.TaggedError('WorkflowCreationError')<{
    readonly cause: unknown;
}> {}

export class WorkflowExecutionError extends Data.TaggedError('WorkflowExecutionError')<{
    readonly cause: unknown;
}> {}

const toError = (cause: unknown, fallback: string): Error => {
    if (cause instanceof Error) {
        return cause;
    }

    const message = typeof cause === 'string' && cause.length > 0 ? cause : fallback;
    const error = new Error(message);
    (error as { cause?: unknown }).cause = cause;
    return error;
};

/**
 * Main application class for MCP Agent
 */
export class MCPApp extends EventEmitter {
    public readonly name: string;
    private context?: Context;
    private settings: Settings;
    private humanInputCallback?: HumanInputCallback;
    private elicitationCallback?: ElicitationCallback;
    private decoratorMetadata: DecoratorMetadata[] = [];
    private initialized: boolean = false;
    private running: boolean = false;

    constructor(options: MCPAppOptions = {}) {
        super();
        this.name = options.name || 'mcp-agent-app';
        this.settings = {
            app_name: this.name,
            ...options.settings
        };
        this.humanInputCallback = options.human_input_callback;
        this.elicitationCallback = options.elicitation_callback;
    }

    /**
     * Initialize the application
     */
    public initializeEffect(): Effect.Effect<void, AppInitializationError> {
        const self = this;

        return pipe(
            Effect.gen(function*(_) {
                if (self.initialized) {
                    return;
                }

                yield* Effect.sync(() =>
                    console.log(`Initializing MCPApp '${self.name}'...`)
                );

                const context = yield* pipe(
                    initializeContextEffect(self.settings),
                    Effect.mapError(
                        (cause: ContextInitializationError) => new AppInitializationError({ cause })
                    )
                );

                self.context = context;

                yield* self.setupContextComponents();

                yield* Effect.sync(() => {
                    if (self.humanInputCallback) {
                        context.human_input_callback = self.humanInputCallback;
                    }
                    if (self.elicitationCallback) {
                        context.elicitation_callback = self.elicitationCallback;
                    }
                    context.app = self;
                });

                yield* self.processDecoratorMetadata();

                self.initialized = true;
                yield* Effect.sync(() => {
                    self.emit('initialized');
                    console.log(`MCPApp '${self.name}' initialized successfully`);
                });
            }),
            Effect.tapError(cause =>
                Effect.sync(() => {
                    console.error(`Failed to initialize MCPApp '${self.name}'`, cause);
                })
            ),
            Effect.mapError((cause: unknown) =>
                cause instanceof AppInitializationError
                    ? cause
                    : new AppInitializationError({ cause })
            )
        );
    }

    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await Effect.runPromise(this.initializeEffect());
        } catch (error) {
            if (error instanceof AppInitializationError) {
                throw toError(error.cause, `Failed to initialize MCPApp '${this.name}'`);
            }
            throw error;
        }
    }

    /**
     * Start the application (context manager support)
     */
    public startEffect(): Effect.Effect<this, AppInitializationError> {
        const self = this;

        return Effect.gen(function*(_) {
            if (self.running) {
                return self;
            }

            yield* self.initializeEffect();

            self.running = true;
            yield* Effect.sync(() => self.emit('started'));

            return self;
        });
    }

    public async start(): Promise<this> {
        try {
            return await Effect.runPromise(this.startEffect());
        } catch (error) {
            if (error instanceof AppInitializationError) {
                throw toError(error.cause, `Failed to start MCPApp '${this.name}'`);
            }
            throw error;
        }
    }

    /**
     * Stop the application
     */
    public stopEffect(): Effect.Effect<void, AppStopError> {
        const self = this;

        return pipe(
            Effect.gen(function*(_) {
                if (!self.running) {
                    return;
                }

                yield* Effect.sync(() =>
                    console.log(`Stopping MCPApp '${self.name}'...`)
                );

                if (self.context) {
                    yield* pipe(
                        self.context.cleanupEffect(),
                        Effect.catchAll((cause: ContextCleanupError) =>
                            Effect.fail(new AppStopError({ cause }))
                        )
                    );
                }

                self.running = false;
                self.initialized = false;
                yield* Effect.sync(() => {
                    self.emit('stopped');
                    console.log(`MCPApp '${self.name}' stopped successfully`);
                });
            }),
            Effect.tapError(cause =>
                Effect.sync(() =>
                    console.error(`Error stopping MCPApp '${self.name}'`, cause)
                )
            ),
            Effect.mapError((cause: unknown) =>
                cause instanceof AppStopError ? cause : new AppStopError({ cause })
            )
        );
    }

    public async stop(): Promise<void> {
        try {
            await Effect.runPromise(this.stopEffect());
        } catch (error) {
            if (error instanceof AppStopError) {
                throw toError(error.cause, `Error stopping MCPApp '${this.name}'`);
            }
            throw error;
        }
    }

    /**
     * Run the application as a context manager
     */
    public runEffect(): Effect.Effect<AppRunner, AppInitializationError> {
        return pipe(
            this.startEffect(),
            Effect.map(() => new AppRunner(this))
        );
    }

    public async run(): Promise<AppRunner> {
        try {
            return await Effect.runPromise(this.runEffect());
        } catch (error) {
            if (error instanceof AppInitializationError) {
                throw toError(error.cause, `Failed to run MCPApp '${this.name}'`);
            }
            throw error;
        }
    }

    /**
     * Register an MCP server
     */
    public registerServer(name: string, config: any): void {
        if (!this.context?.server_registry) {
            throw new Error('Server registry not initialized');
        }
        this.context.server_registry.register(name, config);
    }

    /**
     * Workflow decorator
     */
    public workflow<T extends { new(...args: any[]): {} }>(constructor: T): T {
        this.decoratorMetadata.push({
            type: 'workflow',
            target: constructor
        });
        return constructor;
    }

    /**
     * Task decorator
     */
    public task(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        this.decoratorMetadata.push({
            type: 'task',
            target: target.constructor,
            propertyKey
        });
        return descriptor;
    }

    /**
     * Signal decorator
     */
    public signal(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        this.decoratorMetadata.push({
            type: 'signal',
            target: target.constructor,
            propertyKey
        });
        return descriptor;
    }

    /**
     * Create a workflow instance
     */
    public createWorkflowEffect<T>(
        WorkflowClass: new (...args: any[]) => T,
        ...args: any[]
    ): Effect.Effect<T, WorkflowCreationError> {
        const self = this;

        return Effect.gen(function*(_) {
            if (!self.context) {
                return yield* Effect.fail(
                    new WorkflowCreationError({ cause: new Error('Application not initialized') })
                );
            }

            const workflow = yield* Effect.try({
                try: () => new WorkflowClass(self.context, ...args),
                catch: cause => new WorkflowCreationError({ cause })
            });

            const metadata = self.decoratorMetadata.find(
                m => m.type === 'workflow' && m.target === WorkflowClass
            );

            if (metadata && self.context.workflow_registry) {
                self.context.workflow_registry.register(WorkflowClass.name, workflow);
            }

            return workflow;
        });
    }

    public async createWorkflow<T>(
        WorkflowClass: new (...args: any[]) => T,
        ...args: any[]
    ): Promise<T> {
        try {
            return await Effect.runPromise(this.createWorkflowEffect(WorkflowClass, ...args));
        } catch (error) {
            if (error instanceof WorkflowCreationError) {
                throw toError(error.cause, `Failed to create workflow ${WorkflowClass.name}`);
            }
            throw error;
        }
    }

    /**
     * Execute a workflow
     */
    public executeWorkflowEffect<T>(
        WorkflowClass: new (...args: any[]) => any,
        ...args: any[]
    ): Effect.Effect<T, WorkflowCreationError | WorkflowExecutionError> {
        const self = this;

        return Effect.gen(function*(_) {
            const workflow = yield* self.createWorkflowEffect(WorkflowClass, ...args);

            if (typeof (workflow as any).run !== 'function') {
                yield* Effect.fail(
                    new WorkflowExecutionError({
                        cause: new Error(`Workflow ${WorkflowClass.name} does not have a run method`)
                    })
                );
            }

            const result = yield* Effect.tryPromise<T, WorkflowExecutionError>({
                try: () => (workflow as any).run(),
                catch: cause => new WorkflowExecutionError({ cause })
            });

            return result;
        });
    }

    public async executeWorkflow<T>(
        WorkflowClass: new (...args: any[]) => any,
        ...args: any[]
    ): Promise<T> {
        try {
            return await Effect.runPromise(this.executeWorkflowEffect<T>(WorkflowClass, ...args));
        } catch (error) {
            if (error instanceof WorkflowCreationError || error instanceof WorkflowExecutionError) {
                throw toError(error.cause, `Failed to execute workflow ${WorkflowClass.name}`);
            }
            throw error;
        }
    }

    /**
     * Set up context components
     */
    private setupContextComponents(): Effect.Effect<void> {
        return Effect.sync(() => {
            if (!this.context) {
                return;
            }

            this.context.server_registry = new MCPServerRegistry(this.context.logger);

            this.context.activity_registry = {
                register: (_name: string, _handler: Function) => {
                    // Implementation would go here
                },
                get: (_name: string) => undefined
            };

            this.context.signal_registry = {
                register: (_name: string, _handler: Function) => {
                    // Implementation would go here
                },
                get: (_name: string) => undefined
            };

            this.context.workflow_registry = {
                register: (_name: string, _workflow: any) => {
                    // Implementation would go here
                },
                get: (_name: string) => undefined
            };

            this.context.decorator_registry = {
                task: (fn: Function) => fn,
                workflow: (cls: any) => cls,
                signal: (fn: Function) => fn
            };
        });
    }

    /**
     * Process decorator metadata collected during class definition
     */
    private processDecoratorMetadata(): Effect.Effect<void> {
        const self = this;

        return Effect.sync(() => {
            for (const metadata of self.decoratorMetadata) {
                switch (metadata.type) {
                    case 'workflow':
                        if (self.context?.workflow_registry) {
                            self.context.workflow_registry.register(
                                metadata.target.name,
                                metadata.target
                            );
                        }
                        break;

                    case 'task':
                        if (self.context?.activity_registry && metadata.propertyKey) {
                            const taskName = `${metadata.target.name}.${metadata.propertyKey}`;
                            self.context.activity_registry.register(
                                taskName,
                                metadata.target.prototype[metadata.propertyKey]
                            );
                        }
                        break;

                    case 'signal':
                        if (self.context?.signal_registry && metadata.propertyKey) {
                            const signalName = `${metadata.target.name}.${metadata.propertyKey}`;
                            self.context.signal_registry.register(
                                signalName,
                                metadata.target.prototype[metadata.propertyKey]
                            );
                        }
                        break;
                }
            }
        });
    }

    /**
     * Update application settings
     */
    public updateSettings(settings: Partial<Settings>): void {
        this.settings = { ...this.settings, ...settings };
        if (this.context) {
            this.context.updateSettings(settings);
        }
    }

    /**
     * Get application statistics
     */
    public getStats(): {
        name: string;
        initialized: boolean;
        running: boolean;
        serverCount: number;
        workflowCount: number;
    } {
        const serverCount = this.context?.server_registry?.list().length || 0;
        const workflowCount = this.decoratorMetadata.filter(m => m.type === 'workflow').length;

        return {
            name: this.name,
            initialized: this.initialized,
            running: this.running,
            serverCount,
            workflowCount
        };
    }
}

/**
 * Helper class for context manager pattern
 */
class AppRunner {
    constructor(private app: MCPApp) {}

    public async __aenter__(): Promise<MCPApp> {
        return this.app;
    }

    public async __aexit__(excType?: any, excVal?: any, excTb?: any): Promise<void> {
        await this.app.stop();
    }
}

/**
 * Global app instance tracking (optional)
 */
let defaultApp: MCPApp | undefined;

/**
 * Get or create the default app instance
 */
export function getDefaultApp(options?: MCPAppOptions): MCPApp {
    if (!defaultApp) {
        defaultApp = new MCPApp(options);
    }
    return defaultApp;
}

/**
 * Decorator factory functions for use with default app
 */
export function workflow<T extends { new(...args: any[]): {} }>(constructor: T): T {
    return getDefaultApp().workflow(constructor);
}

export function task(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    return getDefaultApp().task(target, propertyKey, descriptor);
}

export function signal(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    return getDefaultApp().signal(target, propertyKey, descriptor);
}
