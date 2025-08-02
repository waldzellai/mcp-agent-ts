"use strict";
/**
 * MCP Aggregator - Aggregates multiple MCP servers and provides unified access to tools, prompts, and resources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPAggregator = void 0;
const contextDependent_1 = require("../core/contextDependent");
const exceptions_1 = require("../core/exceptions");
const connectionManager_1 = require("./connectionManager");
const NAMESPACE_SEPARATOR = '_';
/**
 * Aggregates multiple MCP servers and provides unified access to their capabilities
 */
class MCPAggregator extends contextDependent_1.ContextDependentBase {
    initialized = false;
    connectionPersistence;
    serverNames;
    agentName;
    persistentConnectionManager;
    // Tool maps
    namespacedToolMap = new Map();
    serverToToolMap = new Map();
    toolMapLock = Promise.resolve();
    // Prompt maps
    namespacedPromptMap = new Map();
    serverToPromptMap = new Map();
    promptMapLock = Promise.resolve();
    // Resource maps
    namespacedResourceMap = new Map();
    serverToResourceMap = new Map();
    resourceMapLock = Promise.resolve();
    constructor(context, serverNames, options = {}) {
        super(context);
        this.serverNames = serverNames;
        this.connectionPersistence = options.connectionPersistence ?? true;
        this.agentName = options.name;
    }
    /**
     * Initialize the aggregator and load all server capabilities
     */
    async initialize(force = false) {
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
        }
        catch (error) {
            this.logger.error('Failed to initialize MCP Aggregator', error);
            throw error;
        }
    }
    /**
     * Clean up resources and close connections
     */
    async close() {
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
        }
        catch (error) {
            this.logger.error('Error closing MCP Aggregator', error);
            throw error;
        }
    }
    /**
     * Context manager support
     */
    async __aenter__() {
        await this.initialize();
        return this;
    }
    async __aexit__(excType, excVal, excTb) {
        await this.close();
    }
    /**
     * Get aggregated capabilities from all servers
     */
    getCapabilities() {
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
    async listTools() {
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
    async callTool(name, args) {
        await this.ensureInitialized();
        const namespacedTool = this.namespacedToolMap.get(name);
        if (!namespacedTool) {
            throw new exceptions_1.ValidationError(`Tool '${name}' not found`);
        }
        this.logger.debug(`Calling tool '${name}' on server '${namespacedTool.server_name}'`);
        try {
            // Get connection for the server
            const connection = await this.getServerConnection(namespacedTool.server_name);
            // Call the tool with the original name
            const result = await connection.session.callTool({
                name: namespacedTool.original_name,
                arguments: args
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to call tool '${name}'`, error);
            throw new exceptions_1.ConnectionError(`Failed to call tool '${name}': ${error}`, namespacedTool.server_name);
        }
    }
    /**
     * List all available prompts
     */
    async listPrompts() {
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
    async getPrompt(name, args) {
        await this.ensureInitialized();
        const namespacedPrompt = this.namespacedPromptMap.get(name);
        if (!namespacedPrompt) {
            throw new exceptions_1.ValidationError(`Prompt '${name}' not found`);
        }
        this.logger.debug(`Getting prompt '${name}' from server '${namespacedPrompt.server_name}'`);
        try {
            const connection = await this.getServerConnection(namespacedPrompt.server_name);
            const result = await connection.session.getPrompt({
                name: namespacedPrompt.original_name,
                arguments: args
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to get prompt '${name}'`, error);
            throw new exceptions_1.ConnectionError(`Failed to get prompt '${name}': ${error}`, namespacedPrompt.server_name);
        }
    }
    /**
     * List all available resources
     */
    async listResources() {
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
    async readResource(uri) {
        await this.ensureInitialized();
        const namespacedResource = this.namespacedResourceMap.get(uri);
        if (!namespacedResource) {
            throw new exceptions_1.ValidationError(`Resource '${uri}' not found`);
        }
        this.logger.debug(`Reading resource '${uri}' from server '${namespacedResource.server_name}'`);
        try {
            const connection = await this.getServerConnection(namespacedResource.server_name);
            const result = await connection.session.readResource({
                uri: namespacedResource.original_uri
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to read resource '${uri}'`, error);
            throw new exceptions_1.ConnectionError(`Failed to read resource '${uri}': ${error}`, namespacedResource.server_name);
        }
    }
    /**
     * Load capabilities from all configured servers
     */
    async loadServers() {
        const loadPromises = this.serverNames.map(serverName => this.loadServerCapabilities(serverName));
        await Promise.all(loadPromises);
    }
    /**
     * Load capabilities from a single server
     */
    async loadServerCapabilities(serverName) {
        this.logger.debug(`Loading capabilities from server '${serverName}'`);
        try {
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
            this.logger.info(`Loaded capabilities from server '${serverName}'`);
        }
        catch (error) {
            this.logger.error(`Failed to load capabilities from server '${serverName}'`, error);
            throw error;
        }
    }
    /**
     * Update tool maps with tools from a server
     */
    async updateToolMaps(serverName, tools) {
        await this.withLock(this.toolMapLock, async () => {
            const namespacedTools = [];
            for (const tool of tools) {
                const namespacedName = this.createNamespacedName(serverName, tool.name);
                const namespacedTool = {
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
    async updatePromptMaps(serverName, prompts) {
        await this.withLock(this.promptMapLock, async () => {
            const namespacedPrompts = [];
            for (const prompt of prompts) {
                const namespacedName = this.createNamespacedName(serverName, prompt.name);
                const namespacedPrompt = {
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
    async updateResourceMaps(serverName, resources) {
        await this.withLock(this.resourceMapLock, async () => {
            const namespacedResources = [];
            for (const resource of resources) {
                const namespacedUri = this.createNamespacedName(serverName, resource.uri);
                const namespacedResource = {
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
    createNamespacedName(serverName, originalName) {
        return `${serverName}${NAMESPACE_SEPARATOR}${originalName}`;
    }
    /**
     * Get a server connection (persistent or ephemeral)
     */
    async getServerConnection(serverName) {
        if (this.connectionPersistence && this.persistentConnectionManager) {
            return await this.persistentConnectionManager.getConnection(serverName);
        }
        else {
            // Create ephemeral connection
            // This would be implemented in the connection manager
            throw new Error('Ephemeral connections not yet implemented');
        }
    }
    /**
     * Initialize persistent connection management
     */
    async initializePersistentConnections() {
        // Get or create connection manager from context
        // This ensures connection managers are shared across aggregators
        if (!this.context.server_registry) {
            throw new Error('Server registry not initialized in context');
        }
        // Initialize connection manager tracking on context if not present
        if (!this.context._mcp_connection_manager_lock) {
            this.context._mcp_connection_manager_lock = Promise.resolve();
        }
        if (!this.context._mcp_connection_manager_ref_count) {
            this.context._mcp_connection_manager_ref_count = 0;
        }
        await this.withLock(this.context._mcp_connection_manager_lock, async () => {
            this.context._mcp_connection_manager_ref_count += 1;
            if (this.context._mcp_connection_manager) {
                this.persistentConnectionManager = this.context._mcp_connection_manager;
            }
            else {
                const connectionManager = new connectionManager_1.MCPConnectionManager(this.context.server_registry, this.logger);
                await connectionManager.initialize();
                this.context._mcp_connection_manager = connectionManager;
                this.persistentConnectionManager = connectionManager;
            }
        });
    }
    /**
     * Clean up persistent connections
     */
    async cleanupPersistentConnections() {
        if (!this.persistentConnectionManager) {
            return;
        }
        await this.withLock(this.context._mcp_connection_manager_lock, async () => {
            this.context._mcp_connection_manager_ref_count -= 1;
            if (this.context._mcp_connection_manager_ref_count <= 0) {
                await this.persistentConnectionManager.close();
                delete this.context._mcp_connection_manager;
            }
        });
    }
    /**
     * Ensure the aggregator is initialized
     */
    async ensureInitialized() {
        if (!this.initialized) {
            throw new Error('MCP Aggregator not initialized. Call initialize() first.');
        }
    }
    /**
     * Simple async lock implementation
     */
    async withLock(lock, fn) {
        const releaseLock = await lock;
        try {
            return await fn();
        }
        finally {
            // Release lock logic would go here if needed
        }
    }
}
exports.MCPAggregator = MCPAggregator;
