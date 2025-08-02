/**
 * Manages the lifecycle of multiple MCP server connections
 */

import { EventEmitter } from 'events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

import { Logger } from '../core/context';
import { ConnectionError, TimeoutError, ConfigurationError } from '../core/exceptions';
import { ServerConfig, ServerConnection, ServerCapabilities } from './types';
import { MCPServerRegistry } from './serverRegistry';

/**
 * Connection state for tracking server connections
 */
interface ConnectionState {
    connection: ServerConnection;
    client: Client;
    transport: any; // Transport type varies
    initPromise?: Promise<void>;
    error?: Error;
    lastAttempt?: Date;
    retryCount: number;
}

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
export class MCPConnectionManager extends EventEmitter {
    private registry: MCPServerRegistry;
    private logger: Logger;
    private connections: Map<string, ConnectionState> = new Map();
    private options: Required<ConnectionManagerOptions>;
    private healthCheckTimer?: NodeJS.Timeout;
    private initialized: boolean = false;
    private closing: boolean = false;

    constructor(
        registry: MCPServerRegistry,
        logger: Logger,
        options: ConnectionManagerOptions = {}
    ) {
        super();
        this.registry = registry;
        this.logger = logger;
        this.options = {
            maxRetries: options.maxRetries ?? 3,
            retryDelay: options.retryDelay ?? 1000,
            connectionTimeout: options.connectionTimeout ?? 30000,
            healthCheckInterval: options.healthCheckInterval ?? 30000
        };
    }

    /**
     * Initialize the connection manager
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.logger.info('Initializing MCP Connection Manager');

        // Start health check timer
        if (this.options.healthCheckInterval > 0) {
            this.startHealthCheck();
        }

        this.initialized = true;
        this.emit('initialized');
    }

    /**
     * Get a connection to a server, creating it if necessary
     */
    public async getConnection(serverName: string): Promise<ServerConnection> {
        if (!this.initialized) {
            throw new Error('Connection manager not initialized');
        }

        // Check if connection exists and is healthy
        const state = this.connections.get(serverName);
        if (state && this.isConnectionHealthy(state)) {
            return state.connection;
        }

        // Get server config
        const config = this.registry.get(serverName);
        if (!config) {
            throw new ConfigurationError(`Server '${serverName}' not found in registry`);
        }

        // Create or reconnect
        return await this.createConnection(serverName, config);
    }

    /**
     * Create a new connection to a server
     */
    private async createConnection(serverName: string, config: ServerConfig): Promise<ServerConnection> {
        this.logger.info(`Creating connection to server '${serverName}'`);

        // Check if we're already connecting
        const existingState = this.connections.get(serverName);
        if (existingState?.initPromise) {
            await existingState.initPromise;
            if (this.isConnectionHealthy(existingState)) {
                return existingState.connection;
            }
        }

        const state: ConnectionState = {
            connection: {
                name: serverName,
                config: config,
                connected: false,
                session: undefined,
                capabilities: undefined
            },
            client: new Client({
                name: `mcp-agent-client-${serverName}`,
                version: '1.0.0'
            }, {
                capabilities: {}
            }),
            transport: undefined,
            retryCount: existingState?.retryCount ?? 0
        };

        // Store state immediately
        this.connections.set(serverName, state);

        // Create init promise
        state.initPromise = this.initializeConnection(state);

        try {
            await state.initPromise;
            return state.connection;
        } catch (error) {
            // Clean up on failure
            if (state.retryCount >= this.options.maxRetries) {
                this.connections.delete(serverName);
            }
            throw error;
        } finally {
            delete state.initPromise;
        }
    }

    /**
     * Initialize a connection
     */
    private async initializeConnection(state: ConnectionState): Promise<void> {
        const { connection, client } = state;
        const { name, config } = connection;

        try {
            // Create transport based on config
            const transport = await this.createTransport(config);
            state.transport = transport;

            // Connect with timeout
            await this.withTimeout(
                client.connect(transport),
                this.options.connectionTimeout,
                `Connection to server '${name}' timed out`
            );

            // Store session and capabilities
            connection.session = client;
            connection.capabilities = client.getServerCapabilities() as ServerCapabilities;
            connection.connected = true;

            // Reset error state
            delete state.error;
            state.retryCount = 0;
            state.lastAttempt = new Date();

            this.logger.info(`Successfully connected to server '${name}'`);
            this.emit('connection-established', name, connection);

            // Update registry
            this.registry.setConnection(name, connection);

        } catch (error) {
            state.error = error as Error;
            state.lastAttempt = new Date();
            state.retryCount++;
            connection.connected = false;

            const errorMessage = `Failed to connect to server '${name}': ${error}`;
            this.logger.error(errorMessage);
            
            throw new ConnectionError(errorMessage, name);
        }
    }

    /**
     * Create transport based on server configuration
     */
    private async createTransport(config: ServerConfig): Promise<any> {
        switch (config.transport) {
            case 'stdio':
                if (!config.command) {
                    throw new ConfigurationError('Stdio transport requires command');
                }
                const env: Record<string, string> = { ...process.env as Record<string, string> };
                if (config.env) {
                    Object.assign(env, config.env);
                }
                return new StdioClientTransport({
                    command: config.command,
                    args: config.args,
                    env
                });

            case 'websocket':
                if (!config.url) {
                    throw new ConfigurationError('WebSocket transport requires URL');
                }
                return new WebSocketClientTransport(new URL(config.url));

            case 'http':
                if (!config.url) {
                    throw new ConfigurationError('HTTP transport requires URL');
                }
                return new SSEClientTransport(new URL(config.url));

            default:
                throw new ConfigurationError(`Unsupported transport: ${config.transport}`);
        }
    }

    /**
     * Close a specific connection
     */
    public async closeConnection(serverName: string): Promise<void> {
        const state = this.connections.get(serverName);
        if (!state) {
            return;
        }

        this.logger.info(`Closing connection to server '${serverName}'`);

        try {
            if (state.client && state.connection.connected) {
                await state.client.close();
            }

            if (state.transport && typeof state.transport.close === 'function') {
                await state.transport.close();
            }
        } catch (error) {
            this.logger.error(`Error closing connection to '${serverName}'`, error);
        } finally {
            this.connections.delete(serverName);
            this.emit('connection-closed', serverName);
        }
    }

    /**
     * Close all connections and clean up
     */
    public async close(): Promise<void> {
        if (this.closing) {
            return;
        }

        this.closing = true;
        this.logger.info('Closing all MCP connections...');

        // Stop health check
        this.stopHealthCheck();

        // Close all connections in parallel
        const closePromises = Array.from(this.connections.keys()).map(
            serverName => this.closeConnection(serverName)
        );

        await Promise.all(closePromises);

        this.connections.clear();
        this.initialized = false;
        this.closing = false;
        
        this.logger.info('All MCP connections closed');
        this.emit('closed');
    }

    /**
     * Reconnect to a server
     */
    public async reconnect(serverName: string): Promise<ServerConnection> {
        await this.closeConnection(serverName);
        return await this.getConnection(serverName);
    }

    /**
     * Get all active connections
     */
    public getActiveConnections(): ServerConnection[] {
        const active: ServerConnection[] = [];
        
        for (const state of this.connections.values()) {
            if (this.isConnectionHealthy(state)) {
                active.push(state.connection);
            }
        }

        return active;
    }

    /**
     * Check if a connection is healthy
     */
    private isConnectionHealthy(state: ConnectionState): boolean {
        return state.connection.connected && 
               !state.error && 
               state.client !== undefined &&
               state.connection.session !== undefined;
    }

    /**
     * Start health check timer
     */
    private startHealthCheck(): void {
        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck().catch(error => {
                this.logger.error('Health check failed', error);
            });
        }, this.options.healthCheckInterval);
    }

    /**
     * Stop health check timer
     */
    private stopHealthCheck(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }

    /**
     * Perform health check on all connections
     */
    private async performHealthCheck(): Promise<void> {
        if (this.closing) {
            return;
        }

        const checks: Promise<void>[] = [];

        for (const [serverName, state] of this.connections.entries()) {
            if (!this.isConnectionHealthy(state)) {
                // Attempt to reconnect unhealthy connections
                checks.push(
                    this.reconnect(serverName)
                        .then(() => undefined)
                        .catch(error => {
                            this.logger.warn(`Failed to reconnect to '${serverName}' during health check`, error);
                        })
                );
            }
        }

        await Promise.all(checks);
    }

    /**
     * Execute a function with timeout
     */
    private async withTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number,
        errorMessage: string
    ): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new TimeoutError(errorMessage, timeoutMs)), timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]);
    }

    /**
     * Get connection statistics
     */
    public getStats(): {
        total: number;
        connected: number;
        error: number;
        connecting: number;
    } {
        let connected = 0;
        let error = 0;
        let connecting = 0;

        for (const state of this.connections.values()) {
            if (state.initPromise) {
                connecting++;
            } else if (this.isConnectionHealthy(state)) {
                connected++;
            } else if (state.error) {
                error++;
            }
        }

        return {
            total: this.connections.size,
            connected,
            error,
            connecting
        };
    }
}