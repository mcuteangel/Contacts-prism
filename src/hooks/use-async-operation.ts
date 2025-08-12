import { useState, useCallback, useRef, useEffect } from 'react';
import { ErrorManager } from '@/lib/error-manager';

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastExecutedAt: Date | null;
  executionCount: number;
}

export interface AsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  abortOnUnmount?: boolean;
}

/**
 * Advanced hook for managing async operations with retry, timeout, and cancellation
 */
export function useAsyncOperation<T, Args extends any[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const {
    onSuccess,
    onError,
    retries = 0,
    retryDelay = 1000,
    timeout = 30000,
    abortOnUnmount = true,
  } = options;

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    lastExecutedAt: null,
    executionCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortOnUnmount && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [abortOnUnmount]);

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    // Cancel previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isMountedRef.current) return null;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      executionCount: prev.executionCount + 1,
    }));

    let attempt = 0;
    const maxAttempts = retries + 1;

    while (attempt < maxAttempts) {
      try {
        // Set timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeout}ms`));
          }, timeout);
        });

        // Execute the async function
        const operationPromise = asyncFn(...args);

        // Race between operation and timeout
        const result = await Promise.race([operationPromise, timeoutPromise]);

        // Clear timeout on success
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Check if component is still mounted
        if (!isMountedRef.current) return null;

        // Update state on success
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          lastExecutedAt: new Date(),
        }));

        // Call success callback
        onSuccess?.(result);

        return result;

      } catch (error) {
        attempt++;
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        const errorInstance = error instanceof Error ? error : new Error('Unknown async operation error');

        // If aborted, don't retry
        if (signal.aborted) {
          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: 'Operation was cancelled',
            }));
          }
          return null;
        }

        // If this was the last attempt, handle the error
        if (attempt >= maxAttempts) {
          ErrorManager.logError(errorInstance, {
            component: 'useAsyncOperation',
            action: 'execute',
            metadata: {
              attempt,
              maxAttempts,
              args: args.length > 0 ? 'provided' : 'none',
            }
          });

          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorInstance.message,
              lastExecutedAt: new Date(),
            }));
          }

          onError?.(errorInstance);
          return null;
        }

        // Wait before retry
        if (retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }

        // Check if still mounted and not aborted before retrying
        if (!isMountedRef.current || signal.aborted) {
          return null;
        }
      }
    }

    return null;
  }, [asyncFn, onSuccess, onError, retries, retryDelay, timeout]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState(prev => ({
      ...prev,
      loading: false,
      error: 'Operation was cancelled',
    }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({
      data: null,
      loading: false,
      error: null,
      lastExecutedAt: null,
      executionCount: 0,
    });
  }, [cancel]);

  return {
    ...state,
    execute,
    cancel,
    reset,
    isIdle: !state.loading && state.executionCount === 0,
    isSuccess: !state.loading && state.data !== null && !state.error,
    isError: !state.loading && state.error !== null,
  };
}

/**
 * Hook for managing multiple async operations
 */
export function useAsyncOperations<T extends Record<string, (...args: any[]) => Promise<any>>>(
  operations: T,
  globalOptions: AsyncOperationOptions = {}
) {
  const operationHooks = Object.entries(operations).reduce((acc, [key, fn]) => {
    acc[key] = useAsyncOperation(fn, globalOptions);
    return acc;
  }, {} as Record<keyof T, ReturnType<typeof useAsyncOperation>>);

  const executeAll = useCallback(async (args: Record<keyof T, any[]> = {} as any) => {
    const results = await Promise.allSettled(
      Object.entries(operationHooks).map(([key, hook]) => 
        hook.execute(...(args[key] || []))
      )
    );

    return results.reduce((acc, result, index) => {
      const key = Object.keys(operationHooks)[index];
      acc[key] = result.status === 'fulfilled' ? result.value : null;
      return acc;
    }, {} as Record<keyof T, any>);
  }, [operationHooks]);

  const cancelAll = useCallback(() => {
    Object.values(operationHooks).forEach(hook => hook.cancel());
  }, [operationHooks]);

  const resetAll = useCallback(() => {
    Object.values(operationHooks).forEach(hook => hook.reset());
  }, [operationHooks]);

  const isAnyLoading = Object.values(operationHooks).some(hook => hook.loading);
  const hasAnyError = Object.values(operationHooks).some(hook => hook.error);

  return {
    operations: operationHooks,
    executeAll,
    cancelAll,
    resetAll,
    isAnyLoading,
    hasAnyError,
  };
}