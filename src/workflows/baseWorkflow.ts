// Base Workflow Implementation

import { McpContext, ContextManager } from '../context/index';
import { Logger, LogLevel } from '../logging/index';
import { BaseExecutor, Task } from '../executor/index';

export interface WorkflowStep {
  id: string;
  name: string;
  execute: (context: McpContext) => Promise<unknown>;
}

export abstract class BaseWorkflow {
  protected id: string;
  protected name: string;
  protected steps: WorkflowStep[];
  protected executor: BaseExecutor;
  protected logger: Logger;
  protected contextManager: ContextManager;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.steps = [];
    this.executor = new BaseExecutor();
    this.logger = Logger.getInstance();
    this.contextManager = ContextManager.getInstance();
  }

  public addStep(step: WorkflowStep): void {
    this.steps.push(step);
  }

  public async execute(): Promise<unknown[]> {
    const workflowContext = this.contextManager.createContext({
      workflowId: this.id,
      workflowName: this.name
    });

    this.logger.log(LogLevel.INFO, `Starting workflow: ${this.name}`, { workflowId: this.id });

    const results: unknown[] = [];

    for (const step of this.steps) {
      try {
        this.logger.log(LogLevel.DEBUG, `Executing workflow step: ${step.name}`, { 
          stepId: step.id, 
          workflowId: this.id 
        });

        const task: Task = {
          id: step.id,
          name: step.name,
          execute: () => step.execute(workflowContext)
        };

        const result = await this.executor.enqueueTask(task);
        results.push(result);
      } catch (error) {
        this.logger.log(LogLevel.ERROR, `Workflow step failed`, { 
          stepId: step.id, 
          workflowId: this.id, 
          error 
        });
        throw error;
      }
    }

    this.logger.log(LogLevel.INFO, `Workflow completed: ${this.name}`, { 
      workflowId: this.id, 
      stepCount: this.steps.length 
    });

    return results;
  }

  public getWorkflowMetadata(): { id: string; name: string; stepCount: number } {
    return {
      id: this.id,
      name: this.name,
      stepCount: this.steps.length
    };
  }
}

// Example Workflow Implementation
export class SimpleDataProcessingWorkflow extends BaseWorkflow {
  constructor() {
    super('data-processing-workflow', 'Simple Data Processing');

    this.addStep({
      id: 'step-1',
      name: 'Data Extraction',
      execute: async (context) => {
        // Simulate data extraction
        await new Promise(resolve => setTimeout(resolve, 500));
        return { data: ['item1', 'item2', 'item3'] };
      }
    });

    this.addStep({
      id: 'step-2',
      name: 'Data Transformation',
      execute: async (context) => {
        // Simulate data transformation
        await new Promise(resolve => setTimeout(resolve, 300));
        return { transformedData: ['ITEM1', 'ITEM2', 'ITEM3'] };
      }
    });

    this.addStep({
      id: 'step-3',
      name: 'Data Loading',
      execute: async (context) => {
        // Simulate data loading
        await new Promise(resolve => setTimeout(resolve, 200));
        return { status: 'completed' };
      }
    });
  }
}
