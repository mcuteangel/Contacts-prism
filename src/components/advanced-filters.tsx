"use client";

import { useState, useEffect } from 'react';
import { Filter, X, Calendar, Tag, Users, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { JalaliCalendar } from '@/components/ui/jalali-calendar';
import { GroupUI } from '@/domain/ui-types';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useJalaliCalendar, CalendarType } from '@/hooks/use-jalali-calendar';
import { useDateRange } from '@/hooks/use-date-range';
import { enUS } from 'date-fns/locale';

interface AdvancedFiltersProps {
  groups: GroupUI[];
  filters: FilterValues;
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

export function AdvancedFilters({ groups, filters, onFilterChange, className = '' }: AdvancedFiltersProps) {
  const [openGroups, setOpenGroups] = useState(false);
  const [openTags, setOpenTags] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [calendarType, setCalendarType] = useState<CalendarType>('jalali');
  const isMobile = useIsMobile();
  const { formatDate, formatDateWithDay, toggleCalendarType, getCalendarLabel } = useJalaliCalendar({ type: calendarType });
  const { dateRange, setDateRange, clearDateRange } = useDateRange();

  // مدیریت تغییرات گروه‌ها
  const handleGroupToggle = (groupId: string) => {
    const newGroups = filters.groups.includes(groupId)
      ? filters.groups.filter(id => id !== groupId)
      : [...filters.groups, groupId];
    onFilterChange({ ...filters, groups: newGroups });
  };

  // حذف یک گروه خاص از فیلتر
  const handleGroupRemove = (groupId: string) => {
    onFilterChange({ ...filters, groups: filters.groups.filter(id => id !== groupId) });
  };

  // مدیریت تغییرات تگ‌ها
  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFilterChange({ ...filters, tags: newTags });
  };

  // حذف یک تگ خاص از فیلتر
  const handleTagRemove = (tag: string) => {
    onFilterChange({ ...filters, tags: filters.tags.filter(t => t !== tag) });
  };

  // مدیریت تغییرات محدوده تاریخ
  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    onFilterChange({ ...filters, dateRange: range });
    
    // Close popover after selecting a range
    if (range.from && range.to) {
      setOpenDate(false);
    }
  };

  // پاک کردن همه فیلترها
  const clearAllFilters = () => {
    onFilterChange({
      groups: [],
      tags: [],
      dateRange: { from: undefined, to: undefined },
    });
  };

  const hasActiveFilters =
    filters.groups.length > 0 ||
    filters.tags.length > 0 ||
    !!filters.dateRange?.from;

  const selectedGroupNames = filters.groups
    .map(groupId => groups.find(g => String(g.id) === groupId)?.name)
    .filter((name): name is string => !!name);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {/* گروه‌ها */}
        <Popover open={openGroups} onOpenChange={setOpenGroups}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" role="combobox" aria-expanded={openGroups} className="justify-between text-xs h-8">
              <Users className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
              گروه‌ها
              {filters.groups.length > 0 && (
                <Badge variant="secondary" className="rounded-full h-4 px-1.5 ltr:mr-1.5 rtl:ml-1.5">
                  {filters.groups.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ltr:ml-1 rtl:mr-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn("w-[220px] sm:w-[240px] lg:w-[260px] max-w-[90vw] p-0", isMobile ? "max-h-[70vh] overflow-y-auto" : "max-h-[320px]")}
            align="start"
          >
            <div className="p-2 sm:p-3">
              <h3 className="text-xs font-semibold mb-2 sm:mb-3">گروه‌ها</h3>
              <Command>
                <CommandInput placeholder="جستجو..." className="text-xs h-7" />
                <CommandEmpty>یافت نشد</CommandEmpty>
                <CommandGroup className="max-h-[45vh] overflow-y-auto">
                  {groups.map((group) => (
                    <CommandItem
                      key={group.id}
                      value={group.name}
                      onSelect={() => group.id && handleGroupToggle(String(group.id))}
                      className="text-xs cursor-pointer py-1"
                    >
                      <div
                        className={cn(
                          "ltr:mr-1.5 rtl:ml-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-sm border border-primary",
                          filters.groups.includes(String(group.id)) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className={cn("h-2 w-2")} />
                      </div>
                      <span className="truncate text-xs">{group.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </div>
          </PopoverContent>
        </Popover>

        {/* تگ‌ها */}
        <Popover open={openTags} onOpenChange={setOpenTags}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" role="combobox" aria-expanded={openTags} className="justify-between text-xs h-8">
              <Tag className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
              تگ‌ها
              {filters.tags.length > 0 && (
                <Badge variant="secondary" className="rounded-full h-4 px-1.5 ltr:mr-1.5 rtl:ml-1.5">
                  {filters.tags.length}
                </Badge>
              )}
              <ChevronDown className="h-3.5 w-3.5 ltr:ml-1 rtl:mr-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn("w-[220px] sm:w-[240px] lg:w-[260px] max-w-[90vw] p-0", isMobile ? "max-h-[70vh] overflow-y-auto" : "max-h-[320px]")}
            align="start"
          >
            <div className="p-2 sm:p-3">
              <h3 className="text-xs font-semibold mb-2 sm:mb-3">تگ‌ها</h3>
              <Command>
                <CommandInput placeholder="جستجو..." className="text-xs h-7" />
                <CommandEmpty>یافت نشد</CommandEmpty>
                <CommandGroup className="max-h-[45vh] overflow-y-auto">
                  {DEFAULT_TAGS.map((tag) => (
                    <CommandItem key={tag} value={tag} onSelect={() => handleTagToggle(tag)} className="text-xs cursor-pointer py-1">
                      <div
                        className={cn(
                          "ltr:mr-1.5 rtl:ml-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-sm border border-primary",
                          filters.tags.includes(tag) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className={cn("h-2 w-2")} />
                      </div>
                      <span className="text-xs">{tag}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </div>
          </PopoverContent>
        </Popover>

        {/* تاریخ */}
        <Popover open={openDate} onOpenChange={setOpenDate}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="justify-between text-xs h-8">
              <Calendar className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
              {dateRange.from || dateRange.to ? (
                dateRange.from && dateRange.to ? (
                  <>
                    {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                  </>
                ) : (
                  dateRange.from ? formatDateWithDay(dateRange.from) : formatDateWithDay(dateRange.to)
                )
              ) : (
                'تاریخ'
              )}
              <ChevronDown className="h-3.5 w-3.5 ltr:ml-1 rtl:mr-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn("w-auto p-0", isMobile ? "max-h-[70vh] overflow-y-auto" : "")}
            align="start"
          >
            {calendarType === 'jalali' ? (
              <JalaliCalendar
                selected={dateRange?.from || undefined}
                onSelect={(date) => handleDateSelect({ from: date, to: dateRange?.to })}
                className="rounded-md border text-xs p-2"
              />
            ) : (
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{ from: dateRange?.from, to: dateRange?.to }}
                onSelect={(range) => handleDateSelect({ from: range?.from, to: range?.to })}
                numberOfMonths={isMobile ? 1 : 2}
                className="rounded-md border text-xs p-2"
                locale={enUS}
                classNames={{
                  day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
                  day_today: 'bg-accent text-accent-foreground',
                  day_disabled: 'text-muted-foreground opacity-50',
                  day_range_middle: 'bg-accent/50 text-accent-foreground',
                  day_hidden: 'invisible',
                }}
              />
            )}
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-medium text-muted-foreground ltr:mr-1 rtl:ml-1">فیلترهای فعال:</span>
          {selectedGroupNames.map(name => (
            <Badge key={name} variant="outline" className="text-xs py-0.5">
              {name}
              <button onClick={() => handleGroupRemove(filters.groups.find(id => groups.find(g => String(g.id) === id)?.name === name)!)} className="ltr:mr-1.5 rtl:ml-1.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs py-0.5">
              {tag}
              <button onClick={() => handleTagRemove(tag)} className="ltr:mr-1.5 rtl:ml-1.5 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
            پاک کردن همه
          </Button>
        </div>
      )}
    </div>
  );
}

export default AdvancedFilters;