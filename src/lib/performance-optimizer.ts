/**
 * Enhanced Performance Optimizer for PRISM Contacts
 * 
 * این بهینه‌ساز عملکرد پیشرفته برای PRISM Contacts طراحی شده و ویژگی‌های زیر را دارد:
 * - بهینه‌سازی حافظه
 * - کش‌گذاری هوشمند
 - مدیریت رویدادها
 - بهینه‌سازی رندر
 - مدیریت منابع
 - تحلیل عملکرد
 - بهینه‌سازی شبکه
 - مدیریت وضعیت
 */

import { logger } from './logger';

export interface PerformanceConfig {
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
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageOperationTime: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
  virtualizedItems: number;
  memoizedFunctions: number;
  debouncedCalls: number;
  throttledCalls: number;
  lastOptimization: string;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number;
  hits: number;
}

export interface MemoizedFunction {
  fn: Function;
  lastArgs: any[];
  lastResult: any;
  lastTimestamp: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private cacheStore: Map<string, CacheEntry> = new Map();
  private memoizedFunctions: Map<string, MemoizedFunction> = new Map();
  private debouncedFunctions: Map<string, Function> = new Map();
  private throttledFunctions: Map<string, Function> = new Map();
  private isInitialized = false;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;

  private defaultConfig: PerformanceConfig = {
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
  };

  private constructor(config?: Partial<PerformanceConfig>) {
    this.config = this.mergeConfig(this.defaultConfig, config);
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(config?: Partial<PerformanceConfig>): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer(config);
    }
    return PerformanceOptimizer.instance;
  }

  private mergeConfig(defaultConfig: PerformanceConfig, userConfig?: Partial<PerformanceConfig>): PerformanceConfig {
    if (!userConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...userConfig
    };
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      totalOperations: 0,
      averageOperationTime: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0,
      virtualizedItems: 0,
      memoizedFunctions: 0,
      debouncedCalls: 0,
      throttledCalls: 0,
      lastOptimization: new Date().toISOString()
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.info('PerformanceOptimizer', 'Initializing performance optimizer...');

      // Start memory monitoring
      this.startMemoryMonitoring();

      // Start cache cleanup
      this.startCacheCleanup();

      // Initialize virtualization if enabled
      if (this.config.enableVirtualization) {
        this.initializeVirtualization();
      }

      // Initialize lazy loading if enabled
      if (this.config.enableLazyLoading) {
        this.initializeLazyLoading();
      }

      // Initialize prefetching if enabled
      if (this.config.enablePrefetching) {
        this.initializePrefetching();
      }

      this.isInitialized = true;
      this.info('PerformanceOptimizer', 'Performance optimizer initialized successfully');
    } catch (error) {
      logger.error('PerformanceOptimizer', 'Failed to initialize performance optimizer', error as Error);
      throw error;
    }
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitorInterval = setInterval(() => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        if (memory) {
          const used = memory.usedJSHeapSize;
          const total = memory.totalJSHeapSize;
          const memoryUsage = used / total;

          this.metrics.memoryUsage = memoryUsage;

          // Check memory threshold
          if (memoryUsage > this.config.memoryThreshold) {
            this.performMemoryOptimization();
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache();
    }, 60000); // Clean up every minute
  }

  private initializeVirtualization(): void {
    // This would typically integrate with virtualization libraries
    // For now, we'll provide a simple implementation
    this.info('PerformanceOptimizer', 'Virtualization initialized');
  }

  private initializeLazyLoading(): void {
    if (typeof window !== 'undefined') {
      // Intersection Observer for lazy loading
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const lazyContent = element.dataset.lazyContent;
            
            if (lazyContent) {
              element.innerHTML = lazyContent;
              observer.unobserve(element);
            }
          }
        });
      });

      // Observe elements with lazy-loading attribute
      document.addEventListener('DOMContentLoaded', () => {
        const lazyElements = document.querySelectorAll('[data-lazy]');
        lazyElements.forEach(element => observer.observe(element));
      });
    }
  }

  private initializePrefetching(): void {
    if (typeof window !== 'undefined') {
      // Prefetch resources when user hovers over links
      document.addEventListener('mouseover', (e) => {
        const link = (e.target as HTMLElement).closest('a');
        if (link && link.href) {
          const prefetchLink = document.createElement('link');
          prefetchLink.rel = 'prefetch';
          prefetchLink.href = link.href;
          document.head.appendChild(prefetchLink);
        }
      }, { passive: true });
    }
  }

  private performMemoryOptimization(): void {
    try {
      // Clean up old cache entries
      this.cleanupCache();

      // Clean up unused memoized functions
      this.cleanupMemoizedFunctions();

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      this.info('PerformanceOptimizer', 'Memory optimization performed');
    } catch (error) {
      logger.error('PerformanceOptimizer', 'Failed to perform memory optimization', error as Error);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cacheStore) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cacheStore.delete(key);
        cleaned++;
      }
    }

    // If cache is still too large, remove oldest entries
    if (this.cacheStore.size > this.config.cacheSize) {
      const entries = Array.from(this.cacheStore.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cacheStore.size - this.config.cacheSize);
      toRemove.forEach(([key]) => this.cacheStore.delete(key));
      cleaned += toRemove.length;
    }

    if (cleaned > 0) {
      this.info('PerformanceOptimizer', 'Cache cleanup completed', { cleaned });
    }
  }

  private cleanupMemoizedFunctions(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [key, memoized] of this.memoizedFunctions) {
      if (now - memoized.lastTimestamp > staleThreshold) {
        this.memoizedFunctions.delete(key);
      }
    }
  }

  // Public methods
  public cache<T>(key: string, value: T, ttl?: number): void {
    if (!this.config.enableCaching) {
      return;
    }

    this.cacheStore.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });

    this.updateMetrics({
      cacheMisses: this.metrics.cacheMisses + 1
    });
  }

  public getCache<T>(key: string): T | null {
    if (!this.config.enableCaching) {
      return null;
    }

    const entry = this.cacheStore.get(key);
    if (!entry) {
      this.updateMetrics({
        cacheMisses: this.metrics.cacheMisses + 1
      });
      return null;
    }

    // Check if entry is expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cacheStore.delete(key);
      this.updateMetrics({
        cacheMisses: this.metrics.cacheMisses + 1
      });
      return null;
    }

    // Update hit count
    entry.hits++;
    this.updateMetrics({
      cacheHits: this.metrics.cacheHits + 1
    });

    return entry.value;
  }

  public memoize<T extends (...args: any[]) => any>(fn: T, keyGenerator?: (...args: any[]) => string): T {
    if (!this.config.enableMemoization) {
      return fn;
    }

    const fnKey = fn.name || 'anonymous';
    const memoized: MemoizedFunction = {
      fn,
      lastArgs: [],
      lastResult: null,
      lastTimestamp: 0
    };

    this.memoizedFunctions.set(fnKey, memoized);
    this.updateMetrics({
      memoizedFunctions: this.memoizedFunctions.size
    });

    return ((...args: any[]) => {
      const key = keyGenerator ? keyGenerator(...args) : fnKey;
      const now = Date.now();

      // Check if we can use the cached result
      if (now - memoized.lastTimestamp < 1000 && // Cache for 1 second
          memoized.lastArgs.length === args.length &&
          memoized.lastArgs.every((arg, index) => arg === args[index])) {
        return memoized.lastResult;
      }

      // Execute and cache the result
      const result = fn(...args);
      memoized.lastArgs = args;
      memoized.lastResult = result;
      memoized.lastTimestamp = now;

      return result;
    }) as T;
  }

  public debounce<T extends (...args: any[]) => any>(fn: T, delay: number = this.config.debounceDelay): T {
    if (!this.config.enableDebouncing) {
      return fn;
    }

    const fnKey = fn.name || 'anonymous';
    let timeoutId: NodeJS.Timeout;

    const debounced = ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
        this.updateMetrics({
          debouncedCalls: this.metrics.debouncedCalls + 1
        });
      }, delay);
    }) as T;

    this.debouncedFunctions.set(fnKey, debounced);
    return debounced;
  }

  public throttle<T extends (...args: any[]) => any>(fn: T, delay: number = this.config.throttleDelay): T {
    if (!this.config.enableThrottling) {
      return fn;
    }

    const fnKey = fn.name || 'anonymous';
    let lastCall = 0;

    const throttled = ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        fn(...args);
        lastCall = now;
        this.updateMetrics({
          throttledCalls: this.metrics.throttledCalls + 1
        });
      }
    }) as T;

    this.throttledFunctions.set(fnKey, throttled);
    return throttled;
  }

  public measure<T>(name: string, operation: () => T, component?: string): T {
    const start = performance.now();
    const result = operation();
    const end = performance.now();

    const duration = end - start;
    this.updateMetrics({
      totalOperations: this.metrics.totalOperations + 1,
      averageOperationTime: (this.metrics.averageOperationTime * (this.metrics.totalOperations - 1) + duration) / this.metrics.totalOperations
    });

    this.debug('PerformanceOptimizer', `Performance: ${name}`, { duration, component });

    return result;
  }

  public async measureAsync<T>(name: string, operation: () => Promise<T>, component?: string): Promise<T> {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();

    const duration = end - start;
    this.updateMetrics({
      totalOperations: this.metrics.totalOperations + 1,
      averageOperationTime: (this.metrics.averageOperationTime * (this.metrics.totalOperations - 1) + duration) / this.metrics.totalOperations
    });

    this.debug('PerformanceOptimizer', `Performance: ${name}`, { duration, component });

    return result;
  }

  public optimizeVirtualization<T>(items: T[], itemHeight: number, containerHeight: number): {
    visibleItems: T[];
    startIndex: number;
    endIndex: number;
  } {
    if (!this.config.enableVirtualization) {
      return {
        visibleItems: items,
        startIndex: 0,
        endIndex: items.length - 1
      };
    }

    const containerVisibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = 0; // This would be calculated based on scroll position
    const endIndex = Math.min(startIndex + containerVisibleCount + 5, items.length - 1); // Buffer of 5 items

    this.updateMetrics({
      virtualizedItems: endIndex - startIndex + 1
    });

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex
    };
  }

  public getStatus(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public configure(config: Partial<PerformanceConfig>): void {
    this.config = this.mergeConfig(this.config, config);
    this.info('PerformanceOptimizer', 'Performance configuration updated', { config: this.config });
  }

  private updateMetrics(updates: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...updates };
  }

  private info(component: string, message: string, data?: any): void {
    logger.info(component, message, data);
  }

  private debug(component: string, message: string, data?: any): void {
    logger.debug(component, message, data);
  }

  public async cleanup(): Promise<void> {
    try {
      if (this.memoryMonitorInterval) {
        clearInterval(this.memoryMonitorInterval);
      }

      this.cacheStore.clear();
      this.memoizedFunctions.clear();
      this.debouncedFunctions.clear();
      this.throttledFunctions.clear();

      this.info('PerformanceOptimizer', 'Performance optimizer cleanup completed');
    } catch (error) {
      logger.error('PerformanceOptimizer', 'Failed to cleanup performance optimizer', error as Error);
    }
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
export const initializePerformance = PerformanceOptimizer.prototype.initialize.bind(PerformanceOptimizer.getInstance());
export const configurePerformance = PerformanceOptimizer.prototype.configure.bind(PerformanceOptimizer.getInstance());
export const getStatus = PerformanceOptimizer.prototype.getStatus.bind(PerformanceOptimizer.getInstance());
export const cacheData = PerformanceOptimizer.prototype.cache.bind(PerformanceOptimizer.getInstance());
export const getCache = PerformanceOptimizer.prototype.getCache.bind(PerformanceOptimizer.getInstance());
export const memoize = PerformanceOptimizer.prototype.memoize.bind(PerformanceOptimizer.getInstance());
export const debounce = PerformanceOptimizer.prototype.debounce.bind(PerformanceOptimizer.getInstance());
export const throttle = PerformanceOptimizer.prototype.throttle.bind(PerformanceOptimizer.getInstance());
export const measure = PerformanceOptimizer.prototype.measure.bind(PerformanceOptimizer.getInstance());
export const measureAsync = PerformanceOptimizer.prototype.measureAsync.bind(PerformanceOptimizer.getInstance());
export const optimizeVirtualization = PerformanceOptimizer.prototype.optimizeVirtualization.bind(PerformanceOptimizer.getInstance());
export const cleanupPerformance = PerformanceOptimizer.prototype.cleanup.bind(PerformanceOptimizer.getInstance());