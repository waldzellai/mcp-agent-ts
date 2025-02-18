"use strict";
// Base Workflow Implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleDataProcessingWorkflow = exports.BaseWorkflow = void 0;
const index_1 = require("../context/index");
const index_2 = require("../logging/index");
const index_3 = require("../executor/index");
class BaseWorkflow {
    id;
    name;
    steps;
    executor;
    logger;
    contextManager;
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.steps = [];
        this.executor = new index_3.BaseExecutor();
        this.logger = index_2.Logger.getInstance();
        this.contextManager = index_1.ContextManager.getInstance();
    }
    addStep(step) {
        this.steps.push(step);
    }
    async execute() {
        const workflowContext = this.contextManager.createContext({
            workflowId: this.id,
            workflowName: this.name
        });
        this.logger.log(index_2.LogLevel.INFO, `Starting workflow: ${this.name}`, { workflowId: this.id });
        const results = [];
        for (const step of this.steps) {
            try {
                this.logger.log(index_2.LogLevel.DEBUG, `Executing workflow step: ${step.name}`, {
                    stepId: step.id,
                    workflowId: this.id
                });
                const task = {
                    id: step.id,
                    name: step.name,
                    execute: () => step.execute(workflowContext)
                };
                const result = await this.executor.enqueueTask(task);
                results.push(result);
            }
            catch (error) {
                this.logger.log(index_2.LogLevel.ERROR, `Workflow step failed`, {
                    stepId: step.id,
                    workflowId: this.id,
                    error
                });
                throw error;
            }
        }
        this.logger.log(index_2.LogLevel.INFO, `Workflow completed: ${this.name}`, {
            workflowId: this.id,
            stepCount: this.steps.length
        });
        return results;
    }
    getWorkflowMetadata() {
        return {
            id: this.id,
            name: this.name,
            stepCount: this.steps.length
        };
    }
}
exports.BaseWorkflow = BaseWorkflow;
// Example Workflow Implementation
class SimpleDataProcessingWorkflow extends BaseWorkflow {
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
exports.SimpleDataProcessingWorkflow = SimpleDataProcessingWorkflow;
