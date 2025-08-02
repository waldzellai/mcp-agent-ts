/**
 * Base interface and mixin for context-aware components
 */

import { Context } from './context';

/**
 * Interface for components that depend on the global context
 */
export interface ContextDependent {
    context: Context;
}

/**
 * Type guard to check if an object is context-dependent
 */
export function isContextDependent(obj: any): obj is ContextDependent {
    return obj && typeof obj === 'object' && 'context' in obj;
}

/**
 * Mixin class for adding context dependency to a base class
 * Usage: class MyClass extends withContext(BaseClass) { ... }
 */
export function withContext<TBase extends new (...args: any[]) => {}>(Base: TBase) {
    return class WithContext extends Base implements ContextDependent {
        public context: Context;

        constructor(...args: any[]) {
            super(...args);
            // Context will be injected after construction
            this.context = null as any; // Will be set by the framework
        }

        public requireContext(): Context {
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
export abstract class ContextDependentBase implements ContextDependent {
    constructor(public context: Context) {}

    protected get logger() {
        return this.context.logger;
    }

    protected get settings() {
        return this.context.settings;
    }

    protected get executor() {
        return this.context.executor;
    }
}