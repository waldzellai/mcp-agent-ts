import { McpAgentConfig } from '../config/index';
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
export declare class McpServer {
    private config;
    private capabilities;
    private contextManager;
    constructor(options: McpServerOptions);
    handleRequest(request: McpRequest): Promise<McpResponse>;
    private listResources;
    private listTools;
    private handleCustomMethod;
    private createErrorResponse;
    registerTool(name: string, toolDefinition: unknown): void;
    registerResource(name: string, resourceDefinition: unknown): void;
}
