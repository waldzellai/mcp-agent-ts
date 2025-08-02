/**
 * Main Agent class integrating MCP capabilities with LLM interactions
 */
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Context } from '../core/context';
import { ContextDependentBase } from '../core/contextDependent';
import { NamespacedPrompt, NamespacedResource } from '../mcp/types';
import { AgentConfig, AgentMessage, AgentResponse, AugmentedLLM, HumanInputRequest, HumanInputResponse } from './types';
/**
 * Agent class that manages MCP server connections and LLM interactions
 */
export declare class Agent extends ContextDependentBase {
    readonly id: string;
    readonly name: string;
    private instruction?;
    private serverNames;
    private connectionPersistence;
    private aggregator?;
    private llm?;
    private initialized;
    private messages;
    constructor(context: Context, config: AgentConfig);
    /**
     * Initialize the agent and its MCP connections
     */
    initialize(): Promise<void>;
    /**
     * Clean up agent resources
     */
    cleanup(): Promise<void>;
    /**
     * Context manager support
     */
    __aenter__(): Promise<this>;
    __aexit__(excType?: any, excVal?: any, excTb?: any): Promise<void>;
    /**
     * Set the LLM for this agent
     */
    setLLM(llm: AugmentedLLM): void;
    /**
     * Get available tools from connected MCP servers
     */
    getTools(): Promise<Tool[]>;
    /**
     * Get available prompts from connected MCP servers
     */
    getPrompts(): Promise<NamespacedPrompt[]>;
    /**
     * Get available resources from connected MCP servers
     */
    getResources(): Promise<NamespacedResource[]>;
    /**
     * Call a tool through the MCP aggregator
     */
    callTool(name: string, args: any): Promise<CallToolResult>;
    /**
     * Send a message to the agent and get a response
     */
    sendMessage(content: string, options?: {
        tools?: boolean;
        temperature?: number;
        max_tokens?: number;
    }): Promise<AgentResponse>;
    /**
     * Execute a tool call
     */
    private executeToolCall;
    /**
     * Format tool result for message history
     */
    private formatToolResult;
    /**
     * Get conversation history
     */
    getMessages(): AgentMessage[];
    /**
     * Clear conversation history (keeping system instruction)
     */
    clearHistory(): void;
    /**
     * Request human input
     */
    requestHumanInput(request: HumanInputRequest): Promise<HumanInputResponse>;
    /**
     * Get a prompt by name
     */
    getPrompt(name: string, args?: any): Promise<string>;
    /**
     * Read a resource by URI
     */
    readResource(uri: string): Promise<string>;
    /**
     * Ensure agent is initialized
     */
    private ensureInitialized;
    /**
     * Get agent configuration
     */
    getConfig(): AgentConfig;
    /**
     * Get agent statistics
     */
    getStats(): {
        id: string;
        name: string;
        messageCount: number;
        serverCount: number;
        initialized: boolean;
    };
}
