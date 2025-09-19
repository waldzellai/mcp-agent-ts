/**
 * Main application class that manages global state and can host workflows
 */
import { EventEmitter } from 'events';
import { Effect } from 'effect';
import { Settings } from './core/context';
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
declare const AppInitializationError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "AppInitializationError";
} & Readonly<A>;
export declare class AppInitializationError extends AppInitializationError_base<{
    readonly cause: unknown;
}> {
}
declare const AppStopError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "AppStopError";
} & Readonly<A>;
export declare class AppStopError extends AppStopError_base<{
    readonly cause: unknown;
}> {
}
declare const WorkflowCreationError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "WorkflowCreationError";
} & Readonly<A>;
export declare class WorkflowCreationError extends WorkflowCreationError_base<{
    readonly cause: unknown;
}> {
}
declare const WorkflowExecutionError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "WorkflowExecutionError";
} & Readonly<A>;
export declare class WorkflowExecutionError extends WorkflowExecutionError_base<{
    readonly cause: unknown;
}> {
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
    initializeEffect(): Effect.Effect<void, AppInitializationError>;
    initialize(): Promise<void>;
    /**
     * Start the application (context manager support)
     */
    startEffect(): Effect.Effect<this, AppInitializationError>;
    start(): Promise<this>;
    /**
     * Stop the application
     */
    stopEffect(): Effect.Effect<void, AppStopError>;
    stop(): Promise<void>;
    /**
     * Run the application as a context manager
     */
    runEffect(): Effect.Effect<AppRunner, AppInitializationError>;
    run(): Promise<AppRunner>;
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
    createWorkflowEffect<T>(WorkflowClass: new (...args: any[]) => T, ...args: any[]): Effect.Effect<T, WorkflowCreationError>;
    createWorkflow<T>(WorkflowClass: new (...args: any[]) => T, ...args: any[]): Promise<T>;
    /**
     * Execute a workflow
     */
    executeWorkflowEffect<T>(WorkflowClass: new (...args: any[]) => any, ...args: any[]): Effect.Effect<T, WorkflowCreationError | WorkflowExecutionError>;
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
