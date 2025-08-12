"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Centralized loading state types
export type LoadingState = 
  | 'idle' 
  | 'loading' 
  | 'success' 
  | 'error' 
  | 'retrying'
  | 'timeout';

export interface LoadingConfig {
  state: LoadingState;
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  timeout?: number; // in seconds
  variant?: 'default' | 'minimal' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
}

const stateConfig = {
  idle: {
    icon: null,
    color: 'text-muted-foreground',
    message: 'آماده',
  },
  loading: {
    icon: Loader2,
    color: 'text-primary',
    message: 'در حال بارگذاری...',
    animate: 'animate-spin',
  },
  success: {
    icon: null,
    color: 'text-green-600',
    message: 'تکمیل شد',
  },
  error: {
    icon: AlertCircle,
    color: 'text-destructive',
    message: 'خطا رخ داده است',
  },
  retrying: {
    icon: RefreshCw,
    color: 'text-orange-500',
    message: 'در حال تلاش مجدد...',
    animate: 'animate-spin',
  },
  timeout: {
    icon: Clock,
    color: 'text-orange-500',
    message: 'زمان انتظار به پایان رسید',
  },
};

const sizeConfig = {
  sm: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    container: 'p-2',
  },
  md: {
    icon: 'h-5 w-5',
    text: 'text-base',
    container: 'p-4',
  },
  lg: {
    icon: 'h-6 w-6',
    text: 'text-lg',
    container: 'p-6',
  },
};

/**
 * Consistent loading component for the entire application
 */
export function ConsistentLoading({
  state,
  message,
  progress,
  showProgress = false,
  showRetry = false,
  onRetry,
  timeout,
  variant = 'default',
  size = 'md',
}: LoadingConfig) {
  const config = stateConfig[state];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const displayMessage = message || config.message;

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className={cn(sizeStyles.icon, config.color)} />
        )}
        <span className={cn(sizeStyles.text, config.color)}>
          {displayMessage}
        </span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('flex flex-col items-center text-center space-y-4', sizeStyles.container)}>
        {Icon && (
          <Icon className={cn(sizeStyles.icon, config.color)} />
        )}
        
        <div className="space-y-2">
          <p className={cn(sizeStyles.text, config.color, 'font-medium')}>
            {displayMessage}
          </p>
          
          {showProgress && typeof progress === 'number' && (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>پیشرفت</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
          
          {timeout && state === 'loading' && (
            <p className="text-xs text-muted-foreground">
              حداکثر انتظار: {timeout} ثانیه
            </p>
          )}
        </div>

        {showRetry && (state === 'error' || state === 'timeout') && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            تلاش مجدد
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <Icon className={cn(sizeStyles.icon, config.color)} />
      )}
      
      <div className="flex-1">
        <p className={cn(sizeStyles.text, config.color)}>
          {displayMessage}
        </p>
        
        {showProgress && typeof progress === 'number' && (
          <div className="mt-1">
            <div className="w-full bg-secondary rounded-full h-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {showRetry && (state === 'error' || state === 'timeout') && onRetry && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Hook for managing loading states consistently
 */
export function useConsistentLoading(initialState: LoadingState = 'idle') {
  const [state, setState] = React.useState<LoadingState>(initialState);
  const [message, setMessage] = React.useState<string>();
  const [progress, setProgress] = React.useState<number>(0);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const setLoading = React.useCallback((msg?: string, timeoutMs?: number) => {
    setState('loading');
    setMessage(msg);
    setProgress(0);
    
    if (timeoutMs) {
      timeoutRef.current = setTimeout(() => {
        setState('timeout');
      }, timeoutMs);
    }
  }, []);

  const setSuccess = React.useCallback((msg?: string) => {
    setState('success');
    setMessage(msg);
    setProgress(100);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const setError = React.useCallback((msg?: string) => {
    setState('error');
    setMessage(msg);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const setRetrying = React.useCallback((msg?: string) => {
    setState('retrying');
    setMessage(msg);
    setProgress(0);
  }, []);

  const setIdle = React.useCallback(() => {
    setState('idle');
    setMessage(undefined);
    setProgress(0);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const updateProgress = React.useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    message,
    progress,
    setLoading,
    setSuccess,
    setError,
    setRetrying,
    setIdle,
    updateProgress,
    setState,
    setMessage,
  };
}

/**
 * Loading wrapper component
 */
export function LoadingWrapper({
  loading,
  error,
  success,
  children,
  loadingMessage = 'در حال بارگذاری...',
  errorMessage,
  successMessage,
  onRetry,
  className,
}: {
  loading?: boolean;
  error?: string | boolean;
  success?: boolean;
  children: React.ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  successMessage?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const getState = (): LoadingState => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (success) return 'success';
    return 'idle';
  };

  const getMessage = () => {
    if (loading) return loadingMessage;
    if (error) return typeof error === 'string' ? error : errorMessage;
    if (success) return successMessage;
    return undefined;
  };

  const state = getState();
  const message = getMessage();

  if (state === 'idle' || state === 'success') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative', className)}>
      {state === 'loading' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <ConsistentLoading
            state={state}
            message={message}
            variant="detailed"
          />
        </div>
      )}
      
      {state === 'error' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <ConsistentLoading
            state={state}
            message={message}
            variant="detailed"
            showRetry={!!onRetry}
            onRetry={onRetry}
          />
        </div>
      )}
      
      <div className={cn((state === 'loading' || state === 'error') && 'opacity-50 pointer-events-none')}>
        {children}
      </div>
    </div>
  );
}