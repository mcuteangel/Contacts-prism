"use client";

import { useState, useCallback } from 'react';
import moment from 'moment-jalaali';
import { enUS } from 'date-fns/locale';

export type CalendarType = 'gregorian' | 'jalali';

export interface CalendarOptions {
  type?: CalendarType;
  defaultDate?: Date;
  format?: string;
}

export interface CalendarHookReturn {
  calendarType: CalendarType;
  currentLocale: any;
  toggleCalendarType: () => void;
  formatDate: (date: Date | undefined, formatString?: string) => string;
  formatDateWithDay: (date: Date | undefined) => string;
  getCalendarLabel: () => string;
  convertToJalali: (date: Date) => moment.Moment;
  convertToGregorian: (date: moment.Moment) => Date;
}

export function useJalaliCalendar(options: CalendarOptions = {}): CalendarHookReturn {
  const { 
    type = 'jalali', 
    defaultDate, 
    format: formatString = 'jYYYY/jMM/jDD' 
  } = options;

  const [calendarType, setCalendarType] = useState<CalendarType>(type);

  const toggleCalendarType = useCallback(() => {
    setCalendarType(prev => prev === 'jalali' ? 'gregorian' : 'jalali');
  }, []);

  const formatDate = useCallback((date: Date | undefined, customFormat?: string) => {
    if (!date) return '';
    
    if (calendarType === 'jalali') {
      const momentDate = moment(date);
      return momentDate.format(customFormat || formatString);
    } else {
      // For Gregorian, use date-fns with English locale
      const { format } = require('date-fns');
      return format(date, customFormat || 'yyyy/MM/dd', { locale: enUS });
    }
  }, [calendarType, formatString]);

  const formatDateWithDay = useCallback((date: Date | undefined) => {
    if (!date) return '';
    
    if (calendarType === 'jalali') {
      const momentDate = moment(date);
      return `${momentDate.format('jYYYY/jMM/jDD')} (${momentDate.format('dddd')})`;
    } else {
      // For Gregorian, use date-fns with English locale
      const { format } = require('date-fns');
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('fa-IR', { weekday: 'long' });
      return `${format(date, 'yyyy/MM/dd', { locale: enUS })} (${dayName})`;
    }
  }, [calendarType]);

  const getCalendarLabel = useCallback(() => {
    return calendarType === 'jalali' ? 'شمسی' : 'میلادی';
  }, [calendarType]);

  const convertToJalali = useCallback((date: Date) => {
    return moment(date);
  }, []);

  const convertToGregorian = useCallback((date: moment.Moment) => {
    return date.toDate();
  }, []);

  return {
    calendarType,
    currentLocale: calendarType === 'jalali' ? 'fa' : 'en',
    toggleCalendarType,
    formatDate,
    formatDateWithDay,
    getCalendarLabel,
    convertToJalali,
    convertToGregorian,
  };
}