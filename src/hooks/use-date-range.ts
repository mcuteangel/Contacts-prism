"use client";

import { useState, useCallback } from 'react';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface UseDateRangeReturn {
  dateRange: DateRange;
  setFromDate: (date: Date | undefined) => void;
  setToDate: (date: Date | undefined) => void;
  setDateRange: (range: DateRange) => void;
  clearDateRange: () => void;
  isDateRangeValid: () => boolean;
  formatDateRange: (formatDate: (date: Date | undefined) => string) => string;
}

export function useDateRange(initialRange?: DateRange): UseDateRangeReturn {
  const [dateRange, setDateRangeState] = useState<DateRange>({
    from: undefined,
    to: undefined,
    ...initialRange,
  });

  const setFromDate = useCallback((date: Date | undefined) => {
    setDateRangeState(prev => ({ ...prev, from: date }));
  }, []);

  const setToDate = useCallback((date: Date | undefined) => {
    setDateRangeState(prev => ({ ...prev, to: date }));
  }, []);

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
  }, []);

  const clearDateRange = useCallback(() => {
    setDateRangeState({ from: undefined, to: undefined });
  }, []);

  const isDateRangeValid = useCallback(() => {
    return !!(dateRange.from && dateRange.to) || !!dateRange.from;
  }, [dateRange]);

  const formatDateRange = useCallback((formatDate: (date: Date | undefined) => string) => {
    if (!dateRange.from && !dateRange.to) {
      return '';
    }
    
    if (dateRange.from && dateRange.to) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    }
    
    if (dateRange.from) {
      return formatDate(dateRange.from);
    }
    
    return '';
  }, [dateRange]);

  return {
    dateRange,
    setFromDate,
    setToDate,
    setDateRange,
    clearDateRange,
    isDateRangeValid,
    formatDateRange,
  };
}