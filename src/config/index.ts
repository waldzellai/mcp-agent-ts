// Configuration module exports

export * from './settings';

export interface McpAgentConfig {
  serverName: string;
  version: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  capabilities?: {
    resources?: Record<string, unknown>;
    tools?: Record<string, unknown>;
  };
}

export function createDefaultConfig(name: string): McpAgentConfig {
  return {
    serverName: name,
    version: '0.1.0',
    logLevel: 'info',
    capabilities: {
      resources: {},
      tools: {}
    }
  };
}
