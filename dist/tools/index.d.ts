import { McpServer } from '../mcp/mcpServer';
import { ToolHandler } from './types';
/**
 * Default set of tool handlers exposed by the server.
 */
export declare const defaultTools: ToolHandler[];
/**
 * Register provided tools with an MCP server instance.
 */
export declare function registerTools(server: McpServer, tools?: ToolHandler[]): void;
/**
 * Convenience method to retrieve tool metadata without handlers.
 */
export declare function listTools(tools?: ToolHandler[]): Record<string, unknown>;
export * from './types';
export * from './echo';
