/**
 * Enhanced Logger for PRISM Contacts
 * 
 * این لاگر پیشرفته برای PRISM Contacts طراحی شده و ویژگی‌های زیر را دارد:
 * - لاگ‌گیری با سطوح مختلف (debug, info, warn, error)
 * - پشتیبانی از لاگ‌گیری سمت سرور و کلاینت
 * - قابلیت فیلتر کردن بر اساس کامپوننت و سطح لاگ
 * - قابلیت ارسال لاگ‌ها به سرویس‌های خارجی
 * - قابلیت ذخیره‌سازی لاگ‌ها در localStorage برای دیباگ
 * - قابلیت فرمت‌دهی خروجی
 * - قابلیت گروه‌بندی لاگ‌ها
 * - قابلیت اندازه‌گیری عملکرد
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  remoteEndpoint?: string;
  maxLocalStorageEntries: number;
  filter?: {
    components?: string[];
    levels?: LogLevel[];
  };
  format?: 'json' | 'pretty';
  enableGroups: boolean;
  enablePerformance: boolean;
}

export interface LoggerMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByComponent: Record<string, number>;
  errors: number;
  warnings: number;
  lastLogTime: string;
  averageLogSize: number;
}

class EnhancedLogger {
  private static instance: EnhancedLogger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private metrics: LoggerMetrics;
  private isInitialized = false;

  private defaultConfig: LoggerConfig = {
    level: 'info',
    enableConsole: true,
    enableFile: false,
    enableRemote: false,
    enableLocalStorage: true,
    maxLocalStorageEntries: 1000,
    enableGroups: true,
    enablePerformance: true
  };

  private constructor(config?: Partial<LoggerConfig>) {
    this.config = this.mergeConfig(this.defaultConfig, config);
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(config?: Partial<LoggerConfig>): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger(config);
    }
    return EnhancedLogger.instance;
  }

  private mergeConfig(defaultConfig: LoggerConfig, userConfig?: Partial<LoggerConfig>): LoggerConfig {
    if (!userConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...userConfig,
      filter: { ...defaultConfig.filter, ...userConfig.filter }
    };
  }

  private initializeMetrics(): LoggerMetrics {
    return {
      totalLogs: 0,
      logsByLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      logsByComponent: {},
      errors: 0,
      warnings: 0,
      lastLogTime: new Date().toISOString(),
      averageLogSize: 0
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.loadLogsFromStorage();
      this.isInitialized = true;
      
      this.info('Logger', 'Logger initialized successfully', {
        config: this.config,
        initialMetrics: this.metrics
      });
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      throw error;
    }
  }

  private shouldLog(level: LogLevel, component?: string): boolean {
    // Check level
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    if (levelPriority[level] < levelPriority[this.config.level]) {
      return false;
    }

    // Check component filter
    if (this.config.filter?.components && component) {
      if (!this.config.filter.components.includes(component)) {
        return false;
      }
    }

    // Check level filter
    if (this.config.filter?.levels && !this.config.filter.levels.includes(level)) {
      return false;
    }

    return true;
  }

  private createLogEntry(
    level: LogLevel,
    component: string,
    message: string,
    data?: any,
    error?: Error,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      error,
      metadata: {
        ...metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        environment: process.env.NODE_ENV || 'unknown'
      }
    };
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    const { timestamp, level, component, message, data, error } = entry;
    const formattedData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    const formattedError = error ? ` | Error: ${error.message}` : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] [${component}]: ${message}${formattedData}${formattedError}`;
  }

  private updateMetrics(entry: LogEntry): void {
    this.metrics.totalLogs++;
    this.metrics.logsByLevel[entry.level]++;
    this.metrics.lastLogTime = entry.timestamp;

    if (entry.level === 'error') {
      this.metrics.errors++;
    } else if (entry.level === 'warn') {
      this.metrics.warnings++;
    }

    // Update component metrics
    if (!this.metrics.logsByComponent[entry.component]) {
      this.metrics.logsByComponent[entry.component] = 0;
    }
    this.metrics.logsByComponent[entry.component]++;

    // Calculate average log size
    const logSize = JSON.stringify(entry).length;
    this.metrics.averageLogSize = 
      (this.metrics.averageLogSize * (this.metrics.totalLogs - 1) + logSize) / this.metrics.totalLogs;
  }

  private async logEntry(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level, entry.component)) {
      return;
    }

    // Update metrics
    this.updateMetrics(entry);

    // Store log
    this.logs.push(entry);

    // Console logging
    if (this.config.enableConsole) {
      const formatted = this.formatLogEntry(entry);
      
      switch (entry.level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
      }
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      await this.saveToLocalStorage(entry);
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      await this.sendToRemote(entry);
    }
  }

  private async saveToLocalStorage(entry: LogEntry): Promise<void> {
    try {
      const storedLogs = localStorage.getItem('prism-logs');
      let logs: LogEntry[] = storedLogs ? JSON.parse(storedLogs) : [];

      logs.push(entry);

      // Keep only the most recent logs
      if (logs.length > this.config.maxLocalStorageEntries) {
        logs = logs.slice(-this.config.maxLocalStorageEntries);
      }

      localStorage.setItem('prism-logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log to localStorage:', error);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      // This would typically send to a logging service
      // For now, we'll just log that we would send it
      console.debug('Would send log to remote:', entry);
    } catch (error) {
      console.error('Failed to send log to remote:', error);
    }
  }

  private loadLogsFromStorage(): void {
    try {
      const storedLogs = localStorage.getItem('prism-logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
        
        // Recalculate metrics from loaded logs
        this.metrics = this.initializeMetrics();
        this.logs.forEach(entry => this.updateMetrics(entry));
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
    }
  }

  // Public logging methods
  public debug(component: string, message: string, data?: any, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', component, message, data, undefined, metadata);
    this.logEntry(entry);
  }

  public info(component: string, message: string, data?: any, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('info', component, message, data, undefined, metadata);
    this.logEntry(entry);
  }

  public warn(component: string, message: string, data?: any, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', component, message, data, undefined, metadata);
    this.logEntry(entry);
  }

  public error(component: string, message: string, error?: Error, data?: any, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry('error', component, message, data, error, metadata);
    this.logEntry(entry);
  }

  // Group logging
  public group(component: string, label: string): void {
    if (this.config.enableGroups && this.config.enableConsole) {
      console.group(`[${component}] ${label}`);
    }
  }

  public groupEnd(): void {
    if (this.config.enableGroups && this.config.enableConsole) {
      console.groupEnd();
    }
  }

  // Performance logging
  public time(component: string, label: string): void {
    if (this.config.enablePerformance && this.config.enableConsole) {
      console.time(`[${component}] ${label}`);
    }
  }

  public timeEnd(component: string, label: string): void {
    if (this.config.enablePerformance && this.config.enableConsole) {
      console.timeEnd(`[${component}] ${label}`);
    }
  }

  // Configuration methods
  public configure(config: Partial<LoggerConfig>): void {
    this.config = this.mergeConfig(this.config, config);
    this.info('Logger', 'Logger configuration updated', { config: this.config });
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
    this.info('Logger', 'Log level updated', { level });
  }

  public getLogs(filter?: {
    level?: LogLevel;
    component?: string;
    since?: Date;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }

      if (filter.component) {
        filteredLogs = filteredLogs.filter(log => log.component === filter.component);
      }

      if (filter.since) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filter.since!);
      }

      if (filter.limit) {
        filteredLogs = filteredLogs.slice(-filter.limit);
      }
    }

    return filteredLogs;
  }

  public getMetrics(): LoggerMetrics {
    return { ...this.metrics };
  }

  public clearLogs(): void {
    this.logs = [];
    this.metrics = this.initializeMetrics();
    
    if (this.config.enableLocalStorage) {
      localStorage.removeItem('prism-logs');
    }

    this.info('Logger', 'Logs cleared');
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public async downloadLogs(filename?: string): Promise<void> {
    const logs = this.exportLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `prism-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Error handling
  public logError(error: Error, component: string, context?: Record<string, any>): void {
    this.error(component, error.message, error, undefined, context);
  }

  // Cleanup
  public async cleanup(): Promise<void> {
    try {
      this.clearLogs();
      this.info('Logger', 'Logger cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup logger:', error);
    }
  }
}

// Export singleton instance
export const logger = EnhancedLogger.getInstance();
export const initializeLogger = EnhancedLogger.prototype.initialize.bind(EnhancedLogger.getInstance());
export const configureLogger = EnhancedLogger.prototype.configure.bind(EnhancedLogger.getInstance());
export const setLogLevel = EnhancedLogger.prototype.setLevel.bind(EnhancedLogger.getInstance());
export const getLogs = EnhancedLogger.prototype.getLogs.bind(EnhancedLogger.getInstance());
export const getMetrics = EnhancedLogger.prototype.getMetrics.bind(EnhancedLogger.getInstance());
export const clearLogs = EnhancedLogger.prototype.clearLogs.bind(EnhancedLogger.getInstance());
export const exportLogs = EnhancedLogger.prototype.exportLogs.bind(EnhancedLogger.getInstance());
export const downloadLogs = EnhancedLogger.prototype.downloadLogs.bind(EnhancedLogger.getInstance());
export const logError = EnhancedLogger.prototype.logError.bind(EnhancedLogger.getInstance());
export const cleanupLogger = EnhancedLogger.prototype.cleanup.bind(EnhancedLogger.getInstance());