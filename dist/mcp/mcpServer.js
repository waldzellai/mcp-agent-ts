"use strict";
// MCP Server Implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpServer = void 0;
const index_1 = require("../context/index");
class McpServer {
    config;
    capabilities;
    contextManager;
    constructor(options) {
        this.config = options.config;
        this.capabilities = options.capabilities || {};
        this.contextManager = index_1.ContextManager.getInstance();
    }
    async handleRequest(request) {
        const context = this.contextManager.createContext({
            requestId: request.id,
            method: request.method
        });
        try {
            switch (request.method) {
                case 'listResources':
                    return this.listResources(request, context);
                case 'listTools':
                    return this.listTools(request, context);
                default:
                    return this.handleCustomMethod(request, context);
            }
        }
        catch (error) {
            return this.createErrorResponse(request.id, error);
        }
    }
    listResources(request, context) {
        return {
            id: request.id,
            result: {
                resources: this.capabilities.resources || {}
            }
        };
    }
    listTools(request, context) {
        return {
            id: request.id,
            result: {
                tools: this.capabilities.tools || {}
            }
        };
    }
    handleCustomMethod(request, context) {
        // Placeholder for custom method handling
        throw new Error(`Unsupported method: ${request.method}`);
    }
    createErrorResponse(id, error) {
        return {
            id,
            error: {
                code: -32000,
                message: error instanceof Error ? error.message : 'Unknown error',
                data: error
            }
        };
    }
    registerTool(name, toolDefinition) {
        if (!this.capabilities.tools) {
            this.capabilities.tools = {};
        }
        this.capabilities.tools[name] = toolDefinition;
    }
    registerResource(name, resourceDefinition) {
        if (!this.capabilities.resources) {
            this.capabilities.resources = {};
        }
        this.capabilities.resources[name] = resourceDefinition;
    }
}
exports.McpServer = McpServer;
