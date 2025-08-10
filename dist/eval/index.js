"use strict";
/**
 * Simple benchmarking scaffolding to compare workflows or model outputs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.benchmarkWorkflows = benchmarkWorkflows;
exports.runDefaultEvaluation = runDefaultEvaluation;
/**
 * Execute a set of workflows against evaluation cases and capture timing/accuracy metrics.
 */
async function benchmarkWorkflows(workflows, cases) {
    const out = [];
    for (const wf of workflows) {
        const wfResults = [];
        for (const c of cases) {
            const start = Date.now();
            const output = await wf.run(c.input);
            const durationMs = Date.now() - start;
            const success = c.expected === undefined
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
async function runDefaultEvaluation() {
    const echo = {
        name: 'echo-workflow',
        run: async (input) => input,
    };
    const cases = [
        { id: 'case-1', input: { message: 'hello' }, expected: { message: 'hello' } },
    ];
    return benchmarkWorkflows([echo], cases);
}
