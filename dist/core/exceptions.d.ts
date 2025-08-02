/**
 * Custom exception hierarchy for MCP Agent
 */
export declare class MCPAgentError extends Error {
    readonly code: string;
    readonly timestamp: Date;
    constructor(message: string, code?: string);
}
export declare class ValidationError extends MCPAgentError {
    readonly field?: string;
    constructor(message: string, field?: string);
}
export declare class ConfigurationError extends MCPAgentError {
    constructor(message: string);
}
export declare class ConnectionError extends MCPAgentError {
    readonly server?: string;
    constructor(message: string, server?: string);
}
export declare class TimeoutError extends MCPAgentError {
    readonly timeoutMs: number;
    constructor(message: string, timeoutMs: number);
}
export declare class NotImplementedError extends MCPAgentError {
    constructor(message?: string);
}
export declare class WorkflowError extends MCPAgentError {
    readonly workflowId?: string;
    constructor(message: string, workflowId?: string);
}
