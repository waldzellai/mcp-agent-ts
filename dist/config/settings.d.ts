export interface MCPServerAuthSettings {
    api_key?: string;
    [key: string]: unknown;
}
export interface MCPRootSettings {
    uri: string;
    name?: string;
    server_uri_alias?: string;
    [key: string]: unknown;
}
export type MCPTransport = 'stdio' | 'sse' | 'streamable_http' | 'websocket';
export interface MCPServerSettings {
    name?: string;
    description?: string;
    transport?: MCPTransport;
    command?: string;
    args?: string[];
    url?: string;
    headers?: Record<string, string>;
    http_timeout_seconds?: number;
    read_timeout_seconds?: number;
    terminate_on_close?: boolean;
    auth?: MCPServerAuthSettings;
    roots?: MCPRootSettings[];
    env?: Record<string, string>;
    [key: string]: unknown;
}
export interface MCPSettings {
    servers?: Record<string, MCPServerSettings>;
    [key: string]: unknown;
}
export interface Settings {
    mcp?: MCPSettings;
    execution_engine?: 'asyncio' | 'temporal';
    [key: string]: unknown;
}
export declare function loadSettings(configPath?: string): Settings;
export declare function getSettings(configPath?: string): Settings;
export declare function clearSettingsCache(): void;
export declare function findConfig(): string | null;
export declare function findSecrets(): string | null;
