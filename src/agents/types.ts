/**
 * Type definitions for the Agent system
 */

import { Tool, Prompt, Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration for an Agent
 */
export interface AgentConfig {
    name: string;
    instruction?: string;
    server_names?: string[];
    model?: string;
    temperature?: number;
    max_tokens?: number;
    connection_persistence?: boolean;
}

/**
 * Message types for agent communication
 */
export interface AgentMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

/**
 * Tool call representation
 */
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

/**
 * Agent response
 */
export interface AgentResponse {
    content: string;
    tool_calls?: ToolCall[];
    finish_reason?: 'stop' | 'tool_calls' | 'length' | 'content_filter';
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Human input request
 */
export interface HumanInputRequest {
    type: 'human_input';
    prompt: string;
    placeholder?: string;
    default?: string;
    multiline?: boolean;
}

/**
 * Human input response
 */
export interface HumanInputResponse {
    type: 'human_input_response';
    content: string;
}

/**
 * Augmented LLM interface (simplified for initial port)
 */
export interface AugmentedLLM {
    generate(
        messages: AgentMessage[],
        tools?: Tool[],
        options?: {
            temperature?: number;
            max_tokens?: number;
            stop?: string[];
        }
    ): Promise<AgentResponse>;
    
    model: string;
}