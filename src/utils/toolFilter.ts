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
export class ToolFilter {
    private allowed?: Set<string>;
    private excluded?: Set<string>;
    private serverFilters: Map<string, ServerFilter>;
    private customFilter?: (tool: Tool) => boolean;
    private logger?: Logger;

    constructor(options: ToolFilterOptions = {}, logger?: Logger) {
        this.allowed = options.allowed ? new Set(options.allowed) : undefined;
        this.excluded = options.excluded ? new Set(options.excluded) : undefined;
        this.serverFilters = new Map(Object.entries(options.serverFilters || {}));
        this.customFilter = options.customFilter;
        this.logger = logger;
    }

    /**
     * Filter a list of tools based on the configured rules
     */
    public filterTools(tools: Tool[], serverName?: string): Tool[] {
        return tools.filter(tool => this.shouldIncludeTool(tool, serverName));
    }

    /**
     * Check if a tool should be included based on filter rules
     */
    public shouldIncludeTool(tool: Tool, serverName?: string): boolean {
        const toolName = tool.name;

        // Apply custom filter first (highest priority)
        if (this.customFilter && !this.customFilter(tool)) {
            this.logFiltered(toolName, 'custom filter');
            return false;
        }

        // Apply server-specific filters if server name is provided
        if (serverName && this.serverFilters.has(serverName)) {
            const serverFilter = this.serverFilters.get(serverName)!;
            
            // Server-specific whitelist
            if (serverFilter.allowed && !serverFilter.allowed.includes(toolName)) {
                this.logFiltered(toolName, `not in ${serverName} allowed list`);
                return false;
            }
            
            // Server-specific blacklist
            if (serverFilter.excluded && serverFilter.excluded.includes(toolName)) {
                this.logFiltered(toolName, `in ${serverName} excluded list`);
                return false;
            }
        }

        // Apply global whitelist
        if (this.allowed && !this.allowed.has(toolName)) {
            this.logFiltered(toolName, 'not in global allowed list');
            return false;
        }

        // Apply global blacklist
        if (this.excluded && this.excluded.has(toolName)) {
            this.logFiltered(toolName, 'in global excluded list');
            return false;
        }

        return true;
    }

    /**
     * Update filter configuration
     */
    public updateFilter(options: Partial<ToolFilterOptions>): void {
        if (options.allowed !== undefined) {
            this.allowed = options.allowed.length > 0 ? new Set(options.allowed) : undefined;
        }
        
        if (options.excluded !== undefined) {
            this.excluded = options.excluded.length > 0 ? new Set(options.excluded) : undefined;
        }
        
        if (options.serverFilters !== undefined) {
            this.serverFilters = new Map(Object.entries(options.serverFilters));
        }
        
        if (options.customFilter !== undefined) {
            this.customFilter = options.customFilter;
        }
    }

    /**
     * Get current filter configuration
     */
    public getConfig(): ToolFilterOptions {
        return {
            allowed: this.allowed ? Array.from(this.allowed) : undefined,
            excluded: this.excluded ? Array.from(this.excluded) : undefined,
            serverFilters: Object.fromEntries(this.serverFilters),
            customFilter: this.customFilter
        };
    }

    /**
     * Clear all filters
     */
    public clearFilters(): void {
        this.allowed = undefined;
        this.excluded = undefined;
        this.serverFilters.clear();
        this.customFilter = undefined;
    }

    /**
     * Log filtered tool
     */
    private logFiltered(toolName: string, reason: string): void {
        if (this.logger) {
            this.logger.debug(`Tool '${toolName}' filtered: ${reason}`);
        }
    }
}

/**
 * Create a simple allow-list filter
 */
export function createAllowFilter(allowedTools: string[]): ToolFilter {
    return new ToolFilter({ allowed: allowedTools });
}

/**
 * Create a simple exclude-list filter
 */
export function createExcludeFilter(excludedTools: string[]): ToolFilter {
    return new ToolFilter({ excluded: excludedTools });
}

/**
 * Create a server-specific filter
 */
export function createServerFilter(serverFilters: Record<string, ServerFilter>): ToolFilter {
    return new ToolFilter({ serverFilters });
}