/**
 * Main Agent class integrating MCP capabilities with LLM interactions
 */

import { v4 as uuidv4 } from 'uuid';
import { 
    Tool, 
    CallToolResult,
    TextContent,
    ImageContent,
    EmbeddedResource
} from '@modelcontextprotocol/sdk/types.js';

import { Context } from '../core/context';
import { ContextDependentBase } from '../core/contextDependent';
import { ValidationError } from '../core/exceptions';
import { MCPAggregator } from '../mcp/aggregator';
import { NamespacedTool, NamespacedPrompt, NamespacedResource } from '../mcp/types';
import {
    AgentConfig,
    AgentMessage,
    AgentResponse,
    AugmentedLLM,
    ToolCall,
    HumanInputRequest,
    HumanInputResponse
} from './types';

/**
 * Agent class that manages MCP server connections and LLM interactions
 */
export class Agent extends ContextDependentBase {
    public readonly id: string;
    public readonly name: string;
    private instruction?: string;
    private serverNames: string[];
    private connectionPersistence: boolean;
    private aggregator?: MCPAggregator;
    private llm?: AugmentedLLM;
    private initialized: boolean = false;

    // Conversation history
    private messages: AgentMessage[] = [];

    constructor(
        context: Context,
        config: AgentConfig
    ) {
        super(context);
        
        this.id = uuidv4();
        this.name = config.name;
        this.instruction = config.instruction;
        this.serverNames = config.server_names || [];
        this.connectionPersistence = config.connection_persistence ?? true;

        // Log agent creation
        this.logger.info(`Created agent '${this.name}' with ID: ${this.id}`);
    }

    /**
     * Initialize the agent and its MCP connections
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.logger.info(`Initializing agent '${this.name}'...`);

        try {
            // Create and initialize MCP aggregator if servers are configured
            if (this.serverNames.length > 0) {
                this.aggregator = new MCPAggregator(
                    this.context,
                    this.serverNames,
                    {
                        connectionPersistence: this.connectionPersistence,
                        name: this.name
                    }
                );
                await this.aggregator.initialize();
            }

            // Add system instruction if provided
            if (this.instruction) {
                this.messages.push({
                    role: 'system',
                    content: this.instruction
                });
            }

            this.initialized = true;
            this.logger.info(`Agent '${this.name}' initialized successfully`);
        } catch (error) {
            this.logger.error(`Failed to initialize agent '${this.name}'`, error);
            throw error;
        }
    }

    /**
     * Clean up agent resources
     */
    public async cleanup(): Promise<void> {
        this.logger.info(`Cleaning up agent '${this.name}'...`);

        try {
            if (this.aggregator) {
                await this.aggregator.close();
            }

            this.initialized = false;
            this.logger.info(`Agent '${this.name}' cleaned up successfully`);
        } catch (error) {
            this.logger.error(`Error cleaning up agent '${this.name}'`, error);
            throw error;
        }
    }

    /**
     * Context manager support
     */
    public async __aenter__(): Promise<this> {
        await this.initialize();
        return this;
    }

    public async __aexit__(excType?: any, excVal?: any, excTb?: any): Promise<void> {
        await this.cleanup();
    }

    /**
     * Set the LLM for this agent
     */
    public setLLM(llm: AugmentedLLM): void {
        this.llm = llm;
        this.logger.debug(`Set LLM for agent '${this.name}': ${llm.model}`);
    }

    /**
     * Get available tools from connected MCP servers
     */
    public async getTools(): Promise<Tool[]> {
        if (!this.aggregator) {
            return [];
        }

        const result = await this.aggregator.listTools();
        return result.tools;
    }

    /**
     * Get available prompts from connected MCP servers
     */
    public async getPrompts(): Promise<NamespacedPrompt[]> {
        if (!this.aggregator) {
            return [];
        }

        const result = await this.aggregator.listPrompts();
        return result.prompts as NamespacedPrompt[];
    }

    /**
     * Get available resources from connected MCP servers
     */
    public async getResources(): Promise<NamespacedResource[]> {
        if (!this.aggregator) {
            return [];
        }

        const result = await this.aggregator.listResources();
        return result.resources as NamespacedResource[];
    }

    /**
     * Call a tool through the MCP aggregator
     */
    public async callTool(name: string, args: any): Promise<CallToolResult> {
        if (!this.aggregator) {
            throw new ValidationError('No MCP servers configured');
        }

        this.logger.debug(`Agent '${this.name}' calling tool: ${name}`);
        return await this.aggregator.callTool(name, args);
    }

    /**
     * Send a message to the agent and get a response
     */
    public async sendMessage(
        content: string,
        options?: {
            tools?: boolean;
            temperature?: number;
            max_tokens?: number;
        }
    ): Promise<AgentResponse> {
        await this.ensureInitialized();

        if (!this.llm) {
            throw new ValidationError('No LLM configured for this agent');
        }

        // Add user message to history
        this.messages.push({
            role: 'user',
            content
        });

        // Get available tools if requested
        let tools: Tool[] | undefined;
        if (options?.tools && this.aggregator) {
            tools = await this.getTools();
        }

        // Generate response
        const response = await this.llm.generate(
            this.messages,
            tools,
            {
                temperature: options?.temperature,
                max_tokens: options?.max_tokens
            }
        );

        // Handle tool calls if present
        if (response.tool_calls && response.tool_calls.length > 0) {
            // Add assistant message with tool calls
            this.messages.push({
                role: 'assistant',
                content: response.content,
                tool_calls: response.tool_calls
            });

            // Execute tool calls
            for (const toolCall of response.tool_calls) {
                await this.executeToolCall(toolCall);
            }

            // Get final response after tool execution
            return await this.llm.generate(this.messages, tools, options);
        }

        // Add assistant response to history
        this.messages.push({
            role: 'assistant',
            content: response.content
        });

        return response;
    }

    /**
     * Execute a tool call
     */
    private async executeToolCall(toolCall: ToolCall): Promise<void> {
        try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await this.callTool(toolCall.function.name, args);

            // Add tool result to messages
            this.messages.push({
                role: 'tool',
                content: this.formatToolResult(result),
                tool_call_id: toolCall.id,
                name: toolCall.function.name
            });
        } catch (error) {
            // Add error to messages
            this.messages.push({
                role: 'tool',
                content: `Error calling tool: ${error}`,
                tool_call_id: toolCall.id,
                name: toolCall.function.name
            });
        }
    }

    /**
     * Format tool result for message history
     */
    private formatToolResult(result: CallToolResult): string {
        if (!result.content || result.content.length === 0) {
            return 'Tool executed successfully with no output';
        }

        // Convert content array to string
        return result.content
            .map(item => {
                if (item.type === 'text') {
                    return (item as TextContent).text;
                } else if (item.type === 'image') {
                    const img = item as ImageContent;
                    return `[Image: ${img.mimeType}]`;
                } else if (item.type === 'resource') {
                    const res = item as EmbeddedResource;
                    return `[Resource: ${res.resource.uri}]`;
                }
                return '[Unknown content type]';
            })
            .join('\n');
    }

    /**
     * Get conversation history
     */
    public getMessages(): AgentMessage[] {
        return [...this.messages];
    }

    /**
     * Clear conversation history (keeping system instruction)
     */
    public clearHistory(): void {
        this.messages = this.messages.filter(msg => msg.role === 'system');
    }

    /**
     * Request human input
     */
    public async requestHumanInput(request: HumanInputRequest): Promise<HumanInputResponse> {
        if (!this.context.human_input_callback) {
            throw new ValidationError('No human input callback configured');
        }

        this.logger.debug(`Agent '${this.name}' requesting human input`);
        return await this.context.human_input_callback(request);
    }

    /**
     * Get a prompt by name
     */
    public async getPrompt(name: string, args?: any): Promise<string> {
        if (!this.aggregator) {
            throw new ValidationError('No MCP servers configured');
        }

        const result = await this.aggregator.getPrompt(name, args);
        
        // Extract text content from messages
        const messages = result.messages || [];
        return messages
            .map(msg => {
                if (msg.content && typeof msg.content === 'string') {
                    return msg.content;
                } else if (msg.content && Array.isArray(msg.content)) {
                    return msg.content
                        .filter(item => item.type === 'text')
                        .map(item => (item as TextContent).text)
                        .join('\n');
                }
                return '';
            })
            .join('\n\n');
    }

    /**
     * Read a resource by URI
     */
    public async readResource(uri: string): Promise<string> {
        if (!this.aggregator) {
            throw new ValidationError('No MCP servers configured');
        }

        const result = await this.aggregator.readResource(uri);
        
        // Extract text content
        return result.contents
            .filter(item => 'type' in item && item.type === 'text')
            .map(item => 'text' in item ? (item as any).text : '')
            .join('\n');
    }

    /**
     * Ensure agent is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    /**
     * Get agent configuration
     */
    public getConfig(): AgentConfig {
        return {
            name: this.name,
            instruction: this.instruction,
            server_names: this.serverNames,
            connection_persistence: this.connectionPersistence
        };
    }

    /**
     * Get agent statistics
     */
    public getStats(): {
        id: string;
        name: string;
        messageCount: number;
        serverCount: number;
        initialized: boolean;
    } {
        return {
            id: this.id,
            name: this.name,
            messageCount: this.messages.length,
            serverCount: this.serverNames.length,
            initialized: this.initialized
        };
    }
}