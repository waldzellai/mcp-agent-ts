// MCP Server Implementation

import { McpAgentConfig } from '../config/index';
import { McpContext, ContextManager } from '../context/index';

export interface McpServerCapabilities {
  resources?: Record<string, unknown>;
  tools?: Record<string, unknown>;
}

export interface McpServerOptions {
  config: McpAgentConfig;
  capabilities?: McpServerCapabilities;
}

export interface McpRequest {
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface McpResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export class McpServer {
  private config: McpAgentConfig;
  private capabilities: McpServerCapabilities;
  private contextManager: ContextManager;

  constructor(options: McpServerOptions) {
    this.config = options.config;
    this.capabilities = options.capabilities || {};
    this.contextManager = ContextManager.getInstance();
  }

  public async handleRequest(request: McpRequest): Promise<McpResponse> {
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
    } catch (error) {
      return this.createErrorResponse(request.id, error);
    }
  }

  private listResources(request: McpRequest, context: McpContext): McpResponse {
    return {
      id: request.id,
      result: {
        resources: this.capabilities.resources || {}
      }
    };
  }

  private listTools(request: McpRequest, context: McpContext): McpResponse {
    return {
      id: request.id,
      result: {
        tools: this.capabilities.tools || {}
      }
    };
  }

  private handleCustomMethod(request: McpRequest, context: McpContext): McpResponse {
    // Placeholder for custom method handling
    throw new Error(`Unsupported method: ${request.method}`);
  }

  private createErrorResponse(id: string, error: unknown): McpResponse {
    return {
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: error
      }
    };
  }

  public registerTool(name: string, toolDefinition: unknown): void {
    if (!this.capabilities.tools) {
      this.capabilities.tools = {};
    }
    this.capabilities.tools[name] = toolDefinition;
  }

  public registerResource(name: string, resourceDefinition: unknown): void {
    if (!this.capabilities.resources) {
      this.capabilities.resources = {};
    }
    this.capabilities.resources[name] = resourceDefinition;
  }
}
