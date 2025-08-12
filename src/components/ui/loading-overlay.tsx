import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  /**
   * Whether the loading overlay is visible
   */
  isLoading: boolean;
  
  /**
   * Loading message to display
   */
  message?: string;
  
  /**
   * Size of the spinner
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether to show a backdrop
   */
  backdrop?: boolean;
  
  /**
   * Custom spinner component
   */
  spinner?: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Children to render when not loading
   */
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingOverlay({
  isLoading,
  message,
  size = 'md',
  backdrop = true,
  spinner,
  className,
  children,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  const defaultSpinner = (
    <Loader2 className={cn('animate-spin', sizeClasses[size])} />
  );

  return (
    <div className={cn('relative', className)}>
      {children}
      
      {/* Loading overlay */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          backdrop && 'bg-background/80 backdrop-blur-sm',
          'z-50'
        )}
      >
        <div className="flex flex-col items-center space-y-2">
          {spinner || defaultSpinner}
          {message && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline loading component for smaller areas
export function InlineLoading({
  message = 'در حال بارگذاری...',
  size = 'sm',
  className,
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-2 text-muted-foreground', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      <span className="text-sm">{message}</span>
    </div>
  );
}

// Full page loading component
export function PageLoading({
  message = 'در حال بارگذاری...',
  size = 'lg',
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        <p className="text-muted-foreground animate-pulse">{message}</p>
      </div>
    </div>
  );
}

// Button loading state
export function ButtonLoading({
  children,
  isLoading,
  loadingText,
  size = 'sm',
  ...props
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className={cn('animate-spin', sizeClasses[size])} />
          {loadingText && <span>{loadingText}</span>}
        </div>
      ) : (
        children
      )}
    </button>
  );
}