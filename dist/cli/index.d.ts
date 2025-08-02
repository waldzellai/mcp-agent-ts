#!/usr/bin/env node
export declare class McpAgentCli {
    private mcpServer;
    private localServer;
    private logger;
    constructor(serverName?: string);
    private listTools;
    private listResources;
    start(): Promise<void>;
    initialize(): void;
}
export declare function runCli(): void;
