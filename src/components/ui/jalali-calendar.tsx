"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import moment from 'moment-jalaali';
import { useJalaliCalendar } from '@/hooks/use-jalali-calendar';

interface JalaliCalendarProps {
  selected?: Date | undefined;
  onSelect?: (date: Date) => void;
  className?: string;
  variant?: 'default' | 'glass';
  locale?: 'fa' | 'en';
  showToggle?: boolean;
}

export function JalaliCalendar({ 
  selected, 
  onSelect, 
  className, 
  variant = 'glass',
  locale: initialLocale = 'fa',
  showToggle = true
}: JalaliCalendarProps) {
  // Store dates as timestamps to prevent infinite re-renders
  const [currentDate, setCurrentDate] = useState(() => {
    return selected ? moment(selected).valueOf() : moment().startOf('day').valueOf();
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return selected ? moment(selected).valueOf() : moment().startOf('day').valueOf();
  });
  
  // Create moment objects from timestamps
  const currentMoment = moment(currentDate);
  const selectedMoment = moment(selectedDate);

  const [locale, setLocale] = useState<'fa' | 'en'>(initialLocale);
  const isJalali = locale === 'fa';

  // Sync with external locale changes
  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const monthDays = React.useMemo(() => {
    const days: Array<{
      date: moment.Moment;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isWeekend: boolean;
      dayIndex?: number;
    }> = [];

    const startOfMonth = isJalali 
      ? currentMoment.clone().startOf('jMonth')
      : currentMoment.clone().startOf('month');
    
    const endOfMonth = isJalali 
      ? currentMoment.clone().endOf('jMonth')
      : currentMoment.clone().endOf('month');
    
    // تنظیم اول هفته برای محاسبات بعدی
    if (isJalali) {
      // برای تقویم شمسی: شنبه اولین روز هفته
      moment.updateLocale('fa', {
        week: {
          dow: 6, // شنبه اولین روز هفته (6)
          doy: 6  // هفته‌ای که شامل 1 فروردین باشد هفته اول سال است
        }
      });
      moment.locale('fa');
    } else {
      // برای تقویم میلادی: یکشنبه اولین روز هفته
      moment.updateLocale('en', {
        week: {
          dow: 0, // یکشنبه اولین روز هفته (0)
          doy: 6  // تعریف استاندارد برای هفته اول سال
        }
      });
      moment.locale('en');
    }

    // محاسبه شروع و پایان هفته با توجه به تقویم انتخاب شده
    const startOfWeek = isJalali
      ? startOfMonth.clone().startOf('week') // استفاده از week برای تقویم شمسی
      : startOfMonth.clone().startOf('week'); // استفاده از week برای تقویم میلادی
      
    const endOfWeek = isJalali
      ? endOfMonth.clone().endOf('week') // استفاده از week برای تقویم شمسی
      : endOfMonth.clone().endOf('week'); // استفاده از week برای تقویم میلادی

    let day = startOfWeek.clone();
    let dayIndex = 0;
    while (day.isSameOrBefore(endOfWeek, 'day')) {
      const isCurrentMonth = isJalali
        ? day.jMonth() === currentMoment.jMonth()
        : day.isSame(currentMoment, 'month');
        
      const today = moment().startOf('day');
      const isToday = day.isSame(today, 'day');
      const isSelected = day.isSame(selectedMoment, 'day');
      
      // محاسبه روز هفته
      let dayOfWeek;
      if (isJalali) {
        // برای تقویم شمسی: شنبه=0، یکشنبه=1، ...، جمعه=6
        dayOfWeek = (day.day() + 1) % 7;
      } else {
        // برای تقویم میلادی: یکشنبه=0، دوشنبه=1، ...، شنبه=6
        dayOfWeek = day.day();
      }
      
      const isWeekend = isJalali
        ? dayOfWeek === 6 // جمعه در تقویم شمسی
        : dayOfWeek === 0 || dayOfWeek === 6; // آخر هفته در تقویم میلادی

      days.push({
        date: day.clone(),
        isCurrentMonth,
        isToday,
        isSelected,
        isWeekend,
        dayIndex // برای دیباگ کردن
      });

      day.add(1, 'day');
      dayIndex++;
    }

    return days;
  }, [currentMoment, selectedMoment, isJalali]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const date = moment(prev);
      return isJalali 
        ? date.subtract(1, 'jMonth').valueOf()
        : date.subtract(1, 'month').valueOf();
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const date = moment(prev);
      return isJalali 
        ? date.add(1, 'jMonth').valueOf()
        : date.add(1, 'month').valueOf();
    });
  };

  const goToToday = () => {
    const today = moment().startOf('day');
    setCurrentDate(today.valueOf());
    setSelectedDate(today.valueOf());
    if (onSelect) {
      onSelect(today.toDate());
    }
  };

  const toggleCalendarType = () => {
    setLocale(prev => prev === 'fa' ? 'en' : 'fa');
  };

  const handleDateClick = (date: moment.Moment) => {
    const newDate = date.clone().startOf('day');
    setSelectedDate(newDate.valueOf());
    if (onSelect) {
      onSelect(newDate.toDate());
    }
  };

  // Weekday names based on locale
  // ترتیب روزهای هفته به صورت: شنبه تا جمعه
  const daysOfWeek = isJalali 
    ? ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] // شنبه (0) تا جمعه (6)
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Get localized month and year
  const getMonthName = () => {
    if (isJalali) {
      // Persian month names
      const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
      ];
      const monthIndex = currentMoment.jMonth();
      return `${persianMonths[monthIndex]} ${currentMoment.jYear()}`;
    } else {
      // English month names
      const englishMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = currentMoment.month();
      return `${englishMonths[monthIndex]} ${currentMoment.year()}`;
    }
  };

  // Get day number based on calendar type
  const getDayNumber = (date: moment.Moment) => {
    return isJalali ? date.format('jD') : date.format('D');
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-lg w-full max-w-xs shadow-lg",
        variant === 'glass' && "glass bg-opacity-80 backdrop-blur-sm border border-opacity-10",
        "transition-all duration-200 hover:shadow-xl",
        className,
        isJalali ? 'font-sans' : 'font-sans'
      )}
      dir={isJalali ? 'rtl' : 'ltr'}
    >
      {/* Calendar Type Toggle */}
      {showToggle && (
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCalendarType}
            className="text-xs h-7 px-2"
          >
            {isJalali ? 'میلادی' : 'شمسی'}
          </Button>
        </div>
      )}

      {/* Header */}
      <div className={cn("flex items-center justify-between mb-4")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={isJalali ? goToNextMonth : goToPreviousMonth}
          className="h-8 w-8 p-0"
        >
          {isJalali ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-center min-w-[140px]">
            {getMonthName()}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs h-7 px-2"
          >
            {isJalali ? 'امروز' : 'Today'}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={isJalali ? goToPreviousMonth : goToNextMonth}
          className="h-8 w-8 p-0"
        >
          {isJalali ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day, index) => {
          const isWeekend = isJalali 
            ? index === 6 // Friday in Jalali
            : index === 0 || index === 6; // Weekend in Gregorian
          
          return (
            <div
              key={index}
              className={cn(
                "text-center text-xs font-medium py-1 text-muted-foreground",
                isWeekend && "text-destructive/80"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => handleDateClick(day.date)}
            disabled={!day.isCurrentMonth}
            className={cn(
              "h-9 w-9 p-0 text-sm font-medium transition-colors duration-200 rounded-full",
              !day.isCurrentMonth && "text-muted-foreground opacity-50",
              day.isWeekend && !day.isSelected && "text-destructive/70",
              day.isToday && !day.isSelected && "bg-accent/50 text-accent-foreground",
              day.isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {getDayNumber(day.date)}
            {day.isToday && !day.isSelected && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}