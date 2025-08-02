"use strict";
/**
 * Main application class that manages global state and can host workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPApp = void 0;
exports.getDefaultApp = getDefaultApp;
exports.workflow = workflow;
exports.task = task;
exports.signal = signal;
const events_1 = require("events");
const context_1 = require("./core/context");
const serverRegistry_1 = require("./mcp/serverRegistry");
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
    async initialize() {
        if (this.initialized) {
            return;
        }
        console.log(`Initializing MCPApp '${this.name}'...`);
        try {
            // Initialize context
            this.context = await (0, context_1.initializeContext)(this.settings);
            // Set up context components
            this.setupContextComponents();
            // Set callbacks
            if (this.humanInputCallback) {
                this.context.human_input_callback = this.humanInputCallback;
            }
            if (this.elicitationCallback) {
                this.context.elicitation_callback = this.elicitationCallback;
            }
            // Store app reference in context
            this.context.app = this;
            // Process decorator metadata
            await this.processDecoratorMetadata();
            this.initialized = true;
            this.emit('initialized');
            console.log(`MCPApp '${this.name}' initialized successfully`);
        }
        catch (error) {
            console.error(`Failed to initialize MCPApp '${this.name}'`, error);
            throw error;
        }
    }
    /**
     * Start the application (context manager support)
     */
    async start() {
        if (this.running) {
            return this;
        }
        await this.initialize();
        this.running = true;
        this.emit('started');
        return this;
    }
    /**
     * Stop the application
     */
    async stop() {
        if (!this.running) {
            return;
        }
        console.log(`Stopping MCPApp '${this.name}'...`);
        try {
            if (this.context) {
                await (0, context_1.cleanupContext)();
            }
            this.running = false;
            this.initialized = false;
            this.emit('stopped');
            console.log(`MCPApp '${this.name}' stopped successfully`);
        }
        catch (error) {
            console.error(`Error stopping MCPApp '${this.name}'`, error);
            throw error;
        }
    }
    /**
     * Run the application as a context manager
     */
    async run() {
        await this.start();
        return new AppRunner(this);
    }
    /**
     * Get the application context
     */
    getContext() {
        if (!this.context) {
            throw new Error('Application not initialized');
        }
        return this.context;
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
    async createWorkflow(WorkflowClass, ...args) {
        if (!this.context) {
            throw new Error('Application not initialized');
        }
        // Create workflow instance with context injection
        const workflow = new WorkflowClass(this.context, ...args);
        // Register if decorated
        const metadata = this.decoratorMetadata.find(m => m.type === 'workflow' && m.target === WorkflowClass);
        if (metadata && this.context.workflow_registry) {
            this.context.workflow_registry.register(WorkflowClass.name, workflow);
        }
        return workflow;
    }
    /**
     * Execute a workflow
     */
    async executeWorkflow(WorkflowClass, ...args) {
        const workflow = await this.createWorkflow(WorkflowClass, ...args);
        if (typeof workflow.run === 'function') {
            return await workflow.run();
        }
        else {
            throw new Error(`Workflow ${WorkflowClass.name} does not have a run method`);
        }
    }
    /**
     * Set up context components
     */
    setupContextComponents() {
        if (!this.context) {
            return;
        }
        // Initialize registries
        this.context.server_registry = new serverRegistry_1.MCPServerRegistry(this.context.logger);
        // Initialize other registries (simplified for now)
        this.context.activity_registry = {
            register: (name, handler) => {
                // Implementation would go here
            },
            get: (name) => undefined
        };
        this.context.signal_registry = {
            register: (name, handler) => {
                // Implementation would go here
            },
            get: (name) => undefined
        };
        this.context.workflow_registry = {
            register: (name, workflow) => {
                // Implementation would go here
            },
            get: (name) => undefined
        };
        this.context.decorator_registry = {
            task: (fn) => fn,
            workflow: (cls) => cls,
            signal: (fn) => fn
        };
    }
    /**
     * Process decorator metadata collected during class definition
     */
    async processDecoratorMetadata() {
        for (const metadata of this.decoratorMetadata) {
            switch (metadata.type) {
                case 'workflow':
                    // Register workflow class
                    if (this.context?.workflow_registry) {
                        this.context.workflow_registry.register(metadata.target.name, metadata.target);
                    }
                    break;
                case 'task':
                    // Register task method
                    if (this.context?.activity_registry && metadata.propertyKey) {
                        const taskName = `${metadata.target.name}.${metadata.propertyKey}`;
                        this.context.activity_registry.register(taskName, metadata.target.prototype[metadata.propertyKey]);
                    }
                    break;
                case 'signal':
                    // Register signal handler
                    if (this.context?.signal_registry && metadata.propertyKey) {
                        const signalName = `${metadata.target.name}.${metadata.propertyKey}`;
                        this.context.signal_registry.register(signalName, metadata.target.prototype[metadata.propertyKey]);
                    }
                    break;
            }
        }
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
