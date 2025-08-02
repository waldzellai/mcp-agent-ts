/**
 * Registry for managing MCP server configurations
 */

import { EventEmitter } from 'events';
import { ConfigurationError, ValidationError } from '../core/exceptions';
import { ServerConfig, ServerConnection } from './types';
import { Logger } from '../core/context';

export class MCPServerRegistry extends EventEmitter {
    private servers: Map<string, ServerConfig> = new Map();
    private connections: Map<string, ServerConnection> = new Map();
    private logger: Logger;

    constructor(logger: Logger) {
        super();
        this.logger = logger;
    }

    /**
     * Register a new server configuration
     */
    public register(name: string, config: ServerConfig): void {
        if (!name) {
            throw new ValidationError('Server name is required');
        }

        if (this.servers.has(name)) {
            throw new ConfigurationError(`Server '${name}' is already registered`);
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
    public get(name: string): ServerConfig | undefined {
        return this.servers.get(name);
    }

    /**
     * Get all registered server names
     */
    public list(): string[] {
        return Array.from(this.servers.keys());
    }

    /**
     * Remove a server registration
     */
    public unregister(name: string): boolean {
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
    public getConnection(name: string): ServerConnection | undefined {
        return this.connections.get(name);
    }

    /**
     * Store connection information
     */
    public setConnection(name: string, connection: ServerConnection): void {
        if (!this.servers.has(name)) {
            throw new ConfigurationError(`Cannot set connection for unregistered server '${name}'`);
        }
        this.connections.set(name, connection);
        this.emit('connection-updated', name, connection);
    }

    /**
     * Get all active connections
     */
    public getActiveConnections(): ServerConnection[] {
        return Array.from(this.connections.values()).filter(conn => conn.connected);
    }

    /**
     * Check if a server is registered
     */
    public has(name: string): boolean {
        return this.servers.has(name);
    }

    /**
     * Check if a server is connected
     */
    public isConnected(name: string): boolean {
        const connection = this.connections.get(name);
        return connection?.connected || false;
    }

    /**
     * Validate server configuration
     */
    private validateConfig(name: string, config: ServerConfig): void {
        if (!config.transport) {
            config.transport = 'stdio'; // Default transport
        }

        // Validate based on transport type
        switch (config.transport) {
            case 'stdio':
                if (!config.command) {
                    throw new ValidationError(`Server '${name}' with stdio transport requires 'command'`);
                }
                break;
            
            case 'http':
            case 'websocket':
                if (!config.url) {
                    throw new ValidationError(`Server '${name}' with ${config.transport} transport requires 'url'`);
                }
                break;
            
            default:
                throw new ValidationError(`Invalid transport type '${config.transport}' for server '${name}'`);
        }
    }

    /**
     * Clear all registrations
     */
    public clear(): void {
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
    public export(): Record<string, ServerConfig> {
        const exported: Record<string, ServerConfig> = {};
        for (const [name, config] of this.servers) {
            exported[name] = { ...config };
        }
        return exported;
    }

    /**
     * Import configuration from persisted data
     */
    public import(data: Record<string, ServerConfig>): void {
        for (const [name, config] of Object.entries(data)) {
            try {
                this.register(name, config);
            } catch (error) {
                this.logger.error(`Failed to import server '${name}'`, error);
            }
        }
    }
}