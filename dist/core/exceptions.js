"use strict";
/**
 * Custom exception hierarchy for MCP Agent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowError = exports.NotImplementedError = exports.TimeoutError = exports.ConnectionError = exports.ConfigurationError = exports.ValidationError = exports.MCPAgentError = void 0;
class MCPAgentError extends Error {
    code;
    timestamp;
    constructor(message, code = 'MCP_AGENT_ERROR') {
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
exports.MCPAgentError = MCPAgentError;
class ValidationError extends MCPAgentError {
    field;
    constructor(message, field) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
class ConfigurationError extends MCPAgentError {
    constructor(message) {
        super(message, 'CONFIGURATION_ERROR');
        this.name = 'ConfigurationError';
    }
}
exports.ConfigurationError = ConfigurationError;
class ConnectionError extends MCPAgentError {
    server;
    constructor(message, server) {
        super(message, 'CONNECTION_ERROR');
        this.name = 'ConnectionError';
        this.server = server;
    }
}
exports.ConnectionError = ConnectionError;
class TimeoutError extends MCPAgentError {
    timeoutMs;
    constructor(message, timeoutMs) {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'TimeoutError';
        this.timeoutMs = timeoutMs;
    }
}
exports.TimeoutError = TimeoutError;
class NotImplementedError extends MCPAgentError {
    constructor(message = 'Not implemented') {
        super(message, 'NOT_IMPLEMENTED');
        this.name = 'NotImplementedError';
    }
}
exports.NotImplementedError = NotImplementedError;
class WorkflowError extends MCPAgentError {
    workflowId;
    constructor(message, workflowId) {
        super(message, 'WORKFLOW_ERROR');
        this.name = 'WorkflowError';
        this.workflowId = workflowId;
    }
}
exports.WorkflowError = WorkflowError;
