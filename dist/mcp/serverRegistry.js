"use strict";
/**
 * Registry for managing MCP server configurations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerRegistry = void 0;
const events_1 = require("events");
const exceptions_1 = require("../core/exceptions");
class MCPServerRegistry extends events_1.EventEmitter {
    servers = new Map();
    connections = new Map();
    logger;
    constructor(logger) {
        super();
        this.logger = logger;
    }
    /**
     * Register a new server configuration
     */
    register(name, config) {
        if (!name) {
            throw new exceptions_1.ValidationError('Server name is required');
        }
        if (this.servers.has(name)) {
            throw new exceptions_1.ConfigurationError(`Server '${name}' is already registered`);
        }
        // Validate configuration
        this.validateConfig(name, config);
        // Store configuration
        this.servers.set(name, { ...config, name });
        this.logger.info(`Registered MCP server: ${name}`);
        this.emit('server-registered', name, config);
    }
    /**
     * Get server configuration by name
     */
    get(name) {
        return this.servers.get(name);
    }
    /**
     * Get all registered server names
     */
    list() {
        return Array.from(this.servers.keys());
    }
    /**
     * Remove a server registration
     */
    unregister(name) {
        const config = this.servers.get(name);
        if (!config) {
            return false;
        }
        // Disconnect if connected
        const connection = this.connections.get(name);
        if (connection?.connected) {
            this.logger.warn(`Unregistering connected server '${name}' - connection will be closed`);
            // TODO: Implement disconnection logic
        }
        this.servers.delete(name);
        this.connections.delete(name);
        this.logger.info(`Unregistered MCP server: ${name}`);
        this.emit('server-unregistered', name);
        return true;
    }
    /**
     * Get connection for a server
     */
    getConnection(name) {
        return this.connections.get(name);
    }
    /**
     * Store connection information
     */
    setConnection(name, connection) {
        if (!this.servers.has(name)) {
            throw new exceptions_1.ConfigurationError(`Cannot set connection for unregistered server '${name}'`);
        }
        this.connections.set(name, connection);
        this.emit('connection-updated', name, connection);
    }
    /**
     * Get all active connections
     */
    getActiveConnections() {
        return Array.from(this.connections.values()).filter(conn => conn.connected);
    }
    /**
     * Check if a server is registered
     */
    has(name) {
        return this.servers.has(name);
    }
    /**
     * Check if a server is connected
     */
    isConnected(name) {
        const connection = this.connections.get(name);
        return connection?.connected || false;
    }
    /**
     * Validate server configuration
     */
    validateConfig(name, config) {
        if (!config.transport) {
            config.transport = 'stdio'; // Default transport
        }
        // Validate based on transport type
        switch (config.transport) {
            case 'stdio':
                if (!config.command) {
                    throw new exceptions_1.ValidationError(`Server '${name}' with stdio transport requires 'command'`);
                }
                break;
            case 'http':
            case 'websocket':
                if (!config.url) {
                    throw new exceptions_1.ValidationError(`Server '${name}' with ${config.transport} transport requires 'url'`);
                }
                break;
            default:
                throw new exceptions_1.ValidationError(`Invalid transport type '${config.transport}' for server '${name}'`);
        }
    }
    /**
     * Clear all registrations
     */
    clear() {
        // Warn about active connections
        const activeConnections = this.getActiveConnections();
        if (activeConnections.length > 0) {
            this.logger.warn(`Clearing registry with ${activeConnections.length} active connections`);
        }
        this.servers.clear();
        this.connections.clear();
        this.emit('registry-cleared');
    }
    /**
     * Export configuration for persistence
     */
    export() {
        const exported = {};
        for (const [name, config] of this.servers) {
            exported[name] = { ...config };
        }
        return exported;
    }
    /**
     * Import configuration from persisted data
     */
    import(data) {
        for (const [name, config] of Object.entries(data)) {
            try {
                this.register(name, config);
            }
            catch (error) {
                this.logger.error(`Failed to import server '${name}'`, error);
            }
        }
    }
}
exports.MCPServerRegistry = MCPServerRegistry;
