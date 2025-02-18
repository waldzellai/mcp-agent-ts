export declare class McpAgentCli {
    private server;
    private logger;
    constructor(serverName?: string);
    initialize(): void;
    private startServer;
    private listTools;
    private listResources;
    private setLogLevel;
}
export declare function runCli(): void;
