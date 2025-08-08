/**
 * Central context object to store global state shared across the application
 */

import { EventEmitter } from 'events';
import { ConfigurationError } from './exceptions';
import { BaseExecutor } from '../executor/index';

// Type imports - these will be implemented in their respective modules
export interface Logger {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

export interface Settings {
    app_name?: string;
    executor_type?: 'asyncio' | 'temporal';
    temporal?: {
        task_queue?: string;
        namespace?: string;
        workflow_timeout?: number;
    };
    logging?: {
        level?: string;
        format?: string;
    };
    tracing?: {
        enabled?: boolean;
        service_name?: string;
        exporter?: string;
    };
    [key: string]: any;
}

export interface Executor {
    type: 'asyncio' | 'temporal';
    start(): Promise<void>;
    stop(): Promise<void>;
    execute<T>(task: () => Promise<T>): Promise<T>;
}

export interface ServerRegistry {
    register(name: string, config: any): void;
    get(name: string): any;
    list(): string[];
}

export interface ActivityRegistry {
    register(name: string, handler: Function): void;
    get(name: string): Function | undefined;
}

export interface SignalRegistry {
    register(name: string, handler: Function): void;
    get(name: string): Function | undefined;
}

export interface WorkflowRegistry {
    register(name: string, workflow: any): void;
    get(name: string): any;
}

export interface DecoratorRegistry {
    task(fn: Function): Function;
    workflow(cls: any): any;
    signal(fn: Function): Function;
}

export interface ModelSelector {
    selectModel(criteria: any): string;
}

export interface TokenCounter {
    count(text: string): number;
    reset(): void;
    getTotal(): number;
}

/**
 * Central context object containing all shared application state
 */
export class Context extends EventEmitter {
    public readonly app_name: string;
    public settings: Settings;
    public logger: Logger;
    public executor?: Executor;
    public server_registry?: ServerRegistry;
    public activity_registry?: ActivityRegistry;
    public signal_registry?: SignalRegistry;
    public workflow_registry?: WorkflowRegistry;
    public decorator_registry?: DecoratorRegistry;
    public model_selector?: ModelSelector;
    public token_counter?: TokenCounter;
    
    // Callback handlers
    public human_input_callback?: (request: any) => Promise<any>;
    public elicitation_callback?: (request: any) => Promise<any>;
    public signal_wait_callback?: (signal: string) => Promise<any>;

    // Application reference
    public app?: any; // MCPApp instance

    private static instance?: Context;
    private initialized: boolean = false;

    constructor(settings: Settings = {}) {
        super();
        this.app_name = settings.app_name || 'mcp-agent';
        this.settings = settings;
        
        // Initialize with console logger by default
        this.logger = this.createDefaultLogger();
    }

    /**
     * Get or create the singleton context instance
     */
    public static getInstance(settings?: Settings): Context {
        if (!Context.instance) {
            Context.instance = new Context(settings || {});
        }
        return Context.instance;
    }

    /**
     * Initialize the context with all required components
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.logger.info('Initializing context...');

        try {
            // Initialize executor based on settings
            if (this.settings.executor_type === 'temporal') {
                // TODO: Initialize Temporal executor
                this.logger.info('Temporal executor initialization not yet implemented');
            } else {
                // Initialize default in-process executor
                this.executor = new BasicExecutorAdapter(new BaseExecutor());
                await this.executor.start();
                this.logger.info('Default executor initialized');
            }

            // Initialize registries
            // These will be implemented as we port the respective modules
            
            this.initialized = true;
            this.logger.info('Context initialized successfully');
            this.emit('initialized');
        } catch (error) {
            this.logger.error('Failed to initialize context', error);
            throw new ConfigurationError(`Context initialization failed: ${error}`);
        }
    }

    /**
     * Clean up context resources
     */
    public async cleanup(): Promise<void> {
        this.logger.info('Cleaning up context...');

        try {
            if (this.executor) {
                await this.executor.stop();
            }

            this.initialized = false;
            this.emit('cleanup');
            this.logger.info('Context cleanup completed');
        } catch (error) {
            this.logger.error('Error during context cleanup', error);
            throw error;
        }
    }

    /**
     * Create a default console logger
     */
    private createDefaultLogger(): Logger {
        const level = this.settings.logging?.level || 'info';
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(level);

        return {
            debug: (message: string, ...args: any[]) => {
                if (currentLevelIndex <= 0) {
                    console.debug(`[${this.app_name}] DEBUG:`, message, ...args);
                }
            },
            info: (message: string, ...args: any[]) => {
                if (currentLevelIndex <= 1) {
                    console.info(`[${this.app_name}] INFO:`, message, ...args);
                }
            },
            warn: (message: string, ...args: any[]) => {
                if (currentLevelIndex <= 2) {
                    console.warn(`[${this.app_name}] WARN:`, message, ...args);
                }
            },
            error: (message: string, ...args: any[]) => {
                console.error(`[${this.app_name}] ERROR:`, message, ...args);
            }
        };
    }

    /**
     * Update context settings
     */
    public updateSettings(settings: Partial<Settings>): void {
        this.settings = { ...this.settings, ...settings };
        this.emit('settings-updated', this.settings);
    }

    /**
     * Check if context is properly initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }
}

/**
 * Global context initialization helper
 */
export async function initializeContext(settings?: Settings): Promise<Context> {
    const context = Context.getInstance(settings);
    await context.initialize();
    return context;
}

/**
 * Global context cleanup helper
 */
export async function cleanupContext(): Promise<void> {
    const context = Context.getInstance();
    await context.cleanup();
}

/**
 * Adapter to bridge BaseExecutor to the Context.Executor interface
 */
class BasicExecutorAdapter implements Executor {
    public readonly type: 'asyncio' = 'asyncio';
    private readonly base: BaseExecutor;

    constructor(base: BaseExecutor) {
        this.base = base;
    }

    public async start(): Promise<void> {
        // No-op for in-process executor
    }

    public async stop(): Promise<void> {
        // Wait for running tasks to complete; no explicit shutdown needed
        await this.base.waitForAllTasks();
    }

    public async execute<T>(task: () => Promise<T>): Promise<T> {
        const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        return this.base.enqueueTask({ id, name: id, execute: task }) as Promise<T>;
    }
}