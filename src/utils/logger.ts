import fs from 'fs';
import path from 'path';
import { config } from '@/config';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

class Logger {
  private logLevel: LogLevel;
  private logFile?: string;

  constructor() {
    this.logLevel = this.getLogLevelFromString(config.logLevel);
    this.logFile = config.logFile;
    this.ensureLogDirectory();
  }

  private getLogLevelFromString(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private ensureLogDirectory(): void {
    if (this.logFile) {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private formatLogEntry(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(meta && { meta }),
    };
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    // Console output
    console.log(logString);

    // File output
    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, logString + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatLogEntry('error', message, meta);
      this.writeLog(entry);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatLogEntry('warn', message, meta);
      this.writeLog(entry);
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatLogEntry('info', message, meta);
      this.writeLog(entry);
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatLogEntry('debug', message, meta);
      this.writeLog(entry);
    }
  }

  // Request logging
  logRequest(req: any, res: any, responseTime?: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      ...(responseTime && { responseTime: `${responseTime}ms` }),
    };

    if (res.statusCode >= 400) {
      this.warn(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, logData);
    } else {
      this.info(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, success: boolean, duration?: number): void {
    const logData = {
      operation,
      table,
      success,
      ...(duration && { duration: `${duration}ms` }),
    };

    if (success) {
      this.debug(`Database ${operation} on ${table}`, logData);
    } else {
      this.error(`Database ${operation} failed on ${table}`, logData);
    }
  }

  // Authentication logging
  logAuth(event: string, userId?: string, email?: string, success: boolean = true): void {
    const logData = {
      event,
      success,
      ...(userId && { userId }),
      ...(email && { email }),
    };

    if (success) {
      this.info(`Auth: ${event}`, logData);
    } else {
      this.warn(`Auth failed: ${event}`, logData);
    }
  }

  // Payment logging
  logPayment(event: string, amount: number, currency: string, paymentId?: string, success: boolean = true): void {
    const logData = {
      event,
      amount,
      currency,
      success,
      ...(paymentId && { paymentId }),
    };

    if (success) {
      this.info(`Payment: ${event}`, logData);
    } else {
      this.error(`Payment failed: ${event}`, logData);
    }
  }

  // Email logging
  logEmail(to: string, subject: string, success: boolean, error?: string): void {
    const logData = {
      to,
      subject,
      success,
      ...(error && { error }),
    };

    if (success) {
      this.info('Email sent successfully', logData);
    } else {
      this.error('Email sending failed', logData);
    }
  }

  // Security logging
  logSecurity(event: string, ip: string, userAgent?: string, userId?: string): void {
    const logData = {
      event,
      ip,
      ...(userAgent && { userAgent }),
      ...(userId && { userId }),
    };

    this.warn(`Security: ${event}`, logData);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;