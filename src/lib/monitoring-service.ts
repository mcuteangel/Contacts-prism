/**
 * Enhanced Monitoring Service for PRISM Contacts
 * 
 * این سرویس مانیتورینگ پیشرفته برای PRISM Contacts طراحی شده و ویژگی‌های زیر را دارد:
 * - جمع‌آوری آمار عملکرد
 * - ردیابی رویدادها
 * - مانیتورینگ خطاها
 * - گزارش‌گیری
 * - هشداردهی
 * - تحلیل داده‌ها
 * - پشتیبانی از گزارش‌های زمان‌بندی شده
 */

import { logger } from './logger';

export interface MonitoringConfig {
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableReporting: boolean;
  reportInterval: number;
  enableRealtime: boolean;
  enableAnalytics: boolean;
  maxEvents: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface MonitoringMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  errors: number;
  warnings: number;
  averageResponseTime: number;
  uptime: number;
  memoryUsage: number;
  lastEventTime: string;
  sessionInfo: {
    sessionId: string;
    startTime: string;
    userAgent: string;
    url: string;
  };
}

export interface EventData {
  timestamp: string;
  type: string;
  component: string;
  action: string;
  data?: any;
  duration?: number;
  success: boolean;
  error?: Error;
}

export interface AlertData {
  id: string;
  type: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private config: MonitoringConfig;
  private metrics: MonitoringMetrics;
  private events: EventData[] = [];
  private alerts: AlertData[] = [];
  private isInitialized = false;
  private reportingInterval: NodeJS.Timeout | null = null;
  private sessionId: string;

  private defaultConfig: MonitoringConfig = {
    enableLogging: true,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableReporting: false,
    reportInterval: 300000, // 5 minutes
    enableRealtime: true,
    enableAnalytics: true,
    maxEvents: 10000,
    alertThresholds: {
      errorRate: 0.05, // 5%
      responseTime: 1000, // 1 second
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8 // 80%
    }
  };

  private constructor(config?: Partial<MonitoringConfig>) {
    this.config = this.mergeConfig(this.defaultConfig, config);
    this.metrics = this.initializeMetrics();
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(config?: Partial<MonitoringConfig>): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config);
    }
    return MonitoringService.instance;
  }

  private mergeConfig(defaultConfig: MonitoringConfig, userConfig?: Partial<MonitoringConfig>): MonitoringConfig {
    if (!userConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...userConfig,
      alertThresholds: { ...defaultConfig.alertThresholds, ...userConfig.alertThresholds }
    };
  }

  private initializeMetrics(): MonitoringMetrics {
    return {
      totalEvents: 0,
      eventsByType: {},
      errors: 0,
      warnings: 0,
      averageResponseTime: 0,
      uptime: Date.now(),
      memoryUsage: 0,
      lastEventTime: new Date().toISOString(),
      sessionInfo: {
        sessionId: this.sessionId,
        startTime: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.info('MonitoringService', 'Initializing monitoring service...');

      // Start performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring();
      }

      // Start error tracking
      if (this.config.enableErrorTracking) {
        this.startErrorTracking();
      }

      // Start reporting if enabled
      if (this.config.enableReporting) {
        this.startReporting();
      }

      // Start memory monitoring
      this.startMemoryMonitoring();

      this.isInitialized = true;
      this.info('MonitoringService', 'Monitoring service initialized successfully', {
        config: this.config,
        sessionId: this.sessionId
      });
    } catch (error) {
      logger.error('MonitoringService', 'Failed to initialize monitoring service', error as Error);
      throw error;
    }
  }

  private startPerformanceMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor page load times
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.track('performance', 'page_load', {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: navigation.responseEnd - navigation.fetchStart
          });
        }
      });

      // Monitor resource timing
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.track('performance', 'resource_load', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private startErrorTracking(): void {
    if (typeof window !== 'undefined') {
      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError('global', 'unhandled_promise_rejection', event.reason);
      });

      // Track uncaught exceptions
      window.addEventListener('error', (event) => {
        this.trackError('global', 'uncaught_exception', event.error);
      });
    }
  }

  private startMemoryMonitoring(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const used = memory.usedJSHeapSize;
          const total = memory.totalJSHeapSize;
          const memoryUsage = used / total;

          this.updateMetrics({
            memoryUsage
          });

          // Check memory threshold
          if (memoryUsage > this.config.alertThresholds.memoryUsage) {
            this.alert('warning', 'memory', 'High memory usage detected', {
              usage: memoryUsage,
              used: used,
              total: total
            });
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private startReporting(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    this.reportingInterval = setInterval(() => {
      this.generateReport();
    }, this.config.reportInterval);
  }

  private updateMetrics(updates: Partial<MonitoringMetrics>): void {
    this.metrics = { ...this.metrics, ...updates };
  }

  private generateReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      metrics: this.metrics,
      events: this.events.slice(-100), // Last 100 events
      alerts: this.alerts.slice(-50), // Last 50 alerts
      summary: {
        totalEvents: this.metrics.totalEvents,
        errors: this.metrics.errors,
        warnings: this.metrics.warnings,
        averageResponseTime: this.metrics.averageResponseTime,
        uptime: Date.now() - this.metrics.uptime,
        memoryUsage: this.metrics.memoryUsage
      }
    };

    this.info('MonitoringService', 'Generated monitoring report', report);

    // Send report to external service if configured
    if (this.config.enableRealtime) {
      this.sendReport(report);
    }
  }

  private async sendReport(report: any): Promise<void> {
    try {
      // This would typically send to an external monitoring service
      // For now, we'll just log it
      this.debug('MonitoringService', 'Would send report to external service', report);
    } catch (error) {
      logger.error('MonitoringService', 'Failed to send report', error as Error);
    }
  }

  // Public methods
  public track(component: string, event: string, data?: any, duration?: number): void {
    const eventData: EventData = {
      timestamp: new Date().toISOString(),
      type: 'event',
      component,
      action: event,
      data,
      duration,
      success: true
    };

    this.addEvent(eventData);
  }

  public trackError(component: string, event: string, error: Error, data?: any): void {
    const eventData: EventData = {
      timestamp: new Date().toISOString(),
      type: 'error',
      component,
      action: event,
      data,
      success: false,
      error
    };

    this.addEvent(eventData);

    // Update error metrics
    this.updateMetrics({
      errors: this.metrics.errors + 1
    });

    // Check error rate threshold
    const errorRate = this.metrics.errors / this.metrics.totalEvents;
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.alert('error', 'error_rate', 'High error rate detected', {
        errorRate,
        errors: this.metrics.errors,
        totalEvents: this.metrics.totalEvents
      });
    }
  }

  public trackPerformance(component: string, action: string, duration: number, data?: any): void {
    const eventData: EventData = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      component,
      action,
      data,
      duration,
      success: true
    };

    this.addEvent(eventData);

    // Update average response time
    const newAverage = (this.metrics.averageResponseTime * (this.metrics.totalEvents - 1) + duration) / this.metrics.totalEvents;
    this.updateMetrics({
      averageResponseTime: newAverage
    });

    // Check response time threshold
    if (duration > this.config.alertThresholds.responseTime) {
      this.alert('warning', 'response_time', 'Slow response time detected', {
        duration,
        threshold: this.config.alertThresholds.responseTime,
        component,
        action
      });
    }
  }

  public alert(type: 'error' | 'warning' | 'info', component: string, message: string, metadata?: Record<string, any>): void {
    const alert: AlertData = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      component,
      message,
      timestamp: new Date().toISOString(),
      severity: this.calculateSeverity(type),
      metadata
    };

    this.alerts.push(alert);

    // Log the alert
    this.logger(`MonitoringService`, `Alert: ${message}`, { alert });

    // Check if we need to notify
    if (type === 'error' || (type === 'warning' && alert.severity === 'high')) {
      this.notifyAlert(alert);
    }
  }

  private calculateSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      case 'info':
        return 'low';
      default:
        return 'low';
    }
  }

  private notifyAlert(alert: AlertData): void {
    // This could send notifications, emails, etc.
    // For now, we'll just log it
    this.info('MonitoringService', 'Alert notification', { alert });
  }

  private addEvent(event: EventData): void {
    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // Update metrics
    this.updateMetrics({
      totalEvents: this.metrics.totalEvents + 1,
      lastEventTime: event.timestamp
    });

    // Update events by type
    if (!this.metrics.eventsByType[event.type]) {
      this.metrics.eventsByType[event.type] = 0;
    }
    this.metrics.eventsByType[event.type]++;

    // Log the event if enabled
    if (this.config.enableLogging) {
      this.logger('MonitoringService', `Event: ${event.component}.${event.action}`, event);
    }
  }

  private logger(component: string, message: string, data?: any): void {
    if (this.config.enableLogging) {
      logger.info(component, message, data);
    }
  }

  private debug(component: string, message: string, data?: any): void {
    if (this.config.enableLogging) {
      logger.debug(component, message, data);
    }
  }

  private info(component: string, message: string, data?: any): void {
    if (this.config.enableLogging) {
      logger.info(component, message, data);
    }
  }

  // Configuration methods
  public configure(config: Partial<MonitoringConfig>): void {
    this.config = this.mergeConfig(this.config, config);

    // Restart reporting if needed
    if (this.config.enableReporting && !this.reportingInterval) {
      this.startReporting();
    } else if (!this.config.enableReporting && this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }

    this.info('MonitoringService', 'Monitoring configuration updated', { config: this.config });
  }

  public getStatus(): MonitoringMetrics {
    return { ...this.metrics };
  }

  public getEvents(filter?: {
    type?: string;
    component?: string;
    since?: Date;
    limit?: number;
  }): EventData[] {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.type) {
        filteredEvents = filteredEvents.filter(event => event.type === filter.type);
      }

      if (filter.component) {
        filteredEvents = filteredEvents.filter(event => event.component === filter.component);
      }

      if (filter.since) {
        filteredEvents = filteredEvents.filter(event => new Date(event.timestamp) >= filter.since!);
      }

      if (filter.limit) {
        filteredEvents = filteredEvents.slice(-filter.limit);
      }
    }

    return filteredEvents;
  }

  public getAlerts(filter?: {
    type?: string;
    severity?: string;
    since?: Date;
    limit?: number;
  }): AlertData[] {
    let filteredAlerts = [...this.alerts];

    if (filter) {
      if (filter.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filter.type);
      }

      if (filter.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filter.severity);
      }

      if (filter.since) {
        filteredAlerts = filteredAlerts.filter(alert => new Date(alert.timestamp) >= filter.since!);
      }

      if (filter.limit) {
        filteredAlerts = filteredAlerts.slice(-filter.limit);
      }
    }

    return filteredAlerts;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public stopReporting(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }

  public cleanup(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.stopReporting();
        this.events = [];
        this.alerts = [];
        this.metrics = this.initializeMetrics();
        this.info('MonitoringService', 'Monitoring service cleanup completed');
        resolve();
      } catch (error) {
        logger.error('MonitoringService', 'Failed to cleanup monitoring service', error as Error);
        resolve();
      }
    });
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();
export const initializeMonitoring = MonitoringService.prototype.initialize.bind(MonitoringService.getInstance());
export const configureMonitoring = MonitoringService.prototype.configure.bind(MonitoringService.getInstance());
export const getStatus = MonitoringService.prototype.getStatus.bind(MonitoringService.getInstance());
export const getEvents = MonitoringService.prototype.getEvents.bind(MonitoringService.getInstance());
export const getAlerts = MonitoringService.prototype.getAlerts.bind(MonitoringService.getInstance());
export const getSessionId = MonitoringService.prototype.getSessionId.bind(MonitoringService.getInstance());
export const stopReporting = MonitoringService.prototype.stopReporting.bind(MonitoringService.getInstance());
export const cleanupMonitoring = MonitoringService.prototype.cleanup.bind(MonitoringService.getInstance());