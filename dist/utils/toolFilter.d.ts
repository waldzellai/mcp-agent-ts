/**
 * Lightweight tool filtering utilities for MCP Agent
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../core/context';
/**
 * Configuration for server-specific filters
 */
export interface ServerFilter {
    allowed?: string[];
    excluded?: string[];
}
/**
 * Tool filter options
 */
export interface ToolFilterOptions {
    allowed?: string[];
    excluded?: string[];
    serverFilters?: Record<string, ServerFilter>;
    customFilter?: (tool: Tool) => boolean;
}
/**
 * A simple tool filter that can be applied to filter available tools
 */
export declare class ToolFilter {
    private allowed?;
    private excluded?;
    private serverFilters;
    private customFilter?;
    private logger?;
    constructor(options?: ToolFilterOptions, logger?: Logger);
    /**
     * Filter a list of tools based on the configured rules
     */
    filterTools(tools: Tool[], serverName?: string): Tool[];
    /**
     * Check if a tool should be included based on filter rules
     */
    shouldIncludeTool(tool: Tool, serverName?: string): boolean;
    /**
     * Update filter configuration
     */
    updateFilter(options: Partial<ToolFilterOptions>): void;
    /**
     * Get current filter configuration
     */
    getConfig(): ToolFilterOptions;
    /**
     * Clear all filters
     */
    clearFilters(): void;
    /**
     * Log filtered tool
     */
    private logFiltered;
}
/**
 * Create a simple allow-list filter
 */
export declare function createAllowFilter(allowedTools: string[]): ToolFilter;
/**
 * Create a simple exclude-list filter
 */
export declare function createExcludeFilter(excludedTools: string[]): ToolFilter;
/**
 * Create a server-specific filter
 */
export declare function createServerFilter(serverFilters: Record<string, ServerFilter>): ToolFilter;
