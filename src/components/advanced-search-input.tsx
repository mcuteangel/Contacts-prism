"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Search, X, ChevronDown, ChevronLeft, HelpCircle, Clock, TrendingUp, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSmartSearch } from '@/hooks/use-smart-search';

interface AdvancedSearchInputProps {
  /**
   * مقدار فعلی جستجو
   * @example "name:علی"
   */
  value: string;
  
  /**
   * تابعی که هنگام تغییر مقدار ورودی فراخوانی می‌شود
   * @param value - مقدار جدید ورودی
   */
  onChange: (value: string) => void;
  
  /**
   * تابعی که هنگام ارسال فرم جستجو (با زدن دکمه اینتر یا کلیک روی آیکون جستجو) فراخوانی می‌شود
   * @param value - مقدار نهایی جستجو
   */
  onSearch: (value: string) => void;
  
  /**
   * کلاس‌های سفارشی برای استایل‌دهی به کامپوننت
   * @example "w-full max-w-md"
   */
  className?: string;
  
  /**
   * فعال یا غیرفعال کردن پیشنهادات هوشمند
   * @default true
   */
  enableSmartSuggestions?: boolean;
  
  /**
   * فعال یا غیرفعال کردن جستجوهای اخیر
   * @default true
   */
  enableRecentSearches?: boolean;
  
  /**
   * حداکثر تعداد پیشنهادات نمایش داده شده
   * @default 5
   */
  maxSuggestions?: number;
}

/**
 * کامپوننت ورودی جستجوی پیشرفته
 * @component
 * @param {string} value - مقدار فعلی جستجو
 * @param {(value: string) => void} onChange - تابعی که هنگام تغییر مقدار فراخوانی می‌شود
 * @param {(value: string) => void} onSearch - تابعی که هنگام ارسال جستجو فراخوانی می‌شود
 * @param {string} [className] - کلاس‌های اضافی برای استایل‌دهی
 */
export function AdvancedSearchInput({
  value,
  onChange,
  onSearch,
  className = '',
  enableSmartSuggestions = true,
  enableRecentSearches = true,
  maxSuggestions = 5
}: AdvancedSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use smart search hook
  const {
    suggestions,
    isLoading: isSuggestionsLoading,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSmartSearch(value, {
    enableSmartDefaults: enableSmartSuggestions,
    enableRecentSearches,
    maxSuggestions,
  });
  
  /**
   * مدیریت ارسال فرم جستجو
   * @param e - رویداد فرم
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
    inputRef.current?.blur();
  };
  
  /**
   * مدیریت رویدادهای صفحه کلید
   * @param e - رویداد کیبورد
   * @description
   * - Enter: ارسال جستجو
   * - Escape: خروج از حالت فوکوس
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };
  
  /**
   * پاک کردن فیلد جستجو و بازگرداندن فوکوس به اینپوت
   */
  const handleClear = () => {
    onChange('');
    onSearch('');
    inputRef.current?.focus();
  };
  
  /**
   * درج مثال جستجو در فیلد و تنظیم فوکوس
   * @param example - مثال جستجو برای درج در فیلد
   */
  const insertExample = (example: string) => {
    onChange(example);
    setShowHelp(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };
  
  /**
   * انتخاب پیشنهاد هوشمند
   * @param suggestion - پیشنهاد انتخاب شده
   */
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    onSearch(suggestion);
    addRecentSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };
  
  /**
   * حذف جستجوی اخیر
   * @param searchTerm - عبارت جستجوی اخیر
   */
  const handleRemoveRecentSearch = (searchTerm: string) => {
    removeRecentSearch(searchTerm);
  };

  /**
   * رندر کردن محتوای راهنمای جستجوی پیشرفته
   * @returns کامپوننت JSX حاوی راهنمای جستجو
   */
  const renderHelpTooltip = () => (
    <div className="p-3 max-w-xs text-sm">
      <h4 className="font-semibold mb-3 text-base border-b pb-2">راهنمای جستجوی پیشرفته</h4>
      
      <div className="space-y-3">
        <div>
          <h5 className="font-medium mb-1.5">عملگرهای منطقی:</h5>
          <ul className="space-y-1.5">
            <li className="flex items-start">
              <span className="text-muted-foreground ml-2">•</span>
              <button 
                onClick={() => insertExample('علی AND رضا')}
                className="text-right hover:bg-accent px-2 py-1 rounded text-foreground transition-colors"
              >
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">AND</code>
                <span className="mr-1 text-xs text-muted-foreground">(پیش‌فرض):</span>
                <span className="text-right">جستجوی عبارات با هم</span>
              </button>
            </li>
            <li className="flex items-start">
              <span className="text-muted-foreground ml-2">•</span>
              <button 
                onClick={() => insertExample('علی OR رضا')}
                className="text-right hover:bg-accent px-2 py-1 rounded text-foreground transition-colors"
              >
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">OR</code>
                <span className="mr-1 text-xs text-muted-foreground">:</span>
                <span className="text-right">جستجوی یکی از عبارات</span>
              </button>
            </li>
            <li className="flex items-start">
              <span className="text-muted-foreground ml-2">•</span>
              <button 
                onClick={() => insertExample('علی NOT رضا')}
                className="text-right hover:bg-accent px-2 py-1 rounded text-foreground transition-colors"
              >
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">NOT</code>
                <span className="mr-1 text-xs text-muted-foreground">:</span>
                <span className="text-right">حذف نتایج شامل عبارت</span>
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-medium mb-1.5">جستجوی پیشرفته:</h5>
          <ul className="space-y-1.5">
            <li className="flex items-start">
              <span className="text-muted-foreground ml-2">•</span>
              <button 
                onClick={() => insertExample('"عبارت دقیق"')}
                className="text-right hover:bg-accent px-2 py-1 rounded text-foreground transition-colors"
              >
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">"عبارت دقیق"</code>
                <span className="mr-1 text-xs text-muted-foreground">:</span>
                <span>جستجوی دقیق عبارت</span>
              </button>
            </li>
            <li className="flex items-start">
              <span className="text-muted-foreground ml-2">•</span>
              <button 
                onClick={() => insertExample('name:علی')}
                className="text-right hover:bg-accent px-2 py-1 rounded text-foreground transition-colors"
              >
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">field:مقدار</code>
                <span className="mr-1 text-xs text-muted-foreground">:</span>
                <span>جستجو در فیلد خاص</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t">
          <h5 className="font-medium mb-2">مثال‌های آماده:</h5>
          <div className="space-y-2">
            <button
              onClick={() => insertExample('name:علی AND (company:شرکت OR company:سازمان)')}
              className="w-full text-right hover:bg-accent px-3 py-1.5 rounded-md border text-sm transition-colors flex items-center justify-between"
            >
              <span>افراد به نام علی در شرکت یا سازمان</span>
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => insertExample('phone:0912* AND NOT group:منقضی')}
              className="w-full text-right hover:bg-accent px-3 py-1.5 rounded-md border text-sm transition-colors flex items-center justify-between"
            >
              <span>شماره‌های 0912 که منقضی نیستند</span>
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  /**
   * رندر کردن پیشنهادات هوشمند
   */
  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;
    
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
        <div className="p-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion.text)}
              className="w-full text-right px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center">
                {suggestion.type === 'recent' && <Clock className="h-3.5 w-3.5 ml-2 text-gray-400" />}
                {suggestion.type === 'popular' && <TrendingUp className="h-3.5 w-3.5 ml-2 text-gray-400" />}
                {suggestion.type === 'smart' && <Lightbulb className="h-3.5 w-3.5 ml-2 text-gray-400" />}
                {suggestion.type === 'contact' && <Search className="h-3.5 w-3.5 ml-2 text-gray-400" />}
                <span className="text-sm">{suggestion.text}</span>
              </div>
              {suggestion.type === 'recent' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveRecentSearch(suggestion.text);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 ml-2"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className={`relative ${className}`}>
      {renderSuggestions()}
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (enableSmartSuggestions && e.target.value.length >= 2) {
              setShowSuggestions(true);
            } else {
              setShowSuggestions(false);
            }
          }}
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              // Handle keyboard navigation
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            if (enableSmartSuggestions && value.length >= 2) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => setTimeout(() => {
            setIsFocused(false);
            setShowSuggestions(false);
          }, 200)}
          placeholder="جستجوی مخاطب..."
          className="pr-10 pl-4 py-5 text-base"
        />
        
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="پاک کردن جستجو"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        <div className="absolute left-12 top-1/2 -translate-y-1/2 flex items-center">
          <TooltipProvider delayDuration={300}>
            <Tooltip open={showHelp} onOpenChange={setShowHelp}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowHelp(!showHelp);
                  }}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="p-0 max-h-[80vh] overflow-y-auto" sideOffset={8}>
                {renderHelpTooltip()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
            onClick={() => setShowHelp(!showHelp)}
          >
            جستجوی پیشرفته
            <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AdvancedSearchInput;
