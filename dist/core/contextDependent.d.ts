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
export declare function isContextDependent(obj: any): obj is ContextDependent;
/**
 * Mixin class for adding context dependency to a base class
 * Usage: class MyClass extends withContext(BaseClass) { ... }
 */
export declare function withContext<TBase extends new (...args: any[]) => {}>(Base: TBase): {
    new (...args: any[]): {
        context: Context;
        requireContext(): Context;
    };
} & TBase;
/**
 * Abstract base class for context-dependent components
 */
export declare abstract class ContextDependentBase implements ContextDependent {
    context: Context;
    constructor(context: Context);
    protected get logger(): import("./context").Logger;
    protected get settings(): import("./context").Settings;
    protected get executor(): import("./context").Executor | undefined;
}
