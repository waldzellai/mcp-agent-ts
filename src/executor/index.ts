// Executor module exports

export interface Task {
  id: string;
  name: string;
  execute: () => Promise<unknown>;
}

export interface ExecutorOptions {
  maxConcurrentTasks?: number;
  timeout?: number;
}

export class BaseExecutor {
  private contextManager: ContextManager;
  private options: ExecutorOptions;
  private runningTasks: Map<string, Promise<unknown>>;
  private taskQueue: Task[];

  constructor(options: ExecutorOptions = {}) {
    this.contextManager = ContextManager.getInstance();
    this.options = {
      maxConcurrentTasks: options.maxConcurrentTasks || 5,
      timeout: options.timeout || 30000 // 30 seconds default
    };
    this.runningTasks = new Map();
    this.taskQueue = [];
  }

  public async enqueueTask(task: Task): Promise<unknown> {
    const context = this.contextManager.createContext({
      taskId: task.id,
      taskName: task.name
    });

    if (this.runningTasks.size >= (this.options.maxConcurrentTasks || 5)) {
      return new Promise((resolve, reject) => {
        this.taskQueue.push({
          ...task,
          execute: async () => {
            try {
              const result = await task.execute();
              resolve(result);
              return result;
            } catch (error) {
              reject(error);
              throw error;
            }
          }
        });
      });
    }

    return this.executeTask(task, context);
  }

  private async executeTask(task: Task, context: McpContext): Promise<unknown> {
    const taskPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.runningTasks.delete(task.id);
        reject(new Error(`Task ${task.id} timed out after ${this.options.timeout}ms`));
      }, this.options.timeout);

      task.execute()
        .then((result) => {
          clearTimeout(timeoutId);
          this.runningTasks.delete(task.id);
          resolve(result);
          this.processNextTask();
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          this.runningTasks.delete(task.id);
          reject(error);
          this.processNextTask();
        });
    });

    this.runningTasks.set(task.id, taskPromise);
    return taskPromise;
  }

  private processNextTask(): void {
    if (this.taskQueue.length > 0 && this.runningTasks.size < (this.options.maxConcurrentTasks || 5)) {
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        const context = this.contextManager.createContext({
          taskId: nextTask.id,
          taskName: nextTask.name
        });
        this.executeTask(nextTask, context);
      }
    }
  }

  public async waitForAllTasks(): Promise<void> {
    await Promise.all(Array.from(this.runningTasks.values()));
  }

  public cancelTask(taskId: string): boolean {
    const task = this.runningTasks.get(taskId);
    if (task) {
      // Implement task cancellation logic
      this.runningTasks.delete(taskId);
      return true;
    }
    return false;
  }
}

// Import ContextManager to avoid circular dependency
import { ContextManager } from '../context/index';
import { McpContext } from '../context/index';
