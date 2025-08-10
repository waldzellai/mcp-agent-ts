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
export async function benchmarkWorkflows(
  workflows: Workflow[],
  cases: EvaluationCase[]
): Promise<WorkflowResult[]> {
  const out: WorkflowResult[] = [];
  for (const wf of workflows) {
    const wfResults: CaseResult[] = [];
    for (const c of cases) {
      const start = Date.now();
      const output = await wf.run(c.input);
      const durationMs = Date.now() - start;
      const success =
        c.expected === undefined
          ? true
          : JSON.stringify(output) === JSON.stringify(c.expected);
      wfResults.push({
        caseId: c.id,
        output,
        expected: c.expected,
        durationMs,
        success,
      });
    }
    out.push({ workflow: wf.name, results: wfResults });
  }
  return out;
}

/**
 * Run a trivial default evaluation used by CLI for demonstration.
 */
export async function runDefaultEvaluation(): Promise<WorkflowResult[]> {
  const echo: Workflow = {
    name: 'echo-workflow',
    run: async (input: unknown) => input,
  };

  const cases: EvaluationCase[] = [
    { id: 'case-1', input: { message: 'hello' }, expected: { message: 'hello' } },
  ];

  return benchmarkWorkflows([echo], cases);
}
