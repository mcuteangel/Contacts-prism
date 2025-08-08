/**
 * PRISM Core - هسته مرکزی PRISM Contacts
 * 
 * این ماژول تمام سرویس‌های بهبودیافته را یکجا مدیریت می‌کند:
 * - مدیریت خطا
 * - لاگ‌گیری و مانیتورینگ
 * - بهینه‌سازی عملکرد
 * - امنیت
 * - پیکربندی مرکزی
 */

import { logger } from './logger';
import { ErrorManager, ErrorType } from './error-manager';
import { monitoringService } from './monitoring-service';
import { performanceOptimizer } from './performance-optimizer';
import { securityEnhancer } from './security-enhancer';

export interface PrismCoreConfig {
  errorHandling: {
    enable: boolean;
    enableRetry: boolean;
    maxRetries: number;
    retryDelay: number;
  };
  monitoring: {
    enable: boolean;
    enableLogging: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorTracking: boolean;
    enableReporting: boolean;
    reportInterval: number;
  };
  performance: {
    enableVirtualization: boolean;
    enableMemoization: boolean;
    enableCaching: boolean;
    enableDebouncing: boolean;
    enableThrottling: boolean;
    enableLazyLoading: boolean;
    enablePrefetching: boolean;
    memoryThreshold: number;
    cacheSize: number;
    debounceDelay: number;
    throttleDelay: number;
  };
  security: {
    enableEncryption: boolean;
    enableTokenRotation: boolean;
    enableRateLimiting: boolean;
    enableCSP: boolean;
    enableHSTS: boolean;
    enableXSSProtection: boolean;
    enableCSRFProtection: boolean;
    tokenRotationInterval: number;
    maxLoginAttempts: number;
    sessionTimeout: number;
    encryptionKey: string;
  };
}

export interface PrismCoreStatus {
  errorHandling: {
    enabled: boolean;
    instance: ErrorManager | null;
  };
  monitoring: {
    enabled: boolean;
    instance: any;
    status: any;
  };
  performance: {
    enabled: boolean;
    instance: any;
    status: any;
  };
  security: {
    enabled: boolean;
    instance: any;
    status: any;
  };
  overallHealth: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export class PrismCore {
  private static instance: PrismCore;
  private config: PrismCoreConfig;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private defaultConfig: PrismCoreConfig = {
    errorHandling: {
      enable: true,
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000
    },
    monitoring: {
      enable: true,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      enableErrorTracking: true,
      enableReporting: false,
      reportInterval: 300000
    },
    performance: {
      enableVirtualization: true,
      enableMemoization: true,
      enableCaching: true,
      enableDebouncing: true,
      enableThrottling: true,
      enableLazyLoading: true,
      enablePrefetching: true,
      memoryThreshold: 0.8,
      cacheSize: 100,
      debounceDelay: 300,
      throttleDelay: 100
    },
    security: {
      enableEncryption: true,
      enableTokenRotation: true,
      enableRateLimiting: true,
      enableCSP: true,
      enableHSTS: true,
      enableXSSProtection: true,
      enableCSRFProtection: true,
      tokenRotationInterval: 3600000,
      maxLoginAttempts: 5,
      sessionTimeout: 86400000,
      encryptionKey: 'prism-contacts-security-key-2024'
    }
  };

  private constructor(config?: Partial<PrismCoreConfig>) {
    this.config = this.mergeConfig(this.defaultConfig, config);
  }

  public static getInstance(config?: Partial<PrismCoreConfig>): PrismCore {
    if (!PrismCore.instance) {
      PrismCore.instance = new PrismCore(config);
    }
    return PrismCore.instance;
  }

  /**
   * ادغام پیکربندی‌ها
   */
  private mergeConfig(defaultConfig: PrismCoreConfig, userConfig?: Partial<PrismCoreConfig>): PrismCoreConfig {
    if (!userConfig) {
      return defaultConfig;
    }

    return {
      errorHandling: { ...defaultConfig.errorHandling, ...userConfig.errorHandling },
      monitoring: { ...defaultConfig.monitoring, ...userConfig.monitoring },
      performance: { ...defaultConfig.performance, ...userConfig.performance },
      security: { ...defaultConfig.security, ...userConfig.security }
    };
  }

  /**
   * مقداردهی اولیه PRISM Core
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * انجام عملیات مقداردهی اولیه
   */
  private async performInitialization(): Promise<void> {
    try {
      logger.info('PrismCore', 'Starting PRISM Core initialization...');

      // 1. مقداردهی اولیه مدیریت خطا
      if (this.config.errorHandling.enable) {
        await this.initializeErrorHandling();
      }

      // 2. مقداردهی اولیه مانیتورینگ
      if (this.config.monitoring.enable) {
        await this.initializeMonitoring();
      }

      // 3. مقداردهی اولیه بهینه‌سازی عملکرد
      if (this.config.performance.enableVirtualization || this.config.performance.enableMemoization) {
        await this.initializePerformance();
      }

      // 4. مقداردهی اولیه امنیت
      if (this.config.security.enableEncryption || this.config.security.enableTokenRotation) {
        await this.initializeSecurity();
      }

      // 5. راه‌اندازی مانیتورینگ کلی
      this.startOverallMonitoring();

      this.isInitialized = true;
      logger.info('PrismCore', 'PRISM Core initialized successfully');

      // ارسال رویداد آماده‌سازی
      this.emitReadyEvent();
    } catch (error) {
      logger.error('PrismCore', 'Failed to initialize PRISM Core', error as Error);
      throw error;
    }
  }

  /**
   * مقداردهی اولیه مدیریت خطا
   */
  private async initializeErrorHandling(): Promise<void> {
    try {
      ErrorManager.getInstance();
      logger.info('PrismCore', 'Error handling initialized');
    } catch (error) {
      logger.error('PrismCore', 'Failed to initialize error handling', error as Error);
      throw error;
    }
  }

  /**
   * مقداردهی اولیه مانیتورینگ
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      monitoringService.configure({
        enableLogging: this.config.monitoring.enableLogging,
        enablePerformanceMonitoring: this.config.monitoring.enablePerformanceMonitoring,
        enableErrorTracking: this.config.monitoring.enableErrorTracking,
        enableReporting: this.config.monitoring.enableReporting,
        reportInterval: this.config.monitoring.reportInterval
      });
      
      monitoringService.initialize();
      logger.info('PrismCore', 'Monitoring initialized');
    } catch (error) {
      logger.error('PrismCore', 'Failed to initialize monitoring', error as Error);
      throw error;
    }
  }

  /**
   * مقداردهی اولیه بهینه‌سازی عملکرد
   */
  private async initializePerformance(): Promise<void> {
    try {
      performanceOptimizer.configure({
        enableVirtualization: this.config.performance.enableVirtualization,
        enableMemoization: this.config.performance.enableMemoization,
        enableCaching: this.config.performance.enableCaching,
        enableDebouncing: this.config.performance.enableDebouncing,
        enableThrottling: this.config.performance.enableThrottling,
        enableLazyLoading: this.config.performance.enableLazyLoading,
        enablePrefetching: this.config.performance.enablePrefetching,
        memoryThreshold: this.config.performance.memoryThreshold,
        cacheSize: this.config.performance.cacheSize,
        debounceDelay: this.config.performance.debounceDelay,
        throttleDelay: this.config.performance.throttleDelay
      });
      
      performanceOptimizer.initialize();
      logger.info('PrismCore', 'Performance optimization initialized');
    } catch (error) {
      logger.error('PrismCore', 'Failed to initialize performance optimization', error as Error);
      throw error;
    }
  }

  /**
   * مقداردهی اولیه امنیت
   */
  private async initializeSecurity(): Promise<void> {
    try {
      await securityEnhancer.configure({
        enableEncryption: this.config.security.enableEncryption,
        enableTokenRotation: this.config.security.enableTokenRotation,
        enableRateLimiting: this.config.security.enableRateLimiting,
        enableCSP: this.config.security.enableCSP,
        enableHSTS: this.config.security.enableHSTS,
        enableXSSProtection: this.config.security.enableXSSProtection,
        enableCSRFProtection: this.config.security.enableCSRFProtection,
        tokenRotationInterval: this.config.security.tokenRotationInterval,
        maxLoginAttempts: this.config.security.maxLoginAttempts,
        sessionTimeout: this.config.security.sessionTimeout,
        encryptionKey: this.config.security.encryptionKey
      });
      
      await securityEnhancer.initialize();
      logger.info('PrismCore', 'Security initialized');
    } catch (error) {
      logger.error('PrismCore', 'Failed to initialize security', error as Error);
      throw error;
    }
  }

  /**
   * شروع مانیتورینگ کلی
   */
  private startOverallMonitoring(): void {
    // مانیتورینگ وضعیت کلی سیستم
    setInterval(() => {
      this.checkSystemHealth();
    }, 60000); // هر دقیقه یکبار

    // مانیتورینگ نشانه‌های حیات
    setInterval(() => {
      this.sendHeartbeat();
    }, 300000); // هر 5 دقیقه یکبار
  }

  /**
   * بررسی سلامت سیستم
   */
  private async checkSystemHealth(): Promise<void> {
    try {
      const status = this.getStatus();
      
      // اگر وضعیت سیستم پایین بود، هشدار ده
      if (status.overallHealth.score < 70) {
        logger.warn('PrismCore', `System health score low: ${status.overallHealth.score}`);
        
        // ارسال رویداد سلامت پایین
        this.emitHealthEvent(status);
      }
    } catch (error) {
      logger.error('PrismCore', 'Failed to check system health', error as Error);
    }
  }

  /**
   * ارسال نشانه‌های حیات
   */
  private sendHeartbeat(): void {
    try {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        service: 'prism-core',
        status: 'healthy',
        uptime: process.uptime ? process.uptime() : Date.now()
      };
      
      logger.debug('PrismCore', 'Heartbeat', heartbeat);
    } catch (error) {
      logger.error('PrismCore', 'Failed to send heartbeat', error as Error);
    }
  }

  /**
   * ارسال رویداد آماده‌سازی
   */
  private emitReadyEvent(): void {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prism-core-ready', {
          detail: { timestamp: new Date().toISOString() }
        }));
      }
    } catch (error) {
      logger.error('PrismCore', 'Failed to emit ready event', error as Error);
    }
  }

  /**
   * ارسال رویداد سلامت
   */
  private emitHealthEvent(status: PrismCoreStatus): void {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prism-core-health-check', {
          detail: { status, timestamp: new Date().toISOString() }
        }));
      }
    } catch (error) {
      logger.error('PrismCore', 'Failed to emit health event', error as Error);
    }
  }

  /**
   * پیکربندی PRISM Core
   */
  public async configure(config: Partial<PrismCoreConfig>): Promise<void> {
    this.config = this.mergeConfig(this.config, config);
    
    if (this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * دریافت وضعیت فعلی
   */
  public getStatus(): PrismCoreStatus {
    const errorHandlingStatus = this.config.errorHandling.enable ? {
      enabled: true,
      instance: ErrorManager.getInstance()
    } : { enabled: false, instance: null };

    const monitoringStatus = this.config.monitoring.enable ? {
      enabled: true,
      instance: monitoringService,
      status: monitoringService.getStatus()
    } : { enabled: false, instance: null, status: null };

    const performanceStatus = (this.config.performance.enableVirtualization || this.config.performance.enableMemoization) ? {
      enabled: true,
      instance: performanceOptimizer,
      status: performanceOptimizer.getStatus()
    } : { enabled: false, instance: null, status: null };

    const securityStatus = (this.config.security.enableEncryption || this.config.security.enableTokenRotation) ? {
      enabled: true,
      instance: securityEnhancer,
      status: securityEnhancer.getStatus()
    } : { enabled: false, instance: null, status: null };

    // محاسبه امتیاز کلی سلامت
    const healthScore = this.calculateHealthScore(errorHandlingStatus, monitoringStatus, performanceStatus, securityStatus);
    
    return {
      errorHandling: errorHandlingStatus,
      monitoring: monitoringStatus,
      performance: performanceStatus,
      security: securityStatus,
      overallHealth: {
        score: healthScore.score,
        issues: healthScore.issues,
        recommendations: healthScore.recommendations
      }
    };
  }

  /**
   * محاسبه امتیاز سلامت
   */
  private calculateHealthScore(
    errorHandling: any,
    monitoring: any,
    performance: any,
    security: any
  ): { score: number; issues: string[]; recommendations: string[] } {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // بررسی مدیریت خطا
    if (!errorHandling.enabled) {
      score -= 20;
      issues.push('Error handling is disabled');
      recommendations.push('Enable error handling for better reliability');
    }

    // بررسی مانیتورینگ
    if (!monitoring.enabled) {
      score -= 15;
      issues.push('Monitoring is disabled');
      recommendations.push('Enable monitoring for better observability');
    }

    // بررسی بهینه‌سازی عملکرد
    if (!performance.enabled) {
      score -= 15;
      issues.push('Performance optimization is disabled');
      recommendations.push('Enable performance optimization for better user experience');
    }

    // بررسی امنیت
    if (!security.enabled) {
      score -= 25;
      issues.push('Security is disabled');
      recommendations.push('Enable security features to protect user data');
    }

    // بررسی وضعیت‌های خاص
    if (monitoring.enabled && monitoring.status) {
      const metrics = monitoring.status.metrics;
      if (metrics.memoryUsage > 0.9) {
        score -= 10;
        issues.push('High memory usage detected');
        recommendations.push('Check for memory leaks and optimize memory usage');
      }
    }

    if (performance.enabled && performance.status) {
      const metrics = performance.status.metrics;
      if (metrics.optimizationScore < 50) {
        score -= 10;
        issues.push('Low performance optimization score');
        recommendations.push('Enable more performance optimization features');
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  /**
   * اجرای عملیات با مدیریت خطا
   */
  public async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: { component: string; action: string; metadata?: any }
  ): Promise<T> {
    if (!this.config.errorHandling.enable) {
      return operation();
    }

    return ErrorManager.withErrorHandling(operation, context);
  }

  /**
   * اندازه‌گیری عملکرد
   */
  public measurePerformance<T>(
    name: string,
    operation: () => T,
    component?: string
  ): T {
    if (!this.config.performance.enableVirtualization && !this.config.performance.enableMemoization) {
      return operation();
    }

    // Simple performance measurement without external dependencies
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    logger.debug('PrismCore', `Performance: ${name}`, { duration: end - start, component });
    
    return result;
  }

  /**
   * اندازه‌گیری عملکرد async
   */
  public async measurePerformanceAsync<T>(
    name: string,
    operation: () => Promise<T>,
    component?: string
  ): Promise<T> {
    if (!this.config.performance.enableVirtualization && !this.config.performance.enableMemoization) {
      return operation();
    }

    // Simple performance measurement without external dependencies
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    
    logger.debug('PrismCore', `Performance: ${name}`, { duration: end - start, component });
    
    return result;
  }

  /**
   * لاگ کردن رویداد
   */
  public logEvent(component: string, event: string, data?: any): void {
    if (this.config.monitoring.enable && this.config.monitoring.enableLogging) {
      monitoringService.track(component, event, data);
    }
  }

  /**
   * گزارش خطا
   */
  public reportError(error: Error, context: { component: string; action: string; metadata?: any }): void {
    if (this.config.errorHandling.enable) {
      ErrorManager.reportError(error, context);
    }
    
    if (this.config.monitoring.enable && this.config.monitoring.enableErrorTracking) {
      monitoringService.trackError(context.component, context.action, error);
    }
  }

  /**
   * دریافت شناسه جلسه
   */
  public getSessionId(): string {
    return monitoringService.getSessionId();
  }

  /**
   * پاک‌سازی منابع
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.config.monitoring.enable) {
        monitoringService.stopReporting();
        monitoringService.cleanup();
      }
      
      if (this.config.performance.enableVirtualization || this.config.performance.enableMemoization) {
        // Simple cleanup without external dependencies
        logger.info('PrismCore', 'Performance optimization cleanup completed');
      }
      
      logger.info('PrismCore', 'Cleanup completed');
    } catch (error) {
      logger.error('PrismCore', 'Failed to cleanup', error as Error);
    }
  }
}

// export convenience functions
export const prismCore = PrismCore.getInstance();
export const initializePrismCore = PrismCore.prototype.initialize.bind(PrismCore.getInstance());
export const configurePrismCore = PrismCore.prototype.configure.bind(PrismCore.getInstance());
export const getPrismCoreStatus = PrismCore.prototype.getStatus.bind(PrismCore.getInstance());
export const executeWithErrorHandling = PrismCore.prototype.executeWithErrorHandling.bind(PrismCore.getInstance());
export const measurePerformance = PrismCore.prototype.measurePerformance.bind(PrismCore.getInstance());
export const measurePerformanceAsync = PrismCore.prototype.measurePerformanceAsync.bind(PrismCore.getInstance());
export const logEvent = PrismCore.prototype.logEvent.bind(PrismCore.getInstance());
export const reportError = PrismCore.prototype.reportError.bind(PrismCore.getInstance());
export const getPrismCoreSessionId = PrismCore.prototype.getSessionId.bind(PrismCore.getInstance());
export const cleanupPrismCore = PrismCore.prototype.cleanup.bind(PrismCore.getInstance());