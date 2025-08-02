"use strict";
/**
 * Common utility functions used throughout the framework
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrap = unwrap;
exports.extractExtras = extractExtras;
exports.toJsonString = toJsonString;
exports.ensureSerializable = ensureSerializable;
exports.deepClone = deepClone;
exports.debounce = debounce;
exports.throttle = throttle;
exports.retry = retry;
/**
 * Unwrap a function to get the underlying function object
 * Handles partial functions and bound methods
 */
function unwrap(fn) {
    // Check if it's a bound function
    if ('__wrapped__' in fn) {
        return unwrap(fn.__wrapped__);
    }
    // Check if it's a partial application (in JS, this might be a closure)
    if ('__original__' in fn) {
        return unwrap(fn.__original__);
    }
    return fn;
}
/**
 * Extract extra properties from an object, excluding specified keys
 */
function extractExtras(obj, exclude) {
    const excludeSet = new Set(exclude);
    const extras = {};
    for (const [key, value] of Object.entries(obj)) {
        if (!excludeSet.has(key)) {
            extras[key] = value;
        }
    }
    return extras;
}
/**
 * Convert an object to a JSON string with proper handling
 */
function toJsonString(obj) {
    try {
        return JSON.stringify(obj, null, 2);
    }
    catch (error) {
        // Handle circular references or other serialization issues
        return JSON.stringify(obj, getCircularReplacer());
    }
}
/**
 * Create a replacer function that handles circular references
 */
function getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    };
}
/**
 * Ensure an object is JSON-serializable
 */
function ensureSerializable(data) {
    try {
        // Try to serialize to check
        JSON.stringify(data);
        return data;
    }
    catch (error) {
        // If it fails, parse through JSON to remove non-serializable parts
        const json = JSON.stringify(data, (key, value) => {
            if (value instanceof Error) {
                return {
                    name: value.name,
                    message: value.message,
                    stack: value.stack
                };
            }
            if (typeof value === 'function') {
                return value.toString();
            }
            if (typeof value === 'symbol') {
                return value.toString();
            }
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        });
        return JSON.parse(json);
    }
}
/**
 * Deep clone an object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    if (obj instanceof Set) {
        return new Set(Array.from(obj).map(item => deepClone(item)));
    }
    if (obj instanceof Map) {
        const cloned = new Map();
        obj.forEach((value, key) => {
            cloned.set(deepClone(key), deepClone(value));
        });
        return cloned;
    }
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}
/**
 * Create a debounced version of a function
 */
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}
/**
 * Create a throttled version of a function
 */
function throttle(fn, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
/**
 * Retry a function with exponential backoff
 */
async function retry(fn, options = {}) {
    const { maxAttempts = 3, initialDelay = 1000, maxDelay = 10000, factor = 2 } = options;
    let lastError;
    let delay = initialDelay;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * factor, maxDelay);
        }
    }
    throw lastError;
}
