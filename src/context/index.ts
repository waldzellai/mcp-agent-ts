// Context module exports

export interface McpContext {
  traceId: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export class ContextManager {
  private static instance: ContextManager;
  private currentContext: McpContext | null = null;

  private constructor() {}

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  public createContext(metadata: Record<string, unknown> = {}): McpContext {
    this.currentContext = {
      traceId: this.generateTraceId(),
      timestamp: Date.now(),
      metadata
    };
    return this.currentContext;
  }

  public getCurrentContext(): McpContext | null {
    return this.currentContext;
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
