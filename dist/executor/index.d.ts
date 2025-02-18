export interface Task {
    id: string;
    name: string;
    execute: () => Promise<unknown>;
}
export interface ExecutorOptions {
    maxConcurrentTasks?: number;
    timeout?: number;
}
export declare class BaseExecutor {
    private contextManager;
    private options;
    private runningTasks;
    private taskQueue;
    constructor(options?: ExecutorOptions);
    enqueueTask(task: Task): Promise<unknown>;
    private executeTask;
    private processNextTask;
    waitForAllTasks(): Promise<void>;
    cancelTask(taskId: string): boolean;
}
