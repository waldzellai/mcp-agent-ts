export interface McpAgentConfig {
    serverName: string;
    version: string;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    capabilities?: {
        resources?: Record<string, unknown>;
        tools?: Record<string, unknown>;
    };
}
export declare function createDefaultConfig(name: string): McpAgentConfig;
