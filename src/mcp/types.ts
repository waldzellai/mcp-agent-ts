/**
 * Type definitions for MCP integration
 */

import { Tool, Prompt, Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * Namespaced tool with server information
 */
export interface NamespacedTool extends Tool {
    namespace: string;
    server_name: string;
    original_name: string;
    namespaced_tool_name: string;
    tool: Tool;
}

/**
 * Namespaced prompt with server information
 */
export interface NamespacedPrompt extends Prompt {
    namespace: string;
    server_name: string;
    original_name: string;
    namespaced_prompt_name: string;
    prompt: Prompt;
}

/**
 * Namespaced resource with server information
 */
export interface NamespacedResource extends Resource {
    namespace: string;
    server_name: string;
    original_uri: string;
    namespaced_resource_name: string;
    resource: Resource;
}

/**
 * Server connection configuration
 */
export interface ServerConfig {
    name: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    transport?: 'stdio' | 'http' | 'websocket';
    capabilities?: ServerCapabilities;
}

/**
 * Server capabilities declaration
 */
export interface ServerCapabilities {
    tools?: boolean;
    prompts?: boolean;
    resources?: boolean;
    sampling?: boolean;
}

/**
 * Server connection state
 */
export interface ServerConnection {
    name: string;
    config: ServerConfig;
    connected: boolean;
    session?: any; // MCP ClientSession
    capabilities?: ServerCapabilities;
}

/**
 * Aggregated MCP capabilities from all connected servers
 */
export interface AggregatedCapabilities {
    tools: NamespacedTool[];
    prompts: NamespacedPrompt[];
    resources: NamespacedResource[];
    servers: string[];
}