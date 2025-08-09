"use client";

import { useState, useEffect } from 'react';
import { Filter, X, Calendar, Tag, Users, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { GroupUI } from '@/domain/ui-types';

// تابع ساده برای فرمت تاریخ
const formatDate = (date: Date | undefined) => {
  if (!date) return '';
  return format(date, 'yyyy/MM/dd');
};

interface AdvancedFiltersProps {
  groups: GroupUI[];
  onFilterChange: (filters: FilterValues) => void;
  className?: string;
}

export interface FilterValues {
  groups: string[];
  tags: string[];
  dateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

// لیست تگ‌های پیش‌فرض
const DEFAULT_TAGS = [
  'مهم',
  'کاری',
  'شخصی',
  'فامیل',
  'دوستان',
  'همکار',
  'مشتری',
  'تامین کننده',
];

export function AdvancedFilters({ groups, onFilterChange, className = '' }: AdvancedFiltersProps) {
  const [openGroups, setOpenGroups] = useState(false);
  const [openTags, setOpenTags] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  
  const [filters, setFilters] = useState<FilterValues>({
    groups: [],
    tags: [],
    dateRange: {
      from: undefined,
      to: undefined,
    },
  });

  // اعمال فیلترها به لیست مخاطبین
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // مدیریت تغییرات گروه‌ها
  const handleGroupToggle = (groupId: string) => {
    setFilters(prev => {
      const newGroups = prev.groups.includes(groupId)
        ? prev.groups.filter(id => id !== groupId)
        : [...prev.groups, groupId];
      
      return { ...prev, groups: newGroups };
    });
  };

  // مدیریت تغییرات تگ‌ها
  const handleTagToggle = (tag: string) => {
    setFilters(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      
      return { ...prev, tags: newTags };
    });
  };

  // مدیریت تغییرات محدوده تاریخ
  const handleDateSelect = (date: Date | undefined) => {
    setFilters(prev => {
      // اگر هیچ تاریخی انتخاب نشده یا محدوده کامل است، تاریخ جدید را شروع کنید
      if (!prev.dateRange?.from || (prev.dateRange.from && prev.dateRange.to)) {
        return {
          ...prev,
          dateRange: {
            from: date,
            to: undefined,
          },
        };
      } else {
        // محدوده را کامل کنید
        if (date && prev.dateRange.from && date < prev.dateRange.from) {
          // اگر تاریخ انتخاب شده قبل از تاریخ شروع است، آنها را عوض کنید
          return {
            ...prev,
            dateRange: {
              from: date,
              to: prev.dateRange.from,
            },
          };
        } else {
          return {
            ...prev,
            dateRange: {
              from: prev.dateRange.from,
              to: date,
            },
          };
        }
      }
    });
  };

  // پاک کردن همه فیلترها
  const clearAllFilters = () => {
    setFilters({
      groups: [],
      tags: [],
      dateRange: {
        from: undefined,
        to: undefined,
      },
    });
  };

  // بررسی فعال بودن فیلترها
  const hasActiveFilters = 
    filters.groups.length > 0 || 
    filters.tags.length > 0 || 
    filters.dateRange?.from || 
    filters.dateRange?.to;

  return (
    <div className={cn("flex items-center space-x-2 rtl:space-x-reverse", className)}>
      <Popover open={openGroups} onOpenChange={setOpenGroups}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={openGroups}
            className="justify-between text-xs h-8"
          >
            <Users className="h-3.5 w-3.5 ml-1" />
            گروه‌ها
            <ChevronDown className="h-3.5 w-3.5 mr-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="جستجوی گروه..." />
            <CommandEmpty>هیچ گروهی یافت نشد</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {groups.map((group) => (
                <CommandItem
                  key={group.id}
                  value={group.name}
                  onSelect={() => group.id && handleGroupToggle(String(group.id))}
                  className="text-xs cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary",
                    filters.groups.includes(String(group.id))
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className={cn("h-3 w-3")} />
                  </div>
                  <span className="truncate">{group.name}</span>
                  {group.color && (
                    <span 
                      className="h-2.5 w-2.5 rounded-full ml-2"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={openTags} onOpenChange={setOpenTags}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={openTags}
            className="justify-between text-xs h-8"
          >
            <Tag className="h-3.5 w-3.5 ml-1" />
            تگ‌ها
            <ChevronDown className="h-3.5 w-3.5 mr-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="جستجوی تگ..." />
            <CommandEmpty>تگی یافت نشد</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {DEFAULT_TAGS.map((tag) => (
                <CommandItem
                  key={tag}
                  value={tag}
                  onSelect={() => handleTagToggle(tag)}
                  className="text-xs cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary",
                    filters.tags.includes(tag)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className={cn("h-3 w-3")} />
                  </div>
                  <span>{tag}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover open={openDate} onOpenChange={setOpenDate}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="justify-between text-xs h-8"
          >
            <Calendar className="h-3.5 w-3.5 ml-1" />
            {filters.dateRange?.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, 'yyyy/MM/dd')} -{' '}
                  {format(filters.dateRange.to, 'yyyy/MM/dd')}
                </>
              ) : (
                format(filters.dateRange.from, 'yyyy/MM/dd')
              )
            ) : (
              'تاریخ'
            )}
            <ChevronDown className="h-3.5 w-3.5 mr-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange?.from}
            selected={{
              from: filters.dateRange?.from,
              to: filters.dateRange?.to,
            }}
            onSelect={(range) => {
              if (range?.from) {
                handleDateSelect(range.from);
              }
              if (range?.to) {
                handleDateSelect(range.to);
              }
            }}
            numberOfMonths={2}
            // استفاده از تقویم پیش‌فرض با استایل‌های سفارشی
            className="rounded-md border"
            classNames={{
              day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
              day_today: 'bg-accent text-accent-foreground',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'bg-accent/50 text-accent-foreground',
              day_hidden: 'invisible',
            }}
          />
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 ml-1" />
          حذف فیلترها
        </Button>
      )}
    </div>
  );
}

export default AdvancedFilters;
