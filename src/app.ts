/**
 * Main application class that manages global state and can host workflows
 */

import { EventEmitter } from 'events';
import { 
    Context, 
    Settings, 
    initializeContext, 
    cleanupContext,
    ServerRegistry,
    ActivityRegistry,
    SignalRegistry,
    WorkflowRegistry,
    DecoratorRegistry,
    ModelSelector
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
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        console.log(`Initializing MCPApp '${this.name}'...`);

        try {
            // Initialize context
            this.context = await initializeContext(this.settings);
            
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
        } catch (error) {
            console.error(`Failed to initialize MCPApp '${this.name}'`, error);
            throw error;
        }
    }

    /**
     * Start the application (context manager support)
     */
    public async start(): Promise<this> {
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
    public async stop(): Promise<void> {
        if (!this.running) {
            return;
        }

        console.log(`Stopping MCPApp '${this.name}'...`);

        try {
            if (this.context) {
                await cleanupContext();
            }

            this.running = false;
            this.initialized = false;
            this.emit('stopped');
            console.log(`MCPApp '${this.name}' stopped successfully`);
        } catch (error) {
            console.error(`Error stopping MCPApp '${this.name}'`, error);
            throw error;
        }
    }

    /**
     * Run the application as a context manager
     */
    public async run(): Promise<AppRunner> {
        await this.start();
        return new AppRunner(this);
    }

    /**
     * Get the application context
     */
    public getContext(): Context {
        if (!this.context) {
            throw new Error('Application not initialized');
        }
        return this.context;
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
    public async createWorkflow<T>(WorkflowClass: new (...args: any[]) => T, ...args: any[]): Promise<T> {
        if (!this.context) {
            throw new Error('Application not initialized');
        }

        // Create workflow instance with context injection
        const workflow = new WorkflowClass(this.context, ...args);
        
        // Register if decorated
        const metadata = this.decoratorMetadata.find(
            m => m.type === 'workflow' && m.target === WorkflowClass
        );
        
        if (metadata && this.context.workflow_registry) {
            this.context.workflow_registry.register(WorkflowClass.name, workflow);
        }

        return workflow;
    }

    /**
     * Execute a workflow
     */
    public async executeWorkflow<T>(WorkflowClass: new (...args: any[]) => any, ...args: any[]): Promise<T> {
        const workflow = await this.createWorkflow(WorkflowClass, ...args);
        
        if (typeof (workflow as any).run === 'function') {
            return await (workflow as any).run();
        } else {
            throw new Error(`Workflow ${WorkflowClass.name} does not have a run method`);
        }
    }

    /**
     * Set up context components
     */
    private setupContextComponents(): void {
        if (!this.context) {
            return;
        }

        // Initialize registries
        this.context.server_registry = new MCPServerRegistry(this.context.logger);
        
        // Initialize other registries (simplified for now)
        this.context.activity_registry = {
            register: (name: string, handler: Function) => {
                // Implementation would go here
            },
            get: (name: string) => undefined
        };

        this.context.signal_registry = {
            register: (name: string, handler: Function) => {
                // Implementation would go here
            },
            get: (name: string) => undefined
        };

        this.context.workflow_registry = {
            register: (name: string, workflow: any) => {
                // Implementation would go here
            },
            get: (name: string) => undefined
        };

        this.context.decorator_registry = {
            task: (fn: Function) => fn,
            workflow: (cls: any) => cls,
            signal: (fn: Function) => fn
        };
    }

    /**
     * Process decorator metadata collected during class definition
     */
    private async processDecoratorMetadata(): Promise<void> {
        for (const metadata of this.decoratorMetadata) {
            switch (metadata.type) {
                case 'workflow':
                    // Register workflow class
                    if (this.context?.workflow_registry) {
                        this.context.workflow_registry.register(
                            metadata.target.name,
                            metadata.target
                        );
                    }
                    break;
                
                case 'task':
                    // Register task method
                    if (this.context?.activity_registry && metadata.propertyKey) {
                        const taskName = `${metadata.target.name}.${metadata.propertyKey}`;
                        this.context.activity_registry.register(
                            taskName,
                            metadata.target.prototype[metadata.propertyKey]
                        );
                    }
                    break;
                
                case 'signal':
                    // Register signal handler
                    if (this.context?.signal_registry && metadata.propertyKey) {
                        const signalName = `${metadata.target.name}.${metadata.propertyKey}`;
                        this.context.signal_registry.register(
                            signalName,
                            metadata.target.prototype[metadata.propertyKey]
                        );
                    }
                    break;
            }
        }
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