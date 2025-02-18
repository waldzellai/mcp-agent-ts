"use strict";
// Logging module exports
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.warn = exports.info = exports.debug = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    static instance;
    logs = [];
    currentLogLevel = LogLevel.INFO;
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLogLevel(level) {
        this.currentLogLevel = level;
    }
    log(level, message, context) {
        // Only log if the current log level allows it
        const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        if (logLevels.indexOf(level) >= logLevels.indexOf(this.currentLogLevel)) {
            const entry = {
                timestamp: Date.now(),
                level,
                message,
                context
            };
            this.logs.push(entry);
            this.outputLog(entry);
        }
    }
    outputLog(entry) {
        const formattedTimestamp = new Date(entry.timestamp).toISOString();
        const contextString = entry.context
            ? ` | Context: ${JSON.stringify(entry.context)}`
            : '';
        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(`[${formattedTimestamp}] [DEBUG] ${entry.message}${contextString}`);
                break;
            case LogLevel.INFO:
                console.info(`[${formattedTimestamp}] [INFO] ${entry.message}${contextString}`);
                break;
            case LogLevel.WARN:
                console.warn(`[${formattedTimestamp}] [WARN] ${entry.message}${contextString}`);
                break;
            case LogLevel.ERROR:
                console.error(`[${formattedTimestamp}] [ERROR] ${entry.message}${contextString}`);
                break;
        }
    }
    getLogs(level) {
        return level
            ? this.logs.filter(log => log.level === level)
            : this.logs;
    }
    clearLogs() {
        this.logs = [];
    }
    exportLogs(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.logs, null, 2);
        }
        return this.logs.map(log => `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}` +
            (log.context ? ` | ${JSON.stringify(log.context)}` : '')).join('\n');
    }
}
exports.Logger = Logger;
// Convenience functions for logging
const debug = (message, context) => Logger.getInstance().log(LogLevel.DEBUG, message, context);
exports.debug = debug;
const info = (message, context) => Logger.getInstance().log(LogLevel.INFO, message, context);
exports.info = info;
const warn = (message, context) => Logger.getInstance().log(LogLevel.WARN, message, context);
exports.warn = warn;
const error = (message, context) => Logger.getInstance().log(LogLevel.ERROR, message, context);
exports.error = error;
