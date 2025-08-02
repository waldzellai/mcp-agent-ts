/**
 * Custom exception hierarchy for MCP Agent
 */

export class MCPAgentError extends Error {
    public readonly code: string;
    public readonly timestamp: Date;

    constructor(message: string, code: string = 'MCP_AGENT_ERROR') {
        super(message);
        this.name = 'MCPAgentError';
        this.code = code;
        this.timestamp = new Date();
        
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class ValidationError extends MCPAgentError {
    public readonly field?: string;

    constructor(message: string, field?: string) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.field = field;
    }
}

export class ConfigurationError extends MCPAgentError {
    constructor(message: string) {
        super(message, 'CONFIGURATION_ERROR');
        this.name = 'ConfigurationError';
    }
}

export class ConnectionError extends MCPAgentError {
    public readonly server?: string;

    constructor(message: string, server?: string) {
        super(message, 'CONNECTION_ERROR');
        this.name = 'ConnectionError';
        this.server = server;
    }
}

export class TimeoutError extends MCPAgentError {
    public readonly timeoutMs: number;

    constructor(message: string, timeoutMs: number) {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'TimeoutError';
        this.timeoutMs = timeoutMs;
    }
}

export class NotImplementedError extends MCPAgentError {
    constructor(message: string = 'Not implemented') {
        super(message, 'NOT_IMPLEMENTED');
        this.name = 'NotImplementedError';
    }
}

export class WorkflowError extends MCPAgentError {
    public readonly workflowId?: string;

    constructor(message: string, workflowId?: string) {
        super(message, 'WORKFLOW_ERROR');
        this.name = 'WorkflowError';
        this.workflowId = workflowId;
    }
}