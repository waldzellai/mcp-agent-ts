"use strict";
/**
 * Base interface and mixin for context-aware components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextDependentBase = void 0;
exports.isContextDependent = isContextDependent;
exports.withContext = withContext;
/**
 * Type guard to check if an object is context-dependent
 */
function isContextDependent(obj) {
    return obj && typeof obj === 'object' && 'context' in obj;
}
/**
 * Mixin class for adding context dependency to a base class
 * Usage: class MyClass extends withContext(BaseClass) { ... }
 */
function withContext(Base) {
    return class WithContext extends Base {
        context;
        constructor(...args) {
            super(...args);
            // Context will be injected after construction
            this.context = null; // Will be set by the framework
        }
        requireContext() {
            if (!this.context) {
                throw new Error('Context not initialized. Ensure this component is properly registered with the app.');
            }
            return this.context;
        }
    };
}
/**
 * Abstract base class for context-dependent components
 */
class ContextDependentBase {
    context;
    constructor(context) {
        this.context = context;
    }
    get logger() {
        return this.context.logger;
    }
    get settings() {
        return this.context.settings;
    }
    get executor() {
        return this.context.executor;
    }
}
exports.ContextDependentBase = ContextDependentBase;
