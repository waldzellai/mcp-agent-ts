/**
 * Registry for managing MCP server configurations
 */
import { EventEmitter } from 'events';
import { ServerConfig, ServerConnection } from './types';
import { Logger } from '../core/context';
export declare class MCPServerRegistry extends EventEmitter {
    private servers;
    private connections;
    private logger;
    constructor(logger: Logger);
    /**
     * Register a new server configuration
     */
    register(name: string, config: ServerConfig): void;
    /**
     * Get server configuration by name
     */
    get(name: string): ServerConfig | undefined;
    /**
     * Get all registered server names
     */
    list(): string[];
    /**
     * Remove a server registration
     */
    unregister(name: string): boolean;
    /**
     * Get connection for a server
     */
    getConnection(name: string): ServerConnection | undefined;
    /**
     * Store connection information
     */
    setConnection(name: string, connection: ServerConnection): void;
    /**
     * Get all active connections
     */
    getActiveConnections(): ServerConnection[];
    /**
     * Check if a server is registered
     */
    has(name: string): boolean;
    /**
     * Check if a server is connected
     */
    isConnected(name: string): boolean;
    /**
     * Validate server configuration
     */
    private validateConfig;
    /**
     * Clear all registrations
     */
    clear(): void;
    /**
     * Export configuration for persistence
     */
    export(): Record<string, ServerConfig>;
    /**
     * Import configuration from persisted data
     */
    import(data: Record<string, ServerConfig>): void;
}
