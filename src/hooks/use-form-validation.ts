import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationState {
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  touchedFields: Set<string>;
}

export interface FormValidationActions<T> {
  validate: (data: T) => boolean;
  validateField: (field: keyof T, value: any) => boolean;
  setFieldTouched: (field: keyof T) => void;
  setErrors: (errors: ValidationError[]) => void;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>
): [FormValidationState, FormValidationActions<T>] {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  const isValid = useMemo(() => errors.length === 0, [errors]);

  const validate = useCallback((data: T): boolean => {
    try {
      schema.parse(data);
      setErrors([]);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        setErrors(validationErrors);
      }
      return false;
    }
  }, [schema]);

  const validateField = useCallback((field: keyof T, value: any): boolean => {
    try {
      // Create a partial schema for the specific field
      const fieldSchema = schema.shape[field as string];
      if (fieldSchema) {
        fieldSchema.parse(value);
        // Remove any existing errors for this field
        setErrors(prev => prev.filter(err => err.field !== String(field)));
        return true;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError: ValidationError = {
          field: String(field),
          message: error.errors[0]?.message || 'Invalid value',
        };
        setErrors(prev => [
          ...prev.filter(err => err.field !== String(field)),
          fieldError,
        ]);
      }
      return false;
    }
  }, [schema]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouchedFields(prev => new Set([...prev, String(field)]));
    setIsDirty(true);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => prev.filter(err => err.field !== String(field)));
  }, []);

  const reset = useCallback(() => {
    setErrors([]);
    setTouchedFields(new Set());
    setIsDirty(false);
  }, []);

  const state: FormValidationState = {
    errors,
    isValid,
    isDirty,
    touchedFields,
  };

  const actions: FormValidationActions<T> = {
    validate,
    validateField,
    setFieldTouched,
    setErrors,
    clearErrors,
    clearFieldError,
    reset,
  };

  return [state, actions];
}

// Helper hook for getting field-specific errors
export function useFieldError(
  errors: ValidationError[],
  fieldName: string
): string | undefined {
  return useMemo(() => {
    const error = errors.find(err => err.field === fieldName);
    return error?.message;
  }, [errors, fieldName]);
}

// Helper hook for checking if field has been touched
export function useFieldTouched(
  touchedFields: Set<string>,
  fieldName: string
): boolean {
  return useMemo(() => {
    return touchedFields.has(fieldName);
  }, [touchedFields, fieldName]);
}

// Combined hook for form field state
export function useFormField<T extends Record<string, any>>(
  validationState: FormValidationState,
  fieldName: keyof T
) {
  const error = useFieldError(validationState.errors, String(fieldName));
  const touched = useFieldTouched(validationState.touchedFields, String(fieldName));
  
  return {
    error,
    touched,
    hasError: Boolean(error),
    showError: Boolean(error && touched),
  };
}