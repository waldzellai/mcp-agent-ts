/**
 * Main application class that manages global state and can host workflows
 */
import { EventEmitter } from 'events';
import { Context, Settings } from './core/context';
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
 * Main application class for MCP Agent
 */
export declare class MCPApp extends EventEmitter {
    readonly name: string;
    private context?;
    private settings;
    private humanInputCallback?;
    private elicitationCallback?;
    private decoratorMetadata;
    private initialized;
    private running;
    constructor(options?: MCPAppOptions);
    /**
     * Initialize the application
     */
    initialize(): Promise<void>;
    /**
     * Start the application (context manager support)
     */
    start(): Promise<this>;
    /**
     * Stop the application
     */
    stop(): Promise<void>;
    /**
     * Run the application as a context manager
     */
    run(): Promise<AppRunner>;
    /**
     * Get the application context
     */
    getContext(): Context;
    /**
     * Register an MCP server
     */
    registerServer(name: string, config: any): void;
    /**
     * Workflow decorator
     */
    workflow<T extends {
        new (...args: any[]): {};
    }>(constructor: T): T;
    /**
     * Task decorator
     */
    task(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
    /**
     * Signal decorator
     */
    signal(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
    /**
     * Create a workflow instance
     */
    createWorkflow<T>(WorkflowClass: new (...args: any[]) => T, ...args: any[]): Promise<T>;
    /**
     * Execute a workflow
     */
    executeWorkflow<T>(WorkflowClass: new (...args: any[]) => any, ...args: any[]): Promise<T>;
    /**
     * Set up context components
     */
    private setupContextComponents;
    /**
     * Process decorator metadata collected during class definition
     */
    private processDecoratorMetadata;
    /**
     * Update application settings
     */
    updateSettings(settings: Partial<Settings>): void;
    /**
     * Get application statistics
     */
    getStats(): {
        name: string;
        initialized: boolean;
        running: boolean;
        serverCount: number;
        workflowCount: number;
    };
}
/**
 * Helper class for context manager pattern
 */
declare class AppRunner {
    private app;
    constructor(app: MCPApp);
    __aenter__(): Promise<MCPApp>;
    __aexit__(excType?: any, excVal?: any, excTb?: any): Promise<void>;
}
/**
 * Get or create the default app instance
 */
export declare function getDefaultApp(options?: MCPAppOptions): MCPApp;
/**
 * Decorator factory functions for use with default app
 */
export declare function workflow<T extends {
    new (...args: any[]): {};
}>(constructor: T): T;
export declare function task(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
export declare function signal(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
export {};
