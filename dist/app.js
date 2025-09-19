"use strict";
/**
 * Main application class that manages global state and can host workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPApp = exports.WorkflowExecutionError = exports.WorkflowCreationError = exports.AppStopError = exports.AppInitializationError = void 0;
exports.getDefaultApp = getDefaultApp;
exports.workflow = workflow;
exports.task = task;
exports.signal = signal;
const events_1 = require("events");
const effect_1 = require("effect");
const context_1 = require("./core/context");
const serverRegistry_1 = require("./mcp/serverRegistry");
class AppInitializationError extends effect_1.Data.TaggedError('AppInitializationError') {
}
exports.AppInitializationError = AppInitializationError;
class AppStopError extends effect_1.Data.TaggedError('AppStopError') {
}
exports.AppStopError = AppStopError;
class WorkflowCreationError extends effect_1.Data.TaggedError('WorkflowCreationError') {
}
exports.WorkflowCreationError = WorkflowCreationError;
class WorkflowExecutionError extends effect_1.Data.TaggedError('WorkflowExecutionError') {
}
exports.WorkflowExecutionError = WorkflowExecutionError;
const toError = (cause, fallback) => {
    if (cause instanceof Error) {
        return cause;
    }
    const message = typeof cause === 'string' && cause.length > 0 ? cause : fallback;
    const error = new Error(message);
    error.cause = cause;
    return error;
};
/**
 * Main application class for MCP Agent
 */
class MCPApp extends events_1.EventEmitter {
    name;
    context;
    settings;
    humanInputCallback;
    elicitationCallback;
    decoratorMetadata = [];
    initialized = false;
    running = false;
    constructor(options = {}) {
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
    initializeEffect() {
        const self = this;
        return (0, effect_1.pipe)(effect_1.Effect.gen(function* (_) {
            if (self.initialized) {
                return;
            }
            yield* effect_1.Effect.sync(() => console.log(`Initializing MCPApp '${self.name}'...`));
            const context = yield* (0, effect_1.pipe)((0, context_1.initializeContextEffect)(self.settings), effect_1.Effect.mapError((cause) => new AppInitializationError({ cause })));
            self.context = context;
            yield* self.setupContextComponents();
            yield* effect_1.Effect.sync(() => {
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
            yield* effect_1.Effect.sync(() => {
                self.emit('initialized');
                console.log(`MCPApp '${self.name}' initialized successfully`);
            });
        }), effect_1.Effect.tapError(cause => effect_1.Effect.sync(() => {
            console.error(`Failed to initialize MCPApp '${self.name}'`, cause);
        })), effect_1.Effect.mapError((cause) => cause instanceof AppInitializationError
            ? cause
            : new AppInitializationError({ cause })));
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            await effect_1.Effect.runPromise(this.initializeEffect());
        }
        catch (error) {
            if (error instanceof AppInitializationError) {
                throw toError(error.cause, `Failed to initialize MCPApp '${this.name}'`);
            }
            throw error;
        }
    }
    /**
     * Start the application (context manager support)
     */
    startEffect() {
        const self = this;
        return effect_1.Effect.gen(function* (_) {
            if (self.running) {
                return self;
            }
            yield* self.initializeEffect();
            self.running = true;
            yield* effect_1.Effect.sync(() => self.emit('started'));
            return self;
        });
    }
    async start() {
        try {
            return await effect_1.Effect.runPromise(this.startEffect());
        }
        catch (error) {
            if (error instanceof AppInitializationError) {
                throw toError(error.cause, `Failed to start MCPApp '${this.name}'`);
            }
            throw error;
        }
    }
    /**
     * Stop the application
     */
    stopEffect() {
        const self = this;
        return (0, effect_1.pipe)(effect_1.Effect.gen(function* (_) {
            if (!self.running) {
                return;
            }
            yield* effect_1.Effect.sync(() => console.log(`Stopping MCPApp '${self.name}'...`));
            if (self.context) {
                yield* (0, effect_1.pipe)(self.context.cleanupEffect(), effect_1.Effect.catchAll((cause) => effect_1.Effect.fail(new AppStopError({ cause }))));
            }
            self.running = false;
            self.initialized = false;
            yield* effect_1.Effect.sync(() => {
                self.emit('stopped');
                console.log(`MCPApp '${self.name}' stopped successfully`);
            });
        }), effect_1.Effect.tapError(cause => effect_1.Effect.sync(() => console.error(`Error stopping MCPApp '${self.name}'`, cause))), effect_1.Effect.mapError((cause) => cause instanceof AppStopError ? cause : new AppStopError({ cause })));
    }
    async stop() {
        try {
            await effect_1.Effect.runPromise(this.stopEffect());
        }
        catch (error) {
            if (error instanceof AppStopError) {
                throw toError(error.cause, `Error stopping MCPApp '${this.name}'`);
            }
            throw error;
        }
    }
    /**
     * Run the application as a context manager
     */
    runEffect() {
        return (0, effect_1.pipe)(this.startEffect(), effect_1.Effect.map(() => new AppRunner(this)));
    }
    async run() {
        try {
            return await effect_1.Effect.runPromise(this.runEffect());
        }
        catch (error) {
            if (error instanceof AppInitializationError) {
                throw toError(error.cause, `Failed to run MCPApp '${this.name}'`);
            }
            throw error;
        }
    }
    /**
     * Register an MCP server
     */
    registerServer(name, config) {
        if (!this.context?.server_registry) {
            throw new Error('Server registry not initialized');
        }
        this.context.server_registry.register(name, config);
    }
    /**
     * Workflow decorator
     */
    workflow(constructor) {
        this.decoratorMetadata.push({
            type: 'workflow',
            target: constructor
        });
        return constructor;
    }
    /**
     * Task decorator
     */
    task(target, propertyKey, descriptor) {
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
    signal(target, propertyKey, descriptor) {
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
    createWorkflowEffect(WorkflowClass, ...args) {
        const self = this;
        return effect_1.Effect.gen(function* (_) {
            if (!self.context) {
                return yield* effect_1.Effect.fail(new WorkflowCreationError({ cause: new Error('Application not initialized') }));
            }
            const workflow = yield* effect_1.Effect.try({
                try: () => new WorkflowClass(self.context, ...args),
                catch: cause => new WorkflowCreationError({ cause })
            });
            const metadata = self.decoratorMetadata.find(m => m.type === 'workflow' && m.target === WorkflowClass);
            if (metadata && self.context.workflow_registry) {
                self.context.workflow_registry.register(WorkflowClass.name, workflow);
            }
            return workflow;
        });
    }
    async createWorkflow(WorkflowClass, ...args) {
        try {
            return await effect_1.Effect.runPromise(this.createWorkflowEffect(WorkflowClass, ...args));
        }
        catch (error) {
            if (error instanceof WorkflowCreationError) {
                throw toError(error.cause, `Failed to create workflow ${WorkflowClass.name}`);
            }
            throw error;
        }
    }
    /**
     * Execute a workflow
     */
    executeWorkflowEffect(WorkflowClass, ...args) {
        const self = this;
        return effect_1.Effect.gen(function* (_) {
            const workflow = yield* self.createWorkflowEffect(WorkflowClass, ...args);
            if (typeof workflow.run !== 'function') {
                yield* effect_1.Effect.fail(new WorkflowExecutionError({
                    cause: new Error(`Workflow ${WorkflowClass.name} does not have a run method`)
                }));
            }
            const result = yield* effect_1.Effect.tryPromise({
                try: () => workflow.run(),
                catch: cause => new WorkflowExecutionError({ cause })
            });
            return result;
        });
    }
    async executeWorkflow(WorkflowClass, ...args) {
        try {
            return await effect_1.Effect.runPromise(this.executeWorkflowEffect(WorkflowClass, ...args));
        }
        catch (error) {
            if (error instanceof WorkflowCreationError || error instanceof WorkflowExecutionError) {
                throw toError(error.cause, `Failed to execute workflow ${WorkflowClass.name}`);
            }
            throw error;
        }
    }
    /**
     * Set up context components
     */
    setupContextComponents() {
        return effect_1.Effect.sync(() => {
            if (!this.context) {
                return;
            }
            this.context.server_registry = new serverRegistry_1.MCPServerRegistry(this.context.logger);
            this.context.activity_registry = {
                register: (_name, _handler) => {
                    // Implementation would go here
                },
                get: (_name) => undefined
            };
            this.context.signal_registry = {
                register: (_name, _handler) => {
                    // Implementation would go here
                },
                get: (_name) => undefined
            };
            this.context.workflow_registry = {
                register: (_name, _workflow) => {
                    // Implementation would go here
                },
                get: (_name) => undefined
            };
            this.context.decorator_registry = {
                task: (fn) => fn,
                workflow: (cls) => cls,
                signal: (fn) => fn
            };
        });
    }
    /**
     * Process decorator metadata collected during class definition
     */
    processDecoratorMetadata() {
        const self = this;
        return effect_1.Effect.sync(() => {
            for (const metadata of self.decoratorMetadata) {
                switch (metadata.type) {
                    case 'workflow':
                        if (self.context?.workflow_registry) {
                            self.context.workflow_registry.register(metadata.target.name, metadata.target);
                        }
                        break;
                    case 'task':
                        if (self.context?.activity_registry && metadata.propertyKey) {
                            const taskName = `${metadata.target.name}.${metadata.propertyKey}`;
                            self.context.activity_registry.register(taskName, metadata.target.prototype[metadata.propertyKey]);
                        }
                        break;
                    case 'signal':
                        if (self.context?.signal_registry && metadata.propertyKey) {
                            const signalName = `${metadata.target.name}.${metadata.propertyKey}`;
                            self.context.signal_registry.register(signalName, metadata.target.prototype[metadata.propertyKey]);
                        }
                        break;
                }
            }
        });
    }
    /**
     * Update application settings
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        if (this.context) {
            this.context.updateSettings(settings);
        }
    }
    /**
     * Get application statistics
     */
    getStats() {
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
exports.MCPApp = MCPApp;
/**
 * Helper class for context manager pattern
 */
class AppRunner {
    app;
    constructor(app) {
        this.app = app;
    }
    async __aenter__() {
        return this.app;
    }
    async __aexit__(excType, excVal, excTb) {
        await this.app.stop();
    }
}
/**
 * Global app instance tracking (optional)
 */
let defaultApp;
/**
 * Get or create the default app instance
 */
function getDefaultApp(options) {
    if (!defaultApp) {
        defaultApp = new MCPApp(options);
    }
    return defaultApp;
}
/**
 * Decorator factory functions for use with default app
 */
function workflow(constructor) {
    return getDefaultApp().workflow(constructor);
}
function task(target, propertyKey, descriptor) {
    return getDefaultApp().task(target, propertyKey, descriptor);
}
function signal(target, propertyKey, descriptor) {
    return getDefaultApp().signal(target, propertyKey, descriptor);
}
