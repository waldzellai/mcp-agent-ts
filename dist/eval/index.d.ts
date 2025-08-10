/**
 * Simple benchmarking scaffolding to compare workflows or model outputs.
 */
export interface EvaluationCase {
    id: string;
    input: unknown;
    expected?: unknown;
}
export interface Workflow {
    name: string;
    run: (input: unknown) => Promise<unknown> | unknown;
}
export interface CaseResult {
    caseId: string;
    output: unknown;
    expected?: unknown;
    durationMs: number;
    success: boolean;
}
export interface WorkflowResult {
    workflow: string;
    results: CaseResult[];
}
/**
 * Execute a set of workflows against evaluation cases and capture timing/accuracy metrics.
 */
export declare function benchmarkWorkflows(workflows: Workflow[], cases: EvaluationCase[]): Promise<WorkflowResult[]>;
/**
 * Run a trivial default evaluation used by CLI for demonstration.
 */
export declare function runDefaultEvaluation(): Promise<WorkflowResult[]>;
