// Logging module exports

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private currentLogLevel: LogLevel = LogLevel.INFO;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  public log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Only log if the current log level allows it
    const logLevels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    if (logLevels.indexOf(level) >= logLevels.indexOf(this.currentLogLevel)) {
      const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        message,
        context
      };

      this.logs.push(entry);
      this.outputLog(entry);
    }
  }

  private outputLog(entry: LogEntry): void {
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

  public getLogs(level?: LogLevel): LogEntry[] {
    return level 
      ? this.logs.filter(log => log.level === level)
      : this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    return this.logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}` +
      (log.context ? ` | ${JSON.stringify(log.context)}` : '')
    ).join('\n');
  }
}

// Convenience functions for logging
export const debug = (message: string, context?: Record<string, unknown>): void => 
  Logger.getInstance().log(LogLevel.DEBUG, message, context);

export const info = (message: string, context?: Record<string, unknown>): void => 
  Logger.getInstance().log(LogLevel.INFO, message, context);

export const warn = (message: string, context?: Record<string, unknown>): void => 
  Logger.getInstance().log(LogLevel.WARN, message, context);

export const error = (message: string, context?: Record<string, unknown>): void => 
  Logger.getInstance().log(LogLevel.ERROR, message, context);
