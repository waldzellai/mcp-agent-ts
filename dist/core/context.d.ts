/**
 * Central context object to store global state shared across the application
 */
import { EventEmitter } from 'events';
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
export declare class Context extends EventEmitter {
    readonly app_name: string;
    settings: Settings;
    logger: Logger;
    executor?: Executor;
    server_registry?: ServerRegistry;
    activity_registry?: ActivityRegistry;
    signal_registry?: SignalRegistry;
    workflow_registry?: WorkflowRegistry;
    decorator_registry?: DecoratorRegistry;
    model_selector?: ModelSelector;
    token_counter?: TokenCounter;
    human_input_callback?: (request: any) => Promise<any>;
    elicitation_callback?: (request: any) => Promise<any>;
    signal_wait_callback?: (signal: string) => Promise<any>;
    app?: any;
    private static instance?;
    private initialized;
    constructor(settings?: Settings);
    /**
     * Get or create the singleton context instance
     */
    static getInstance(settings?: Settings): Context;
    /**
     * Initialize the context with all required components
     */
    initialize(): Promise<void>;
    /**
     * Clean up context resources
     */
    cleanup(): Promise<void>;
    /**
     * Create a default console logger
     */
    private createDefaultLogger;
    /**
     * Update context settings
     */
    updateSettings(settings: Partial<Settings>): void;
    /**
     * Check if context is properly initialized
     */
    isInitialized(): boolean;
}
/**
 * Global context initialization helper
 */
export declare function initializeContext(settings?: Settings): Promise<Context>;
/**
 * Global context cleanup helper
 */
export declare function cleanupContext(): Promise<void>;
