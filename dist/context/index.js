"use strict";
// Context module exports
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
class ContextManager {
    static instance;
    currentContext = null;
    constructor() { }
    static getInstance() {
        if (!ContextManager.instance) {
            ContextManager.instance = new ContextManager();
        }
        return ContextManager.instance;
    }
    createContext(metadata = {}) {
        this.currentContext = {
            traceId: this.generateTraceId(),
            timestamp: Date.now(),
            metadata
        };
        return this.currentContext;
    }
    getCurrentContext() {
        return this.currentContext;
    }
    generateTraceId() {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}
exports.ContextManager = ContextManager;
