"use strict";
/**
 * Central context object to store global state shared across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupContextEffect = exports.initializeContextEffect = exports.Context = exports.ContextCleanupError = exports.ContextInitializationError = void 0;
exports.initializeContext = initializeContext;
exports.cleanupContext = cleanupContext;
const events_1 = require("events");
const effect_1 = require("effect");
const exceptions_1 = require("./exceptions");
const index_1 = require("../executor/index");
class ContextInitializationError extends effect_1.Data.TaggedError('ContextInitializationError') {
}
exports.ContextInitializationError = ContextInitializationError;
class ContextCleanupError extends effect_1.Data.TaggedError('ContextCleanupError') {
}
exports.ContextCleanupError = ContextCleanupError;
const formatUnknown = (cause) => {
    if (cause instanceof Error) {
        return cause.message;
    }
    if (typeof cause === 'string') {
        return cause;
    }
    try {
        return JSON.stringify(cause);
    }
    catch {
        return String(cause);
    }
};
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
 * Central context object containing all shared application state
 */
class Context extends events_1.EventEmitter {
    app_name;
    settings;
    logger;
    executor;
    server_registry;
    activity_registry;
    signal_registry;
    workflow_registry;
    decorator_registry;
    model_selector;
    token_counter;
    // Callback handlers
    human_input_callback;
    elicitation_callback;
    signal_wait_callback;
    // Application reference
    app; // MCPApp instance
    static instance;
    initialized = false;
    constructor(settings = {}) {
        super();
        this.app_name = settings.app_name || 'mcp-agent';
        this.settings = settings;
        // Initialize with console logger by default
        this.logger = this.createDefaultLogger();
    }
    /**
     * Get or create the singleton context instance
     */
    static getInstance(settings) {
        if (!Context.instance) {
            Context.instance = new Context(settings || {});
        }
        return Context.instance;
    }
    /**
     * Initialize the context with all required components
     */
    initializeEffect() {
        const self = this;
        return (0, effect_1.pipe)(effect_1.Effect.gen(function* (_) {
            if (self.initialized) {
                return;
            }
            yield* effect_1.Effect.sync(() => self.logger.info('Initializing context...'));
            if (self.settings.executor_type === 'temporal') {
                yield* effect_1.Effect.sync(() => self.logger.info('Temporal executor initialization not yet implemented'));
            }
            else {
                self.executor = new BasicExecutorAdapter(new index_1.BaseExecutor());
                yield* effect_1.Effect.tryPromise({
                    try: () => self.executor.start(),
                    catch: cause => new ContextInitializationError({ cause })
                });
                yield* effect_1.Effect.sync(() => self.logger.info('Default executor initialized'));
            }
            self.initialized = true;
            yield* effect_1.Effect.sync(() => {
                self.logger.info('Context initialized successfully');
                self.emit('initialized');
            });
        }), effect_1.Effect.tapError(cause => effect_1.Effect.sync(() => {
            self.logger.error('Failed to initialize context', cause);
        })), effect_1.Effect.mapError(cause => cause instanceof ContextInitializationError
            ? cause
            : new ContextInitializationError({ cause })));
    }
    async initialize() {
        try {
            await effect_1.Effect.runPromise(this.initializeEffect());
        }
        catch (error) {
            if (error instanceof ContextInitializationError) {
                const configurationError = new exceptions_1.ConfigurationError(`Context initialization failed: ${formatUnknown(error.cause)}`);
                configurationError.cause = error.cause;
                throw configurationError;
            }
            throw error;
        }
    }
    /**
     * Clean up context resources
     */
    cleanupEffect() {
        const self = this;
        return (0, effect_1.pipe)(effect_1.Effect.gen(function* (_) {
            yield* effect_1.Effect.sync(() => self.logger.info('Cleaning up context...'));
            if (self.executor) {
                yield* effect_1.Effect.tryPromise({
                    try: () => self.executor.stop(),
                    catch: cause => new ContextCleanupError({ cause })
                });
            }
            self.initialized = false;
            yield* effect_1.Effect.sync(() => {
                self.emit('cleanup');
                self.logger.info('Context cleanup completed');
            });
        }), effect_1.Effect.tapError(cause => effect_1.Effect.sync(() => {
            self.logger.error('Error during context cleanup', cause);
        })), effect_1.Effect.mapError(cause => cause instanceof ContextCleanupError ? cause : new ContextCleanupError({ cause })));
    }
    async cleanup() {
        try {
            await effect_1.Effect.runPromise(this.cleanupEffect());
        }
        catch (error) {
            if (error instanceof ContextCleanupError) {
                throw toError(error.cause, 'Context cleanup failed');
            }
            throw error;
        }
    }
    /**
     * Create a default console logger
     */
    createDefaultLogger() {
        const level = this.settings.logging?.level || 'info';
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(level);
        return {
            debug: (message, ...args) => {
                if (currentLevelIndex <= 0) {
                    console.debug(`[${this.app_name}] DEBUG:`, message, ...args);
                }
            },
            info: (message, ...args) => {
                if (currentLevelIndex <= 1) {
                    console.info(`[${this.app_name}] INFO:`, message, ...args);
                }
            },
            warn: (message, ...args) => {
                if (currentLevelIndex <= 2) {
                    console.warn(`[${this.app_name}] WARN:`, message, ...args);
                }
            },
            error: (message, ...args) => {
                console.error(`[${this.app_name}] ERROR:`, message, ...args);
            }
        };
    }
    /**
     * Update context settings
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.emit('settings-updated', this.settings);
    }
    /**
     * Check if context is properly initialized
     */
    isInitialized() {
        return this.initialized;
    }
}
exports.Context = Context;
/**
 * Global context initialization helper
 */
const initializeContextEffect = (settings) => effect_1.Effect.gen(function* (_) {
    const context = Context.getInstance(settings);
    yield* context.initializeEffect();
    return context;
});
exports.initializeContextEffect = initializeContextEffect;
async function initializeContext(settings) {
    try {
        return await effect_1.Effect.runPromise((0, exports.initializeContextEffect)(settings));
    }
    catch (error) {
        if (error instanceof ContextInitializationError) {
            const configurationError = new exceptions_1.ConfigurationError(`Context initialization failed: ${formatUnknown(error.cause)}`);
            configurationError.cause = error.cause;
            throw configurationError;
        }
        throw error;
    }
}
/**
 * Global context cleanup helper
 */
const cleanupContextEffect = () => Context.getInstance().cleanupEffect();
exports.cleanupContextEffect = cleanupContextEffect;
async function cleanupContext() {
    try {
        await effect_1.Effect.runPromise((0, exports.cleanupContextEffect)());
    }
    catch (error) {
        if (error instanceof ContextCleanupError) {
            throw toError(error.cause, 'Context cleanup failed');
        }
        throw error;
    }
}
/**
 * Adapter to bridge BaseExecutor to the Context.Executor interface
 */
class BasicExecutorAdapter {
    type = 'asyncio';
    base;
    constructor(base) {
        this.base = base;
    }
    async start() {
        // No-op for in-process executor
    }
    async stop() {
        // Wait for running tasks to complete; no explicit shutdown needed
        await this.base.waitForAllTasks();
    }
    async execute(task) {
        const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        return this.base.enqueueTask({ id, name: id, execute: task });
    }
}
