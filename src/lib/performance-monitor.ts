/**
 * Performance Monitor - سیستم مانیتورینگ عملکرد PRISM Contacts
 * 
 * این ماژول مانیتورینگ عملکرد را فراهم می‌کند و شامل:
 * - اندازه‌گیری زمان اجرای توابع
 * - مانیتورینگ منابع سیستم
 * - گزارش‌دهی عملکرد
 * - هشدار در صورت عملکرد ضعیف
 */

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  component?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  enableReporting: boolean;
  reportInterval: number; // milliseconds
  slowOperationThreshold: number; // milliseconds
  maxMetrics: number;
  reportEndpoint?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private isReporting = false;
  private reportIntervalId: NodeJS.Timeout | null = null;

  private defaultConfig: PerformanceConfig = {
    enableMonitoring: true,
    enableReporting: false,
    reportInterval: 60000, // 1 minute
    slowOperationThreshold: 1000, // 1 second
    maxMetrics: 1000
  };

  private constructor(config?: Partial<PerformanceConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.startMonitoring();
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * تنظیم پیکربندی مانیتورینگ عملکرد
   */
  public configure(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableReporting) {
      this.startReporting();
    } else {
      this.stopReporting();
    }
  }

  /**
   * شروع مانیتورینگ
   */
  private startMonitoring(): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    // مانیتورینگ منابع سیستم
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observePerformanceEntries();
    }

    // مانیتورینگ حافظه
    if (typeof window !== 'undefined' && 'performance' in window) {
      this.monitorMemory();
    }
  }

  /**
   * شروع گزارش‌دهی
   */
  private startReporting(): void {
    if (this.reportIntervalId) {
      return;
    }

    this.reportIntervalId = setInterval(() => {
      this.reportMetrics();
    }, this.config.reportInterval);
  }

  /**
   * توقف گزارش‌دهی
   */
  private stopReporting(): void {
    if (this.reportIntervalId) {
      clearInterval(this.reportIntervalId);
      this.reportIntervalId = null;
    }
  }

  /**
   * شروع اندازه‌گیری عملکرد
   */
  public start(name: string, component?: string): string {
    if (!this.config.enableMonitoring) {
      return '';
    }

    const id = `${component ? `${component}:` : ''}${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timers.set(id, performance.now());
    return id;
  }

  /**
   * پایان اندازه‌گیری عملکرد
   */
  public end(id: string, metadata?: Record<string, any>): void {
    if (!this.config.enableMonitoring) {
      return;
    }

    const startTime = this.timers.get(id);
    if (!startTime) {
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(id);

    const [component, name] = id.split(':');
    const metric: PerformanceMetric = {
      name: name || id,
      duration,
      timestamp: new Date().toISOString(),
      component: component || undefined,
      metadata
    };

    this.addMetric(metric);

    // هشدار در صورت عملکرد ضعیف
    if (duration > this.config.slowOperationThreshold) {
      this.warnSlowOperation(metric);
    }
  }

  /**
   * اندازه‌گیری عملکرد یک تابع
   */
  public measure<T>(
    name: string,
    fn: () => T,
    component?: string,
    metadata?: Record<string, any>
  ): T {
    const id = this.start(name, component);
    try {
      const result = fn();
      this.end(id, metadata);
      return result;
    } catch (error) {
      this.end(id, { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * اندازه‌گیری عملکرد یک تابع async
   */
  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    component?: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.start(name, component);
    try {
      const result = await fn();
      this.end(id, metadata);
      return result;
    } catch (error) {
      this.end(id, { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * افزودن معیار به لیست
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // نگه داشتن فقط آخرین معیارها
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics.shift();
    }

    // ذخیره در localStorage برای تحلیل‌های آینده
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
        stored.push(metric);
        
        if (stored.length > this.config.maxMetrics) {
          stored.shift();
        }
        
        localStorage.setItem('performance_metrics', JSON.stringify(stored));
      } catch (error) {
        console.error('Failed to store performance metric:', error);
      }
    }
  }

  /**
   * مشاهده ورودی‌های عملکرد
   */
  private observePerformanceEntries(): void {
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            const metric: PerformanceMetric = {
              name: entry.name,
              duration: entry.duration,
              timestamp: new Date(entry.startTime).toISOString(),
              metadata: {
                entryType: entry.entryType,
                startTime: entry.startTime
              }
            };
            this.addMetric(metric);
          }
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (error) {
      console.error('Failed to observe performance entries:', error);
    }
  }

  /**
   * مانیتورینگ حافظه
   */
  private monitorMemory(): void {
    if (!('performance' in window) || !('memory' in performance)) {
      return;
    }

    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const metric: PerformanceMetric = {
          name: 'memory_usage',
          duration: 0,
          timestamp: new Date().toISOString(),
          metadata: {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          }
        };
        this.addMetric(metric);
      }
    }, 5000); // هر 5 ثانیه
  }

  /**
   * هشدار در مورد عملکرد ضعیف
   */
  private warnSlowOperation(metric: PerformanceMetric): void {
    console.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`, {
      component: metric.component,
      metadata: metric.metadata
    });

    // ارسال رویداد برای نمایش در UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-warning', {
        detail: metric
      }));
    }
  }

  /**
   * گزارش‌دهی معیارها
   */
  private async reportMetrics(): Promise<void> {
    if (this.isReporting || !this.config.reportEndpoint) {
      return;
    }

    this.isReporting = true;

    try {
      const metrics = this.getMetrics();
      if (metrics.length === 0) {
        return;
      }

      const response = await fetch(this.config.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // پاک کردن معیارهای گزارش شده
      this.clearMetrics();
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * دریافت معیارهای ذخیره شده
   */
  public getMetrics(): PerformanceMetric[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('performance_metrics');
        if (stored) {
          const metrics = JSON.parse(stored);
          // اضافه کردن معیارهای فعلی
          return [...metrics, ...this.metrics];
        }
      } catch (error) {
        console.error('Failed to get stored metrics:', error);
      }
    }
    return [...this.metrics];
  }

  /**
   * پاک کردن معیارها
   */
  public clearMetrics(): void {
    this.metrics = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('performance_metrics');
    }
  }

  /**
   * دریافت آمار عملکرد
   */
  public getStats(): {
    totalMetrics: number;
    averageDuration: number;
    slowOperations: number;
    byComponent: Record<string, { count: number; averageDuration: number }>;
    byName: Record<string, { count: number; averageDuration: number }>;
  } {
    const metrics = this.getMetrics();
    const stats = {
      totalMetrics: metrics.length,
      averageDuration: 0,
      slowOperations: 0,
      byComponent: {} as Record<string, { count: number; averageDuration: number }>,
      byName: {} as Record<string, { count: number; averageDuration: number }>
    };

    if (metrics.length === 0) {
      return stats;
    }

    let totalDuration = 0;
    metrics.forEach(metric => {
      totalDuration += metric.duration;

      // شمارش عملیات‌های کند
      if (metric.duration > this.config.slowOperationThreshold) {
        stats.slowOperations++;
      }

      // آمار بر اساس کامپوننت
      if (metric.component) {
        if (!stats.byComponent[metric.component]) {
          stats.byComponent[metric.component] = { count: 0, averageDuration: 0 };
        }
        stats.byComponent[metric.component].count++;
        stats.byComponent[metric.component].averageDuration += metric.duration;
      }

      // آمار بر اساس نام
      if (!stats.byName[metric.name]) {
        stats.byName[metric.name] = { count: 0, averageDuration: 0 };
      }
      stats.byName[metric.name].count++;
      stats.byName[metric.name].averageDuration += metric.duration;
    });

    stats.averageDuration = totalDuration / metrics.length;

    // محاسبه میانگین برای هر گروه
    Object.keys(stats.byComponent).forEach(component => {
      const compStats = stats.byComponent[component];
      compStats.averageDuration = compStats.averageDuration / compStats.count;
    });

    Object.keys(stats.byName).forEach(name => {
      const nameStats = stats.byName[name];
      nameStats.averageDuration = nameStats.averageDuration / nameStats.count;
    });

    return stats;
  }

  /**
   * ایجاد گزارش عملکرد
   */
  public generateReport(): string {
    const stats = this.getStats();
    const metrics = this.getMetrics();

    return `
Performance Report
==================

Generated: ${new Date().toISOString()}
Total Metrics: ${stats.totalMetrics}
Average Duration: ${stats.averageDuration.toFixed(2)}ms
Slow Operations: ${stats.slowOperations}

By Component:
${Object.entries(stats.byComponent)
  .map(([component, data]) => 
    `  ${component}: ${data.count} operations, ${data.averageDuration.toFixed(2)}ms average`
  )
  .join('\n')}

By Operation Name:
${Object.entries(stats.byName)
  .map(([name, data]) => 
    `  ${name}: ${data.count} times, ${data.averageDuration.toFixed(2)}ms average`
  )
  .join('\n')}

Recent Slow Operations:
${metrics
  .filter(m => m.duration > this.config.slowOperationThreshold)
  .slice(0, 10)
  .map(m => `  ${m.name}: ${m.duration.toFixed(2)}ms (${m.component || 'N/A'})`)
  .join('\n')}
    `.trim();
  }
}

// export convenience functions
export const performanceMonitor = PerformanceMonitor.getInstance();
export const configurePerformanceMonitor = PerformanceMonitor.prototype.configure.bind(PerformanceMonitor.getInstance());
export const startMeasure = PerformanceMonitor.prototype.start.bind(PerformanceMonitor.getInstance());
export const endMeasure = PerformanceMonitor.prototype.end.bind(PerformanceMonitor.getInstance());
export const measure = PerformanceMonitor.prototype.measure.bind(PerformanceMonitor.getInstance());
export const measureAsync = PerformanceMonitor.prototype.measureAsync.bind(PerformanceMonitor.getInstance());