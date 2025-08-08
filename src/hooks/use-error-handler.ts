/**
 * Custom Hook: useErrorHandler
 * 
 * این هوک مدیریت خطاها را در کامپوننت‌ها فراهم می‌کند و شامل:
 * - مدیریت وضعیت loading
 * - مدیریت خطاهای عملیات‌های async
 * - قابلیت retry برای عملیات‌های ناموفق
 * - اطلاع‌رسانی به کاربر
 */

import { useState, useCallback, useEffect, createElement } from 'react';
import { 
  ErrorManager, 
  ErrorType, 
  ErrorContext
} from '@/lib/error-manager';

export interface ErrorHandlerState {
  isLoading: boolean;
  error: Error | null;
  errorType: ErrorType | null;
  errorMessage: string;
  retryCount: number;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  showToast?: boolean;
  customErrorMessage?: string;
  onError?: (error: Error) => void;
  onRetry?: (retryCount: number) => void;
}

export function useErrorHandler(
  initialError: Error | null = null,
  options: ErrorHandlerOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showToast = true,
    customErrorMessage,
    onError,
    onRetry
  } = options;

  const [state, setState] = useState<ErrorHandlerState>({
    isLoading: false,
    error: initialError,
    errorType: initialError ? ErrorManager.getErrorType(initialError) : null,
    errorMessage: initialError ? ErrorManager.getUserFriendlyMessage(initialError) : '',
    retryCount: 0
  });

  const [retryOperation, setRetryOperation] = useState<{
    operation: () => Promise<any>;
    context?: Partial<ErrorContext>;
    retryCount: number;
  } | null>(null);

  /**
   * تنظیم خطا
   */
  const setError = useCallback((error: Error, context?: Partial<ErrorContext>) => {
    const errorType = ErrorManager.getErrorType(error);
    const errorMessage = customErrorMessage || ErrorManager.getUserFriendlyMessage(error);

    setState(prev => ({
      ...prev,
      error,
      errorType,
      errorMessage,
      retryCount: 0
    }));

    // لاگ خطا
    ErrorManager.logError(error, context);

    // نمایش به کاربر
    if (showToast) {
      ErrorManager.notifyUser(errorMessage, 'error');
    }

    // فراخوانی callback سفارشی
    onError?.(error);
  }, [showToast, customErrorMessage, onError]);

  /**
   * پاک کردن خطا
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      errorType: null,
      errorMessage: '',
      retryCount: 0
    }));
  }, []);

  /**
   * شروع عملیات async با مدیریت خطا
   */
  const executeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await operation();
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const customError = error as Error;
      setError(customError, context);
      setState(prev => ({ ...prev, isLoading: false }));
      throw customError;
    }
  }, [setError]);

  /**
   * تلاش مجدد برای عملیات
   */
  const retry = useCallback(async () => {
    if (!retryOperation || state.retryCount >= maxRetries) {
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      retryCount: prev.retryCount + 1
    }));

    // فراخوانی callback تلاش مجدد
    onRetry?.(state.retryCount + 1);

    try {
      // استفاده از ErrorManager.retryOperation با exponential backoff
      const result = await ErrorManager.retryOperation(
        retryOperation.operation,
        maxRetries - state.retryCount,
        retryDelay * Math.pow(2, state.retryCount)
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        retryCount: 0
      }));

      return result;
    } catch (error) {
      const customError = error as Error;
      setError(customError, { action: 'retry', metadata: { attempt: state.retryCount + 1 } });
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
      throw customError;
    }
  }, [retryOperation, state.retryCount, maxRetries, retryDelay, setError, onRetry]);

  /**
   * تنظیم عملیات برای تلاش مجدد
   */
  const setRetryableOperation = useCallback((operation: () => Promise<any>) => {
    setRetryOperation({
      operation,
      retryCount: 0
    });
  }, []);

  /**
   * ایجاد خطای سفارشی
   */
  const createError = useCallback((
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: Partial<ErrorContext>
  ): Error => {
    return ErrorManager.createCustomError(message, type, context);
  }, []);

  /**
   * بررسی آیا می‌توان عملیات را تلاش مجدد کرد
   */
  const canRetry = state.retryCount < maxRetries && !!retryOperation;

  /**
   * اثر جانبی برای پاک خودکار خطاها در صورت تغییر مسیر
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.error) {
        ErrorManager.reportError(state.error, { 
          action: 'before_unload',
          component: 'useErrorHandler',
          metadata: { retryCount: state.retryCount }
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.error, state.retryCount]);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    errorType: state.errorType,
    errorMessage: state.errorMessage,
    retryCount: state.retryCount,
    canRetry,
    
    // Actions
    setError,
    clearError,
    executeAsync,
    retry,
    setRetryableOperation,
    createError
  };
}

/**
 * Higher Order Component برای مدیریت خطا در کامپوننت‌ها
 */
export function withErrorHandler<P extends object>(
  Component: React.ComponentType<P>,
  options: ErrorHandlerOptions = {}
) {
  return function WrappedComponent(props: P) {
    const errorHandler = useErrorHandler(null, options);

    const componentProps = {
      ...props,
      errorHandler
    } as any;

    return createElement(Component, componentProps);
  };
}

/**
 * Hook برای مدیریت خطاهای شبکه
 */
export function useNetworkErrorHandler() {
  const { setError, createError } = useErrorHandler();

  const handleNetworkError = useCallback((error: Error | Event) => {
    let errorMessage = 'خطای شبکه: اتصال اینترنت خود را بررسی کنید';
    
    if (error instanceof Error) {
      if (error.message.includes('NetworkError')) {
        errorMessage = 'خطای شبکه: نمی‌توان به سرور متصل شد';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'درخواست منقضی شد: اتصال اینترنت شما کند است';
      }
    }

    const networkError = createError(errorMessage, ErrorType.NETWORK, {
      action: 'network_error'
    });

    setError(networkError);
  }, [setError, createError]);

  return { handleNetworkError };
}

/**
 * Hook برای مدیریت خطاهای احراز هویت
 */
export function useAuthErrorHandler() {
  const { setError, createError } = useErrorHandler();

  const handleAuthError = useCallback((error: Error | string) => {
    let errorMessage = 'خطای احراز هویت: لطفاً دوباره وارد شوید';
    
    if (typeof error === 'string') {
      if (error.includes('unauthorized')) {
        errorMessage = 'شما دسترسی لازم را ندارید';
      } else if (error.includes('forbidden')) {
        errorMessage = 'دسترسی شما غیرفعال شده است';
      }
    } else if (error instanceof Error) {
      if (error.message.includes('jwt')) {
        errorMessage = 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید';
      }
    }

    const authError = createError(errorMessage, ErrorType.AUTH, {
      action: 'auth_error'
    });

    setError(authError);
  }, [setError, createError]);

  return { handleAuthError };
}

/**
 * Hook برای مدیریت خطاهای اعتبارسنجی
 */
export function useValidationErrorHandler() {
  const { setError, createError } = useErrorHandler();

  const handleValidationError = useCallback((field: string, message: string) => {
    const validationError = createError(
      `فیلد ${field}: ${message}`,
      ErrorType.VALIDATION,
      { action: 'validation_error', metadata: { field } }
    );

    setError(validationError);
  }, [setError, createError]);

  return { handleValidationError };
}