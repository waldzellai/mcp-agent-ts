/**
 * Common utility functions used throughout the framework
 */
/**
 * Unwrap a function to get the underlying function object
 * Handles partial functions and bound methods
 */
export declare function unwrap<T extends Function>(fn: T): Function;
/**
 * Extract extra properties from an object, excluding specified keys
 */
export declare function extractExtras<T extends Record<string, any>>(obj: T, exclude: string[]): Record<string, any>;
/**
 * Convert an object to a JSON string with proper handling
 */
export declare function toJsonString(obj: any): string;
/**
 * Ensure an object is JSON-serializable
 */
export declare function ensureSerializable<T>(data: T): T;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Create a debounced version of a function
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Create a throttled version of a function
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Retry a function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
}): Promise<T>;
