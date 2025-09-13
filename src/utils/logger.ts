/**
 * Centralized logging utility for the application.
 * Provides consistent logging across the application with different log levels.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    if (!this.isDevelopment && level === "debug") {
      return; // Skip debug logs in production
    }

    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };

    const prefix = context ? `[${context}]` : "";
    const logMessage = `${prefix} ${message}`;

    switch (level) {
      case "debug":
        console.debug(logMessage, data);
        break;
      case "info":
        console.info(logMessage, data);
        break;
      case "warn":
        console.warn(logMessage, data);
        break;
      case "error":
        console.error(logMessage, data);
        break;
    }

    // In production, you could send logs to a service here
    // this.sendToLogService(logEntry);
  }

  debug(message: string, data?: any, context?: string) {
    this.log("debug", message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log("info", message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log("warn", message, data, context);
  }

  error(message: string, data?: any, context?: string) {
    this.log("error", message, data, context);
  }

  // Specialized logging methods for common use cases
  dataLoad(context: string, data: any) {
    this.debug(`Loading data for ${context}`, data, "DATA_LOAD");
  }

  dataSave(context: string, data: any) {
    this.debug(`Saving data for ${context}`, data, "DATA_SAVE");
  }

  userAction(action: string, details?: any) {
    this.info(`User action: ${action}`, details, "USER_ACTION");
  }

  apiCall(endpoint: string, method: string, success: boolean, error?: any) {
    if (success) {
      this.debug(`API call successful: ${method} ${endpoint}`, { method, endpoint }, "API");
    } else {
      this.error(`API call failed: ${method} ${endpoint}`, { method, endpoint, error }, "API");
    }
  }
}

export const logger = new Logger();
