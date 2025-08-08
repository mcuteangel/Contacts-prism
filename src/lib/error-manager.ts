/**
 * Error Manager - سیستم مدیریت خطای مرکزی PRISM Contacts
 * 
 * این ماژول مدیریت خطاها را به صورت یکپارچه فراهم می‌کند و شامل:
 * - طبقه‌بندی خطاها بر اساس نوع
 * - لاگ‌گیری ساختاریافته
 * - اطلاع‌رسانی به کاربر
 * - تلاش مجدد خودکار برای خطاهای موقتی
 * - گزارش‌دهی خطاها
 */

import { logger } from './logger';

export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  DATABASE = 'database',
  SYNC = 'sync',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  component: string;
  action: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  timestamp: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
}

export class ErrorManager {
  private static instance: ErrorManager;
  private errorQueue: ErrorReport[] = [];
  private isReporting = false;
  private retryStrategies: Map<ErrorType, (error: Error, context: ErrorContext) => boolean> = new Map();

  private constructor() {
    this.initializeRetryStrategies();
  }

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  /**
   * استراتژی‌های تلاش مجدد برای انواع خطا
   */
  private initializeRetryStrategies(): void {
    // خطاهای شبکه
    this.retryStrategies.set(ErrorType.NETWORK, (error: Error) => {
      const networkErrors = [
        'NetworkError',
        'timeout',
        'fetch failed',
        'ERR_NETWORK',
        'ERR_CONNECTION_REFUSED'
      ];
      
      return networkErrors.some(err => 
        error.message.toLowerCase().includes(err.toLowerCase())
      );
    });

    // خطاهای احراز هویت
    this.retryStrategies.set(ErrorType.AUTH, (error: Error) => {
      const authErrors = [
        'jwt',
        'unauthorized',
        'forbidden',
        'token',
        'authentication'
      ];
      
      return authErrors.some(err => 
        error.message.toLowerCase().includes(err.toLowerCase())
      );
    });

    // خطاهای سنکرون
    this.retryStrategies.set(ErrorType.SYNC, (error: Error) => {
      const syncErrors = [
        'sync',
        'conflict',
        'offline',
        'connection'
      ];
      
      return syncErrors.some(err => 
        error.message.toLowerCase().includes(err.toLowerCase())
      );
    });
  }

  /**
   * ایجاد خطای سفارشی
   */
  public static createCustomError(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: Partial<ErrorContext>
  ): Error {
    const error = new Error(message);
    error.name = type;
    return error;
  }

  /**
   * دریافت نوع خطا
   */
  public static getErrorType(error: Error): ErrorType {
    if (!error.name) {
      return ErrorType.UNKNOWN;
    }

    const errorName = error.name.toLowerCase();
    
    if (errorName.includes('network') || errorName.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    
    if (errorName.includes('auth') || errorName.includes('jwt') || errorName.includes('token')) {
      return ErrorType.AUTH;
    }
    
    if (errorName.includes('validation') || errorName.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    
    if (errorName.includes('database') || errorName.includes('db') || errorName.includes('dexie')) {
      return ErrorType.DATABASE;
    }
    
    if (errorName.includes('sync')) {
      return ErrorType.SYNC;
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * دریافت پیام قابل فهم برای کاربر
   */
  public static getUserFriendlyMessage(error: Error): string {
    const type = this.getErrorType(error);
    
    switch (type) {
      case ErrorType.NETWORK:
        return 'خطای شبکه: اتصال اینترنت خود را بررسی کنید';
      
      case ErrorType.AUTH:
        return 'خطای احراز هویت: لطفاً دوباره وارد شوید';
      
      case ErrorType.VALIDATION:
        return 'ورودی‌های شما معتبر نیستند';
      
      case ErrorType.DATABASE:
        return 'خطای پایگاه داده: داده‌ها ذخیره نشدند';
      
      case ErrorType.SYNC:
        return 'خطای همگام‌سازی: دوباره تلاش کنید';
      
      default:
        return 'خطای ناشناخته: لطفاً دوباره تلاش کنید';
    }
  }

  /**
   * لاگ کردن خطا
   * @param error شیء خطا
   * @param context متن یا شیء زمینه خطا
   */
  public static logError(error: Error, context?: string | Partial<ErrorContext>): void {
    const errorType = this.getErrorType(error);
    
    // اگر context به صورت رشته بود، آن را به عنوان action در نظر می‌گیریم
    const contextObj = typeof context === 'string' 
      ? { component: 'Unknown', action: context }
      : context || {};
      
    const fullContext: ErrorContext = {
      component: contextObj?.component || 'Unknown',
      action: contextObj?.action || 'unknown',
      metadata: contextObj?.metadata,
      userId: contextObj?.userId,
      sessionId: contextObj?.sessionId
    };

    // لاگ کردن خطا با جزئیات کامل
    logger.error(
      fullContext.component, 
      `[${errorType}] ${fullContext.action}: ${error.message}`, 
      error,
      { 
        errorType,
        stack: error.stack,
        context: fullContext,
        ...(error instanceof Error && { name: error.name })
      },
      fullContext.metadata
    );
  }

  /**
   * اطلاع‌رسانی به کاربر
   * @param message متن پیام
   * @param type نوع پیام (خطا، هشدار، موفقیت)
   */
  public static notifyUser(message: string, type: 'error' | 'warning' | 'success' = 'error'): void {
    try {
      // استفاده از toast یا مکانیزم اطلاع‌رسانی موجود در برنامه
      if (typeof window !== 'undefined') {
        // اگر کتابخانه toast موجود است از آن استفاده می‌کنیم
        if ((window as any).toast) {
          const toast = (window as any).toast;
          const options = {
            position: 'top-right',
            autoClose: type === 'error' ? 10000 : 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light',
          };

          switch (type) {
            case 'success':
              toast.success(message, options);
              break;
            case 'warning':
              toast.warning(message, options);
              break;
            case 'error':
            default:
              toast.error(message, options);
              break;
          }
        } else {
          // ارسال رویداد سفارشی برای کامپوننت‌های دیگر
          const event = new CustomEvent('show-notification', {
            detail: { message, type }
          });
          window.dispatchEvent(event);
          
          // Fallback به console اگر هیچ کدام در دسترس نبود
          const logMethod = type === 'error' ? console.error : 
                          type === 'warning' ? console.warn : console.log;
          logMethod(`[${type.toUpperCase()}] ${message}`);
        }
      }

      // لاگ کردن اطلاع‌رسانی
      const logLevel = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'info';
      logger[logLevel]('ErrorManager', `User notification [${type}]: ${message}`);
    } catch (error) {
      console.error('خطا در ارسال اطلاع‌رسانی به کاربر:', error);
    }
  }

  /**
   * گزارش خطا به سرویس‌های مانیتورینگ
   * @param error شیء خطا یا متن خطا
   * @param metadata اطلاعات اضافی برای گزارش
   */
  public static reportError(error: Error | string, metadata: any = {}): void {
    try {
      // اگر خطا به صورت رشته بود، آن را به شیء Error تبدیل می‌کنیم
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      const errorType = this.getErrorType(errorObj);
      
      // ایجاد گزارش خطا
      const report: ErrorReport = {
        error: errorObj,
        context: {
          component: metadata?.component || 'Unknown',
          action: metadata?.action || 'reportError',
          metadata: metadata,
          userId: metadata?.userId,
          sessionId: metadata?.sessionId
        },
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        stackTrace: errorObj.stack
      };

      // اضافه کردن به صف گزارش‌ها
      const instance = this.getInstance();
      instance.errorQueue.push(report);

      // اگر در حال گزارش‌دهی نیستیم، صف را پردازش می‌کنیم
      if (!instance.isReporting) {
        instance.processErrorQueue();
      }

      // لاگ کردن گزارش خطا
      logger.error(
        report.context.component, 
        `[${errorType}] Error reported: ${errorObj.message}`, 
        errorObj,
        { 
          errorType,
          stack: errorObj.stack,
          context: report.context,
          reportMetadata: metadata
        }
      );
    } catch (reportError) {
      console.error('خطا در گزارش‌دهی خطا:', reportError);
    }
  }

  /**
   * پردازش صف خطاها و ارسال به سرویس‌های مانیتورینگ
   */
  private async processErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0 || this.isReporting) {
      return;
    }

    this.isReporting = true;
    const report = this.errorQueue.shift();

    if (!report) {
      this.isReporting = false;
      return;
    }

    try {
      // اینجا می‌توانید کد ارسال به سرویس‌های مانیتورینگ مانند Sentry, LogRocket و ... را اضافه کنید
      // مثال:
      // await this.sendToMonitoringService(report);
      
      // برای نمونه در کنسول لاگ می‌کنیم
      console.group('Error Report');
      console.error('Error:', report.error);
      console.log('Context:', report.context);
      console.log('Timestamp:', report.timestamp);
      console.groupEnd();

      // اگر خطای بعدی در صف وجود دارد، پردازش می‌شود
      if (this.errorQueue.length > 0) {
        await this.processErrorQueue();
      }
    } catch (error) {
      console.error('خطا در پردازش صف گزارش‌ها:', error);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * بررسی آیا خطا بحرانی است
   */
  private isCriticalError(error: Error): boolean {
    const criticalErrors = [
      'critical',
      'fatal',
      'uncaught',
      'out of memory'
    ];
    
    return criticalErrors.some(err => 
      error.message.toLowerCase().includes(err.toLowerCase())
    );
  }



  /**
   * ارسال گزارش خطا
   */
  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // در یک برنامه واقعی، اینجا باید به سرور گزارش ارسال شود
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  /**
   * تلاش مجدد برای عملیات با خطا
   */
  public static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // بررسی آیا می‌توان این خطا را تلاش مجدد کرد
        const errorType = this.getErrorType(lastError);
        const shouldRetry = this.shouldRetryError(errorType, lastError);
        
        if (!shouldRetry || attempt === maxRetries) {
          throw lastError;
        }

        // exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    throw lastError!;
  }

  /**
   * بررسی آیا خطا قابل تلاش مجدد است
   */
  private static shouldRetryError(errorType: ErrorType, error: Error): boolean {
    const strategy = this.getInstance().retryStrategies.get(errorType);
    
    if (!strategy) {
      return false;
    }

    return strategy(error, { component: 'retry', action: 'unknown' });
  }

  /**
   * دریافت آمار خطاها
   */
  public static getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    byComponent: Record<string, number>;
    recentErrors: Array<{
      message: string;
      type: ErrorType;
      component: string;
      timestamp: string;
    }>;
  } {
    const instance = ErrorManager.getInstance();
    const stats = {
      total: instance.errorQueue.length,
      byType: {} as Record<ErrorType, number>,
      byComponent: {} as Record<string, number>,
      recentErrors: instance.errorQueue.slice(-10).map(report => ({
        message: report.error.message,
        type: this.getErrorType(report.error),
        component: report.context.component,
        timestamp: report.timestamp
      }))
    };

    instance.errorQueue.forEach(report => {
      const type = this.getErrorType(report.error);
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byComponent[report.context.component] = (stats.byComponent[report.context.component] || 0) + 1;
    });

    return stats;
  }

  /**
   * پاک کردن صف خطاها
   */
  public static clearErrorQueue(): void {
    const instance = ErrorManager.getInstance();
    instance.errorQueue = [];
  }

  /**
   * ایجاد wrapper برای مدیریت خطا در توابع async
   */
  public static withErrorHandling<T>(
    fn: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    return this.retryOperation(fn, 3, 1000).catch(error => {
      this.reportError(error, context);
      this.notifyUser(this.getUserFriendlyMessage(error));
      throw error;
    });
  }
}

// export convenience functions
export const errorManager = ErrorManager.getInstance();
export const createCustomError = ErrorManager.createCustomError.bind(ErrorManager);
export const getErrorType = ErrorManager.getErrorType.bind(ErrorManager);
export const getUserFriendlyMessage = ErrorManager.getUserFriendlyMessage.bind(ErrorManager);
export const logError = ErrorManager.logError.bind(ErrorManager);
export const notifyUser = ErrorManager.notifyUser.bind(ErrorManager);
export const reportError = ErrorManager.reportError.bind(ErrorManager);
export const retryOperation = ErrorManager.retryOperation.bind(ErrorManager);
export const getErrorStats = ErrorManager.getErrorStats.bind(ErrorManager);
export const clearErrorQueue = ErrorManager.clearErrorQueue.bind(ErrorManager);
export const withErrorHandling = ErrorManager.withErrorHandling.bind(ErrorManager);