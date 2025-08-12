import { useState, useCallback } from 'react';
import { ErrorManager } from '@/lib/error-manager';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ApiStateActions<T> {
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  execute: <R>(
    apiCall: () => Promise<R>,
    options?: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
      transform?: (data: R) => T;
    }
  ) => Promise<R | null>;
}

export function useApiState<T>(
  initialData: T | null = null
): [ApiState<T>, ApiStateActions<T>] {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  const execute = useCallback(async <R>(
    apiCall: () => Promise<R>,
    options?: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
      transform?: (data: R) => T;
    }
  ): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiCall();

      // Transform data if transformer provided
      const transformedData = options?.transform ? options.transform(result) : (result as unknown as T);
      setData(transformedData);

      // Call success callback
      options?.onSuccess?.(result);

      return result;
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Unknown API error');
      
      // Log error
      ErrorManager.logError(errorInstance, {
        component: 'useApiState',
        action: 'execute'
      });

      // Set error state
      setError(errorInstance.message);

      // Call error callback
      options?.onError?.(errorInstance);

      return null;
    } finally {
      setLoading(false);
    }
  }, [setData, setError, setLoading]);

  const actions: ApiStateActions<T> = {
    setData,
    setLoading,
    setError,
    reset,
    execute,
  };

  return [state, actions];
}

// Specialized hook for form submissions
export function useFormSubmission<TData, TResult = TData>() {
  const [state, actions] = useApiState<TResult>();

  const submit = useCallback(async (
    data: TData,
    submitFn: (data: TData) => Promise<TResult>,
    options?: {
      onSuccess?: (result: TResult) => void;
      onError?: (error: Error) => void;
      validate?: (data: TData) => string | null;
    }
  ) => {
    // Validate data if validator provided
    if (options?.validate) {
      const validationError = options.validate(data);
      if (validationError) {
        actions.setError(validationError);
        return null;
      }
    }

    return actions.execute(() => submitFn(data), {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    });
  }, [actions]);

  return {
    ...state,
    submit,
    reset: actions.reset,
  };
}

// Hook for paginated data
export function usePaginatedApiState<T>(initialData: T[] = []) {
  const [state, actions] = useApiState<T[]>(initialData);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  });

  const loadMore = useCallback(async (
    loadFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>
  ) => {
    if (state.loading || !pagination.hasMore) return;

    const result = await actions.execute(
      () => loadFn(pagination.page, pagination.limit),
      {
        transform: (result) => {
          const currentData = state.data || [];
          return [...currentData, ...result.data];
        },
        onSuccess: (result) => {
          setPagination(prev => ({
            ...prev,
            page: prev.page + 1,
            total: result.total,
            hasMore: (state.data?.length || 0) + result.data.length < result.total,
          }));
        },
      }
    );

    return result;
  }, [state.loading, state.data, pagination, actions]);

  const reset = useCallback(() => {
    actions.reset();
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true,
    });
  }, [actions]);

  return {
    ...state,
    pagination,
    loadMore,
    reset,
  };
}