/**
 * MCP Aggregator - Aggregates multiple MCP servers and provides unified access to tools, prompts, and resources
 */

import { EventEmitter } from 'events';
import { 
    Tool, 
    Prompt, 
    Resource,
    CallToolResult,
    GetPromptResult,
    ListToolsResult,
    ListPromptsResult,
    ListResourcesResult,
    ReadResourceResult,
    ServerCapabilities
} from '@modelcontextprotocol/sdk/types.js';

import { Context, Logger } from '../core/context';
import { ContextDependentBase } from '../core/contextDependent';
import { ValidationError, ConnectionError } from '../core/exceptions';
import { 
    NamespacedTool, 
    NamespacedPrompt, 
    NamespacedResource,
    ServerConnection,
    AggregatedCapabilities 
} from './types';
import { MCPConnectionManager } from './connectionManager';
import { MCPServerRegistry } from './serverRegistry';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { ConfigurationError } from '../core/exceptions';

const NAMESPACE_SEPARATOR = '_';

/**
 * Aggregates multiple MCP servers and provides unified access to their capabilities
 */
export class MCPAggregator extends ContextDependentBase {
    private initialized: boolean = false;
    private connectionPersistence: boolean;
    private serverNames: string[];
    private agentName?: string;
    private persistentConnectionManager?: MCPConnectionManager;

    // Tool maps
    private namespacedToolMap: Map<string, NamespacedTool> = new Map();
    private serverToToolMap: Map<string, NamespacedTool[]> = new Map();
    private toolMapLock: Promise<void> = Promise.resolve();

    // Prompt maps
    private namespacedPromptMap: Map<string, NamespacedPrompt> = new Map();
    private serverToPromptMap: Map<string, NamespacedPrompt[]> = new Map();
    private promptMapLock: Promise<void> = Promise.resolve();

    // Resource maps
    private namespacedResourceMap: Map<string, NamespacedResource> = new Map();
    private serverToResourceMap: Map<string, NamespacedResource[]> = new Map();
    private resourceMapLock: Promise<void> = Promise.resolve();

    constructor(
        context: Context,
        serverNames: string[],
        options: {
            connectionPersistence?: boolean;
            name?: string;
        } = {}
    ) {
        super(context);
        this.serverNames = serverNames;
        this.connectionPersistence = options.connectionPersistence ?? true;
        this.agentName = options.name;
    }

    /**
     * Initialize the aggregator and load all server capabilities
     */
    public async initialize(force: boolean = false): Promise<void> {
        if (this.initialized && !force) {
            return;
        }

        this.logger.info(`Initializing MCP Aggregator with servers: ${this.serverNames.join(', ')}`);

        try {
            // Set up persistent connection manager if enabled
            if (this.connectionPersistence) {
                await this.initializePersistentConnections();
            }

            // Load all server capabilities
            await this.loadServers();

            this.initialized = true;
            this.logger.info('MCP Aggregator initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize MCP Aggregator', error);
            throw error;
        }
    }

    /**
     * Clean up resources and close connections
     */
    public async close(): Promise<void> {
        this.logger.info('Closing MCP Aggregator...');

        try {
            // Clean up persistent connections if they exist
            if (this.connectionPersistence && this.persistentConnectionManager) {
                await this.cleanupPersistentConnections();
            }

            // Clear all maps
            this.namespacedToolMap.clear();
            this.serverToToolMap.clear();
            this.namespacedPromptMap.clear();
            this.serverToPromptMap.clear();
            this.namespacedResourceMap.clear();
            this.serverToResourceMap.clear();

            this.initialized = false;
            this.logger.info('MCP Aggregator closed successfully');
        } catch (error) {
            this.logger.error('Error closing MCP Aggregator', error);
            throw error;
        }
    }

    /**
     * Context manager support
     */
    public async __aenter__(): Promise<this> {
        await this.initialize();
        return this;
    }

    public async __aexit__(excType?: any, excVal?: any, excTb?: any): Promise<void> {
        await this.close();
    }

    /**
     * Get aggregated capabilities from all servers
     */
    public getCapabilities(): AggregatedCapabilities {
        return {
            tools: Array.from(this.namespacedToolMap.values()),
            prompts: Array.from(this.namespacedPromptMap.values()),
            resources: Array.from(this.namespacedResourceMap.values()),
            servers: this.serverNames
        };
    }

    /**
     * List all available tools
     */
    public async listTools(): Promise<ListToolsResult> {
        await this.ensureInitialized();
        
        const tools = Array.from(this.namespacedToolMap.values()).map(nt => ({
            name: nt.namespaced_tool_name,
            description: nt.tool.description,
            inputSchema: nt.tool.inputSchema
        }));

        return { tools };
    }

    /**
     * Call a tool by its namespaced name
     */
    public async callTool(name: string, args: any): Promise<CallToolResult> {
        await this.ensureInitialized();

        const namespacedTool = this.namespacedToolMap.get(name);
        if (!namespacedTool) {
            throw new ValidationError(`Tool '${name}' not found`);
        }

        this.logger.debug(`Calling tool '${name}' on server '${namespacedTool.server_name}'`);

        try {
            if (this.connectionPersistence) {
                const connection = await this.getServerConnection(namespacedTool.server_name);
                const result = await connection.session.callTool({
                    name: namespacedTool.original_name,
                    arguments: args
                });
                return result;
            }
            // Ephemeral connection path
            return await this.withEphemeralClient(namespacedTool.server_name, async (client) => {
                return await client.callTool({
                    name: namespacedTool.original_name,
                    arguments: args
                });
            });
        } catch (error) {
            this.logger.error(`Failed to call tool '${name}'`, error);
            throw new ConnectionError(`Failed to call tool '${name}': ${error}`, namespacedTool.server_name);
        }
    }

    /**
     * List all available prompts
     */
    public async listPrompts(): Promise<ListPromptsResult> {
        await this.ensureInitialized();
        
        const prompts = Array.from(this.namespacedPromptMap.values()).map(np => ({
            name: np.namespaced_prompt_name,
            description: np.prompt.description,
            arguments: np.prompt.arguments
        }));

        return { prompts };
    }

    /**
     * Get a prompt by its namespaced name
     */
    public async getPrompt(name: string, args?: any): Promise<GetPromptResult> {
        await this.ensureInitialized();

        const namespacedPrompt = this.namespacedPromptMap.get(name);
        if (!namespacedPrompt) {
            throw new ValidationError(`Prompt '${name}' not found`);
        }

        this.logger.debug(`Getting prompt '${name}' from server '${namespacedPrompt.server_name}'`);

        try {
            if (this.connectionPersistence) {
                const connection = await this.getServerConnection(namespacedPrompt.server_name);
                const result = await connection.session.getPrompt({
                    name: namespacedPrompt.original_name,
                    arguments: args
                });
                return result;
            }
            return await this.withEphemeralClient(namespacedPrompt.server_name, async (client) => {
                return await client.getPrompt({
                    name: namespacedPrompt.original_name,
                    arguments: args
                });
            });
        } catch (error) {
            this.logger.error(`Failed to get prompt '${name}'`, error);
            throw new ConnectionError(`Failed to get prompt '${name}': ${error}`, namespacedPrompt.server_name);
        }
    }

    /**
     * List all available resources
     */
    public async listResources(): Promise<ListResourcesResult> {
        await this.ensureInitialized();
        
        const resources = Array.from(this.namespacedResourceMap.values()).map(nr => ({
            uri: nr.namespaced_resource_name,
            name: nr.resource.name,
            description: nr.resource.description,
            mimeType: nr.resource.mimeType
        }));

        return { resources };
    }

    /**
     * Read a resource by its namespaced URI
     */
    public async readResource(uri: string): Promise<ReadResourceResult> {
        await this.ensureInitialized();

        const namespacedResource = this.namespacedResourceMap.get(uri);
        if (!namespacedResource) {
            throw new ValidationError(`Resource '${uri}' not found`);
        }

        this.logger.debug(`Reading resource '${uri}' from server '${namespacedResource.server_name}'`);

        try {
            if (this.connectionPersistence) {
                const connection = await this.getServerConnection(namespacedResource.server_name);
                const result = await connection.session.readResource({
                    uri: namespacedResource.original_uri
                });
                return result;
            }
            return await this.withEphemeralClient(namespacedResource.server_name, async (client) => {
                return await client.readResource({
                    uri: namespacedResource.original_uri
                });
            });
        } catch (error) {
            this.logger.error(`Failed to read resource '${uri}'`, error);
            throw new ConnectionError(`Failed to read resource '${uri}': ${error}`, namespacedResource.server_name);
        }
    }

    /**
     * Load capabilities from all configured servers
     */
    private async loadServers(): Promise<void> {
        const loadPromises = this.serverNames.map(serverName => 
            this.loadServerCapabilities(serverName)
        );

        await Promise.all(loadPromises);
    }

    /**
     * Load capabilities from a single server
     */
    private async loadServerCapabilities(serverName: string): Promise<void> {
        this.logger.debug(`Loading capabilities from server '${serverName}'`);

        try {
            if (this.connectionPersistence) {
                const connection = await this.getServerConnection(serverName);

                // Load tools
                const toolsResult = await connection.session.listTools();
                await this.updateToolMaps(serverName, toolsResult.tools);

                // Load prompts
                const promptsResult = await connection.session.listPrompts();
                await this.updatePromptMaps(serverName, promptsResult.prompts);

                // Load resources
                const resourcesResult = await connection.session.listResources();
                await this.updateResourceMaps(serverName, resourcesResult.resources);
            } else {
                await this.withEphemeralClient(serverName, async (client) => {
                    const toolsResult = await client.listTools();
                    await this.updateToolMaps(serverName, toolsResult.tools);

                    const promptsResult = await client.listPrompts();
                    await this.updatePromptMaps(serverName, promptsResult.prompts);

                    const resourcesResult = await client.listResources();
                    await this.updateResourceMaps(serverName, resourcesResult.resources);
                });
            }

            this.logger.info(`Loaded capabilities from server '${serverName}'`);
        } catch (error) {
            this.logger.error(`Failed to load capabilities from server '${serverName}'`, error);
            throw error;
        }
    }

    /**
     * Update tool maps with tools from a server
     */
    private async updateToolMaps(serverName: string, tools: Tool[]): Promise<void> {
        await this.withLock(this.toolMapLock, async () => {
            const namespacedTools: NamespacedTool[] = [];

            for (const tool of tools) {
                const namespacedName = this.createNamespacedName(serverName, tool.name);
                const namespacedTool: NamespacedTool = {
                    ...tool,
                    namespace: serverName,
                    server_name: serverName,
                    original_name: tool.name,
                    namespaced_tool_name: namespacedName,
                    name: namespacedName, // Override the name field
                    tool: tool
                };

                this.namespacedToolMap.set(namespacedName, namespacedTool);
                namespacedTools.push(namespacedTool);
            }

            this.serverToToolMap.set(serverName, namespacedTools);
        });
    }

    /**
     * Update prompt maps with prompts from a server
     */
    private async updatePromptMaps(serverName: string, prompts: Prompt[]): Promise<void> {
        await this.withLock(this.promptMapLock, async () => {
            const namespacedPrompts: NamespacedPrompt[] = [];

            for (const prompt of prompts) {
                const namespacedName = this.createNamespacedName(serverName, prompt.name);
                const namespacedPrompt: NamespacedPrompt = {
                    ...prompt,
                    namespace: serverName,
                    server_name: serverName,
                    original_name: prompt.name,
                    namespaced_prompt_name: namespacedName,
                    name: namespacedName, // Override the name field
                    prompt: prompt
                };

                this.namespacedPromptMap.set(namespacedName, namespacedPrompt);
                namespacedPrompts.push(namespacedPrompt);
            }

            this.serverToPromptMap.set(serverName, namespacedPrompts);
        });
    }

    /**
     * Update resource maps with resources from a server
     */
    private async updateResourceMaps(serverName: string, resources: Resource[]): Promise<void> {
        await this.withLock(this.resourceMapLock, async () => {
            const namespacedResources: NamespacedResource[] = [];

            for (const resource of resources) {
                const namespacedUri = this.createNamespacedName(serverName, resource.uri);
                const namespacedResource: NamespacedResource = {
                    ...resource,
                    namespace: serverName,
                    server_name: serverName,
                    original_uri: resource.uri,
                    namespaced_resource_name: namespacedUri,
                    uri: namespacedUri, // Override the uri field
                    resource: resource
                };

                this.namespacedResourceMap.set(namespacedUri, namespacedResource);
                namespacedResources.push(namespacedResource);
            }

            this.serverToResourceMap.set(serverName, namespacedResources);
        });
    }

    /**
     * Create a namespaced name for a tool/prompt/resource
     */
    private createNamespacedName(serverName: string, originalName: string): string {
        return `${serverName}${NAMESPACE_SEPARATOR}${originalName}`;
    }

    /**
     * Get a server connection (persistent or ephemeral)
     */
    private async getServerConnection(serverName: string): Promise<ServerConnection> {
        if (this.connectionPersistence && this.persistentConnectionManager) {
            return await this.persistentConnectionManager.getConnection(serverName);
        } else {
            // For ephemeral mode, connections are handled ad-hoc in the calling methods
            throw new Error('Ephemeral connections are handled inline; this path should not be called');
        }
    }

    /**
     * Initialize persistent connection management
     */
    private async initializePersistentConnections(): Promise<void> {
        // Get or create connection manager from context
        // This ensures connection managers are shared across aggregators
        
        if (!this.context.server_registry) {
            throw new Error('Server registry not initialized in context');
        }

        // Initialize connection manager tracking on context if not present
        if (!(this.context as any)._mcp_connection_manager_lock) {
            (this.context as any)._mcp_connection_manager_lock = Promise.resolve();
        }

        if (!(this.context as any)._mcp_connection_manager_ref_count) {
            (this.context as any)._mcp_connection_manager_ref_count = 0;
        }

        await this.withLock((this.context as any)._mcp_connection_manager_lock, async () => {
            (this.context as any)._mcp_connection_manager_ref_count += 1;

            if ((this.context as any)._mcp_connection_manager) {
                this.persistentConnectionManager = (this.context as any)._mcp_connection_manager;
            } else {
                const connectionManager = new MCPConnectionManager(
                    this.context.server_registry as MCPServerRegistry,
                    this.logger
                );
                await connectionManager.initialize();
                (this.context as any)._mcp_connection_manager = connectionManager;
                this.persistentConnectionManager = connectionManager;
            }
        });
    }

    /**
     * Clean up persistent connections
     */
    private async cleanupPersistentConnections(): Promise<void> {
        if (!this.persistentConnectionManager) {
            return;
        }

        await this.withLock((this.context as any)._mcp_connection_manager_lock, async () => {
            (this.context as any)._mcp_connection_manager_ref_count -= 1;

            if ((this.context as any)._mcp_connection_manager_ref_count <= 0) {
                await this.persistentConnectionManager!.close();
                delete (this.context as any)._mcp_connection_manager;
            }
        });
    }

    /**
     * Ensure the aggregator is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            throw new Error('MCP Aggregator not initialized. Call initialize() first.');
        }
    }

    /**
     * Simple async lock implementation
     */
    private async withLock<T>(lock: Promise<void>, fn: () => Promise<T>): Promise<T> {
        const releaseLock = await lock;
        try {
            return await fn();
        } finally {
            // Release lock logic would go here if needed
        }
    }

    /**
     * Create an ephemeral MCP client for a server, run an operation, then clean up
     */
    private async withEphemeralClient<T>(
        serverName: string,
        fn: (client: any) => Promise<T>
    ): Promise<T> {
        if (!this.context.server_registry) {
            throw new Error('Server registry not initialized in context');
        }
        const registry = this.context.server_registry as MCPServerRegistry;
        const config = registry.get(serverName);
        if (!config) {
            throw new ConfigurationError(`Server '${serverName}' not found in registry`);
        }

        const client = new Client(
            {
                name: `mcp-agent-ephemeral-${serverName}`,
                version: '1.0.0'
            },
            { capabilities: {} }
        );

        let transport: any;
        try {
            transport = await this.createTransport(config);
            await client.connect(transport);
            return await fn(client);
        } finally {
            try {
                await client.close();
            } catch {}
            try {
                if (transport && typeof transport.close === 'function') {
                    await transport.close();
                }
            } catch {}
        }
    }

    /**
     * Create a transport from a server config (duplicated from connection manager for now)
     */
    private async createTransport(config: any): Promise<any> {
        switch (config.transport) {
            case 'stdio': {
                if (!config.command) {
                    throw new ConfigurationError('Stdio transport requires command');
                }
                const env: Record<string, string> = { ...(process.env as Record<string, string>) };
                if (config.env) {
                    Object.assign(env, config.env);
                }
                return new StdioClientTransport({
                    command: config.command,
                    args: config.args,
                    env
                });
            }
            case 'websocket': {
                if (!config.url) {
                    throw new ConfigurationError('WebSocket transport requires URL');
                }
                return new WebSocketClientTransport(new URL(config.url));
            }
            case 'http': {
                if (!config.url) {
                    throw new ConfigurationError('HTTP transport requires URL');
                }
                return new SSEClientTransport(new URL(config.url));
            }
            default:
                throw new ConfigurationError(`Unsupported transport: ${config.transport}`);
        }
    }
}