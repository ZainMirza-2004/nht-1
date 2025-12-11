/**
 * Structured logging utility for Supabase Edge Functions
 */

export interface LogContext {
  functionName?: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Structured logger
 */
export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...(data && { data }),
    };

    // In production, you might want to send this to a logging service
    // For now, we'll use console which Supabase captures
    const logMethod =
      level === LogLevel.ERROR
        ? console.error
        : level === LogLevel.WARN
        ? console.warn
        : level === LogLevel.DEBUG
        ? console.debug
        : console.log;

    logMethod(JSON.stringify(logEntry));
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context: LogContext = {}): Logger {
  return new Logger(context);
}

/**
 * Generate a request ID for tracking
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

