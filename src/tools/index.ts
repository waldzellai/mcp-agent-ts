import { McpServer } from '../mcp/mcpServer';
import { ToolHandler } from './types';
import { echoTool } from './echo';

/**
 * Default set of tool handlers exposed by the server.
 */
export const defaultTools: ToolHandler[] = [echoTool];

/**
 * Register provided tools with an MCP server instance.
 */
export function registerTools(server: McpServer, tools: ToolHandler[] = defaultTools): void {
  for (const tool of tools) {
    server.registerTool(tool.name, {
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema,
      handler: tool.handler
    });
  }
}

/**
 * Convenience method to retrieve tool metadata without handlers.
 */
export function listTools(tools: ToolHandler[] = defaultTools): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const tool of tools) {
    result[tool.name] = {
      description: tool.description,
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema
    };
  }
  return result;
}

export * from './types';
export * from './echo';
