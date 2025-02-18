export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
}
export declare class Logger {
    private static instance;
    private logs;
    private currentLogLevel;
    private constructor();
    static getInstance(): Logger;
    setLogLevel(level: LogLevel): void;
    log(level: LogLevel, message: string, context?: Record<string, unknown>): void;
    private outputLog;
    getLogs(level?: LogLevel): LogEntry[];
    clearLogs(): void;
    exportLogs(format?: 'json' | 'text'): string;
}
export declare const debug: (message: string, context?: Record<string, unknown>) => void;
export declare const info: (message: string, context?: Record<string, unknown>) => void;
export declare const warn: (message: string, context?: Record<string, unknown>) => void;
export declare const error: (message: string, context?: Record<string, unknown>) => void;
