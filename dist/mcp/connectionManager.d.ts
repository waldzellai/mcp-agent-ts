/**
 * Manages the lifecycle of multiple MCP server connections
 */
import { EventEmitter } from 'events';
import { Logger } from '../core/context';
import { ServerConnection } from './types';
import { MCPServerRegistry } from './serverRegistry';
/**
 * Options for connection manager
 */
export interface ConnectionManagerOptions {
    maxRetries?: number;
    retryDelay?: number;
    connectionTimeout?: number;
    healthCheckInterval?: number;
}
/**
 * Manages persistent connections to multiple MCP servers
 */
export declare class MCPConnectionManager extends EventEmitter {
    private registry;
    private logger;
    private connections;
    private options;
    private healthCheckTimer?;
    private initialized;
    private closing;
    constructor(registry: MCPServerRegistry, logger: Logger, options?: ConnectionManagerOptions);
    /**
     * Initialize the connection manager
     */
    initialize(): Promise<void>;
    /**
     * Get a connection to a server, creating it if necessary
     */
    getConnection(serverName: string): Promise<ServerConnection>;
    /**
     * Create a new connection to a server
     */
    private createConnection;
    /**
     * Initialize a connection
     */
    private initializeConnection;
    /**
     * Create transport based on server configuration
     */
    private createTransport;
    /**
     * Close a specific connection
     */
    closeConnection(serverName: string): Promise<void>;
    /**
     * Close all connections and clean up
     */
    close(): Promise<void>;
    /**
     * Reconnect to a server
     */
    reconnect(serverName: string): Promise<ServerConnection>;
    /**
     * Get all active connections
     */
    getActiveConnections(): ServerConnection[];
    /**
     * Check if a connection is healthy
     */
    private isConnectionHealthy;
    /**
     * Start health check timer
     */
    private startHealthCheck;
    /**
     * Stop health check timer
     */
    private stopHealthCheck;
    /**
     * Perform health check on all connections
     */
    private performHealthCheck;
    /**
     * Execute a function with timeout
     */
    private withTimeout;
    /**
     * Get connection statistics
     */
    getStats(): {
        total: number;
        connected: number;
        error: number;
        connecting: number;
    };
}
