"use client";

import { useState, useCallback } from 'react';
import { format } from 'date-fns-jalali';
import { enUS, faIR } from 'date-fns/locale';

export type CalendarType = 'gregorian' | 'jalali';

export interface CalendarOptions {
  type?: CalendarType;
  defaultDate?: Date;
  format?: string;
}

export interface CalendarHookReturn {
  calendarType: CalendarType;
  currentLocale: typeof faIR | typeof enUS;
  toggleCalendarType: () => void;
  formatDate: (date: Date | undefined, formatString?: string) => string;
  getCalendarLabel: () => string;
}

export function useCalendar(options: CalendarOptions = {}): CalendarHookReturn {
  const { 
    type = 'jalali', 
    defaultDate, 
    format: formatString = 'yyyy/MM/dd' 
  } = options;

  const [calendarType, setCalendarType] = useState<CalendarType>(type);

  const toggleCalendarType = useCallback(() => {
    setCalendarType(prev => prev === 'jalali' ? 'gregorian' : 'jalali');
  }, []);

  const currentLocale = calendarType === 'jalali' ? faIR : enUS;

  const formatDate = useCallback((date: Date | undefined, customFormat?: string) => {
    if (!date) return '';
    return format(date, customFormat || formatString, { 
      locale: currentLocale 
    });
  }, [currentLocale, formatString]);

  const getCalendarLabel = useCallback(() => {
    return calendarType === 'jalali' ? 'میلادی' : 'شمسی';
  }, [calendarType]);

  return {
    calendarType,
    currentLocale,
    toggleCalendarType,
    formatDate,
    getCalendarLabel,
  };
}