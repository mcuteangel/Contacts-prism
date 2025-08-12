import { useState, useEffect, useCallback } from 'react';
import { ErrorManager } from '@/lib/error-manager';

/**
 * Custom hook for managing localStorage with React state synchronization
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'useLocalStorage',
        action: 'initialize',
        metadata: { key }
      });
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'useLocalStorage',
        action: 'setValue',
        metadata: { key }
      });
    }
  }, [key, storedValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'useLocalStorage',
        action: 'removeValue',
        metadata: { key }
      });
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          ErrorManager.logError(error as Error, {
            component: 'useLocalStorage',
            action: 'handleStorageChange',
            metadata: { key }
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing localStorage with expiration
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @param ttl - Time to live in milliseconds
 * @returns [value, setValue, removeValue, isExpired]
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  ttl: number
): [T, (value: T) => void, () => void, boolean] {
  const [value, setValue, removeValue] = useLocalStorage(key, {
    value: initialValue,
    timestamp: Date.now(),
  });

  const isExpired = Date.now() - value.timestamp > ttl;

  const setValueWithTimestamp = useCallback((newValue: T) => {
    setValue({
      value: newValue,
      timestamp: Date.now(),
    });
  }, [setValue]);

  const removeValueAndCleanup = useCallback(() => {
    removeValue();
  }, [removeValue]);

  // Auto-remove expired values
  useEffect(() => {
    if (isExpired) {
      removeValueAndCleanup();
    }
  }, [isExpired, removeValueAndCleanup]);

  return [
    isExpired ? initialValue : value.value,
    setValueWithTimestamp,
    removeValueAndCleanup,
    isExpired,
  ];
}

/**
 * Hook for managing multiple localStorage keys as a single object
 * @param keys - Array of localStorage keys
 * @param initialValues - Object with initial values for each key
 * @returns [values, setValues, removeAll]
 */
export function useMultipleLocalStorage<T extends Record<string, any>>(
  keys: (keyof T)[],
  initialValues: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [values, setValues] = useState<T>(() => {
    const result = { ...initialValues };
    
    if (typeof window !== 'undefined') {
      keys.forEach(key => {
        try {
          const item = window.localStorage.getItem(String(key));
          if (item) {
            result[key] = JSON.parse(item);
          }
        } catch (error) {
          ErrorManager.logError(error as Error, {
            component: 'useMultipleLocalStorage',
            action: 'initialize',
            metadata: { key: String(key) }
          });
        }
      });
    }
    
    return result;
  });

  const setMultipleValues = useCallback((updates: Partial<T>) => {
    setValues(prev => {
      const newValues = { ...prev, ...updates };
      
      // Update localStorage for each changed key
      if (typeof window !== 'undefined') {
        Object.entries(updates).forEach(([key, value]) => {
          try {
            window.localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            ErrorManager.logError(error as Error, {
              component: 'useMultipleLocalStorage',
              action: 'setMultipleValues',
              metadata: { key }
            });
          }
        });
      }
      
      return newValues;
    });
  }, []);

  const removeAll = useCallback(() => {
    setValues(initialValues);
    
    if (typeof window !== 'undefined') {
      keys.forEach(key => {
        try {
          window.localStorage.removeItem(String(key));
        } catch (error) {
          ErrorManager.logError(error as Error, {
            component: 'useMultipleLocalStorage',
            action: 'removeAll',
            metadata: { key: String(key) }
          });
        }
      });
    }
  }, [keys, initialValues]);

  return [values, setMultipleValues, removeAll];
}