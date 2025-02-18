export interface McpContext {
    traceId: string;
    timestamp: number;
    metadata: Record<string, unknown>;
}
export declare class ContextManager {
    private static instance;
    private currentContext;
    private constructor();
    static getInstance(): ContextManager;
    createContext(metadata?: Record<string, unknown>): McpContext;
    getCurrentContext(): McpContext | null;
    private generateTraceId;
}
