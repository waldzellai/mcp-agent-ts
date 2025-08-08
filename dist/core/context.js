"use strict";
/**
 * Central context object to store global state shared across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
exports.initializeContext = initializeContext;
exports.cleanupContext = cleanupContext;
const events_1 = require("events");
const exceptions_1 = require("./exceptions");
const index_1 = require("../executor/index");
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
    async initialize() {
        if (this.initialized) {
            return;
        }
        this.logger.info('Initializing context...');
        try {
            // Initialize executor based on settings
            if (this.settings.executor_type === 'temporal') {
                // TODO: Initialize Temporal executor
                this.logger.info('Temporal executor initialization not yet implemented');
            }
            else {
                // Initialize default in-process executor
                this.executor = new BasicExecutorAdapter(new index_1.BaseExecutor());
                await this.executor.start();
                this.logger.info('Default executor initialized');
            }
            // Initialize registries
            // These will be implemented as we port the respective modules
            this.initialized = true;
            this.logger.info('Context initialized successfully');
            this.emit('initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize context', error);
            throw new exceptions_1.ConfigurationError(`Context initialization failed: ${error}`);
        }
    }
    /**
     * Clean up context resources
     */
    async cleanup() {
        this.logger.info('Cleaning up context...');
        try {
            if (this.executor) {
                await this.executor.stop();
            }
            this.initialized = false;
            this.emit('cleanup');
            this.logger.info('Context cleanup completed');
        }
        catch (error) {
            this.logger.error('Error during context cleanup', error);
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
async function initializeContext(settings) {
    const context = Context.getInstance(settings);
    await context.initialize();
    return context;
}
/**
 * Global context cleanup helper
 */
async function cleanupContext() {
    const context = Context.getInstance();
    await context.cleanup();
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
