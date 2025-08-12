"use client";

import React, { ReactNode } from 'react';
import { useForm, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ErrorManager } from '@/lib/error-manager';
import { Loader2, X } from 'lucide-react';

export interface BaseFormDialogProps<T extends FieldValues> {
  // Dialog props
  trigger?: ReactNode;
  title: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Form props
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  
  // UI props
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Content
  children: (form: UseFormReturn<T>) => ReactNode;
  
  // Advanced options
  closeOnSubmit?: boolean;
  resetOnSubmit?: boolean;
  validateOnMount?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function BaseFormDialog<T extends FieldValues>({
  trigger,
  title,
  description,
  open,
  onOpenChange,
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  submitText = 'ذخیره',
  cancelText = 'لغو',
  loading = false,
  disabled = false,
  size = 'md',
  children,
  closeOnSubmit = true,
  resetOnSubmit = false,
  validateOnMount = false,
}: BaseFormDialogProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: validateOnMount ? 'onChange' : 'onSubmit',
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValid, errors },
    reset,
  } = form;

  const handleFormSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      
      if (resetOnSubmit) {
        reset();
      }
      
      if (closeOnSubmit && onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Form submission failed');
      ErrorManager.logError(errorInstance, {
        component: 'BaseFormDialog',
        action: 'handleFormSubmit',
        metadata: {
          title,
          hasErrors: Object.keys(errors).length > 0,
        }
      });
      
      // Don't close dialog on error
      throw error;
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onOpenChange) {
      onOpenChange(false);
    }
    
    // Reset form on cancel
    reset();
  };

  const isFormLoading = loading || isSubmitting;
  const isFormDisabled = disabled || isFormLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className={sizeClasses[size]}>
        <LoadingOverlay isLoading={isFormLoading} message="در حال پردازش...">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{title}</DialogTitle>
              {onOpenChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isFormLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="py-4">
              {children(form)}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isFormLoading}
              >
                {cancelText}
              </Button>
              
              <Button
                type="submit"
                disabled={isFormDisabled || (!validateOnMount && !isValid)}
              >
                {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitText}
              </Button>
            </DialogFooter>
          </form>
        </LoadingOverlay>
      </DialogContent>
    </Dialog>
  );
}

// Specialized form dialogs
export interface ConfirmationDialogProps {
  trigger?: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmText = 'تأیید',
  cancelText = 'لغو',
  variant = 'default',
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'ConfirmationDialog',
        action: 'handleConfirm'
      });
      throw error;
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      
      <DialogContent className="max-w-md">
        <LoadingOverlay isLoading={loading} message="در حال پردازش...">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            
            <Button
              type="button"
              variant={variant}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmText}
            </Button>
          </DialogFooter>
        </LoadingOverlay>
      </DialogContent>
    </Dialog>
  );
}

// Quick form dialog for simple inputs
export interface QuickFormDialogProps {
  trigger?: ReactNode;
  title: string;
  description?: string;
  inputLabel: string;
  inputPlaceholder?: string;
  inputType?: 'text' | 'email' | 'password' | 'number';
  submitText?: string;
  cancelText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (value: string) => Promise<void> | void;
  onCancel?: () => void;
  validation?: z.ZodString;
  loading?: boolean;
}

export function QuickFormDialog({
  trigger,
  title,
  description,
  inputLabel,
  inputPlaceholder,
  inputType = 'text',
  submitText = 'ذخیره',
  cancelText = 'لغو',
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  validation = z.string().min(1, 'این فیلد الزامی است'),
  loading = false,
}: QuickFormDialogProps) {
  const schema = z.object({
    value: validation,
  });

  return (
    <BaseFormDialog
      trigger={trigger}
      title={title}
      description={description}
      open={open}
      onOpenChange={onOpenChange}
      schema={schema}
      onSubmit={async (data) => onSubmit(data.value)}
      onCancel={onCancel}
      submitText={submitText}
      cancelText={cancelText}
      loading={loading}
      size="sm"
    >
      {(form) => (
        <div className="space-y-2">
          <label className="text-sm font-medium">{inputLabel}</label>
          <input
            type={inputType}
            placeholder={inputPlaceholder}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            {...form.register('value')}
          />
          {form.formState.errors.value && (
            <p className="text-sm text-destructive">
              {form.formState.errors.value.message}
            </p>
          )}
        </div>
      )}
    </BaseFormDialog>
  );
}