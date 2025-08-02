"use strict";
/**
 * Lightweight tool filtering utilities for MCP Agent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolFilter = void 0;
exports.createAllowFilter = createAllowFilter;
exports.createExcludeFilter = createExcludeFilter;
exports.createServerFilter = createServerFilter;
/**
 * A simple tool filter that can be applied to filter available tools
 */
class ToolFilter {
    allowed;
    excluded;
    serverFilters;
    customFilter;
    logger;
    constructor(options = {}, logger) {
        this.allowed = options.allowed ? new Set(options.allowed) : undefined;
        this.excluded = options.excluded ? new Set(options.excluded) : undefined;
        this.serverFilters = new Map(Object.entries(options.serverFilters || {}));
        this.customFilter = options.customFilter;
        this.logger = logger;
    }
    /**
     * Filter a list of tools based on the configured rules
     */
    filterTools(tools, serverName) {
        return tools.filter(tool => this.shouldIncludeTool(tool, serverName));
    }
    /**
     * Check if a tool should be included based on filter rules
     */
    shouldIncludeTool(tool, serverName) {
        const toolName = tool.name;
        // Apply custom filter first (highest priority)
        if (this.customFilter && !this.customFilter(tool)) {
            this.logFiltered(toolName, 'custom filter');
            return false;
        }
        // Apply server-specific filters if server name is provided
        if (serverName && this.serverFilters.has(serverName)) {
            const serverFilter = this.serverFilters.get(serverName);
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
    updateFilter(options) {
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
    getConfig() {
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
    clearFilters() {
        this.allowed = undefined;
        this.excluded = undefined;
        this.serverFilters.clear();
        this.customFilter = undefined;
    }
    /**
     * Log filtered tool
     */
    logFiltered(toolName, reason) {
        if (this.logger) {
            this.logger.debug(`Tool '${toolName}' filtered: ${reason}`);
        }
    }
}
exports.ToolFilter = ToolFilter;
/**
 * Create a simple allow-list filter
 */
function createAllowFilter(allowedTools) {
    return new ToolFilter({ allowed: allowedTools });
}
/**
 * Create a simple exclude-list filter
 */
function createExcludeFilter(excludedTools) {
    return new ToolFilter({ excluded: excludedTools });
}
/**
 * Create a server-specific filter
 */
function createServerFilter(serverFilters) {
    return new ToolFilter({ serverFilters });
}
