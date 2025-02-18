"use strict";
// Executor module exports
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseExecutor = void 0;
class BaseExecutor {
    contextManager;
    options;
    runningTasks;
    taskQueue;
    constructor(options = {}) {
        this.contextManager = index_1.ContextManager.getInstance();
        this.options = {
            maxConcurrentTasks: options.maxConcurrentTasks || 5,
            timeout: options.timeout || 30000 // 30 seconds default
        };
        this.runningTasks = new Map();
        this.taskQueue = [];
    }
    async enqueueTask(task) {
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
                        }
                        catch (error) {
                            reject(error);
                            throw error;
                        }
                    }
                });
            });
        }
        return this.executeTask(task, context);
    }
    async executeTask(task, context) {
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
    processNextTask() {
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
    async waitForAllTasks() {
        await Promise.all(Array.from(this.runningTasks.values()));
    }
    cancelTask(taskId) {
        const task = this.runningTasks.get(taskId);
        if (task) {
            // Implement task cancellation logic
            this.runningTasks.delete(taskId);
            return true;
        }
        return false;
    }
}
exports.BaseExecutor = BaseExecutor;
// Import ContextManager to avoid circular dependency
const index_1 = require("../context/index");
