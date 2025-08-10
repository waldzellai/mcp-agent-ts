export interface ToolHandler {
    name: string;
    description?: string;
    inputSchema?: unknown;
    outputSchema?: unknown;
    handler: (args: Record<string, any>) => Promise<unknown> | unknown;
}
