import { McpContext, ContextManager } from '../context/index';
import { Logger } from '../logging/index';
import { BaseExecutor } from '../executor/index';
export interface WorkflowStep {
    id: string;
    name: string;
    execute: (context: McpContext) => Promise<unknown>;
}
export declare abstract class BaseWorkflow {
    protected id: string;
    protected name: string;
    protected steps: WorkflowStep[];
    protected executor: BaseExecutor;
    protected logger: Logger;
    protected contextManager: ContextManager;
    constructor(id: string, name: string);
    addStep(step: WorkflowStep): void;
    execute(): Promise<unknown[]>;
    getWorkflowMetadata(): {
        id: string;
        name: string;
        stepCount: number;
    };
}
export declare class SimpleDataProcessingWorkflow extends BaseWorkflow {
    constructor();
}
