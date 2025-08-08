/**
 * MCP Aggregator - Aggregates multiple MCP servers and provides unified access to tools, prompts, and resources
 */
import { CallToolResult, GetPromptResult, ListToolsResult, ListPromptsResult, ListResourcesResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { Context } from '../core/context';
import { ContextDependentBase } from '../core/contextDependent';
import { AggregatedCapabilities } from './types';
/**
 * Aggregates multiple MCP servers and provides unified access to their capabilities
 */
export declare class MCPAggregator extends ContextDependentBase {
    private initialized;
    private connectionPersistence;
    private serverNames;
    private agentName?;
    private persistentConnectionManager?;
    private namespacedToolMap;
    private serverToToolMap;
    private toolMapLock;
    private namespacedPromptMap;
    private serverToPromptMap;
    private promptMapLock;
    private namespacedResourceMap;
    private serverToResourceMap;
    private resourceMapLock;
    constructor(context: Context, serverNames: string[], options?: {
        connectionPersistence?: boolean;
        name?: string;
    });
    /**
     * Initialize the aggregator and load all server capabilities
     */
    initialize(force?: boolean): Promise<void>;
    /**
     * Clean up resources and close connections
     */
    close(): Promise<void>;
    /**
     * Context manager support
     */
    __aenter__(): Promise<this>;
    __aexit__(excType?: any, excVal?: any, excTb?: any): Promise<void>;
    /**
     * Get aggregated capabilities from all servers
     */
    getCapabilities(): AggregatedCapabilities;
    /**
     * List all available tools
     */
    listTools(): Promise<ListToolsResult>;
    /**
     * Call a tool by its namespaced name
     */
    callTool(name: string, args: any): Promise<CallToolResult>;
    /**
     * List all available prompts
     */
    listPrompts(): Promise<ListPromptsResult>;
    /**
     * Get a prompt by its namespaced name
     */
    getPrompt(name: string, args?: any): Promise<GetPromptResult>;
    /**
     * List all available resources
     */
    listResources(): Promise<ListResourcesResult>;
    /**
     * Read a resource by its namespaced URI
     */
    readResource(uri: string): Promise<ReadResourceResult>;
    /**
     * Load capabilities from all configured servers
     */
    private loadServers;
    /**
     * Load capabilities from a single server
     */
    private loadServerCapabilities;
    /**
     * Update tool maps with tools from a server
     */
    private updateToolMaps;
    /**
     * Update prompt maps with prompts from a server
     */
    private updatePromptMaps;
    /**
     * Update resource maps with resources from a server
     */
    private updateResourceMaps;
    /**
     * Create a namespaced name for a tool/prompt/resource
     */
    private createNamespacedName;
    /**
     * Get a server connection (persistent or ephemeral)
     */
    private getServerConnection;
    /**
     * Initialize persistent connection management
     */
    private initializePersistentConnections;
    /**
     * Clean up persistent connections
     */
    private cleanupPersistentConnections;
    /**
     * Ensure the aggregator is initialized
     */
    private ensureInitialized;
    /**
     * Simple async lock implementation
     */
    private withLock;
    /**
     * Create an ephemeral MCP client for a server, run an operation, then clean up
     */
    private withEphemeralClient;
    /**
     * Create a transport from a server config (duplicated from connection manager for now)
     */
    private createTransport;
}
