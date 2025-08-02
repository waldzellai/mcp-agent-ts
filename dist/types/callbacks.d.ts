/**
 * Callback type definitions
 */
import { HumanInputRequest, HumanInputResponse } from '../agents/types';
/**
 * Callback for handling human input requests
 */
export type HumanInputCallback = (request: HumanInputRequest) => Promise<HumanInputResponse>;
/**
 * Elicitation request
 */
export interface ElicitationRequest {
    type: 'elicitation';
    prompt: string;
    options?: string[];
    multiselect?: boolean;
}
/**
 * Elicitation response
 */
export interface ElicitationResponse {
    type: 'elicitation_response';
    selection: string | string[];
}
/**
 * Callback for handling elicitation requests
 */
export type ElicitationCallback = (request: ElicitationRequest) => Promise<ElicitationResponse>;
/**
 * Signal wait callback
 */
export type SignalWaitCallback = (signal: string) => Promise<any>;
