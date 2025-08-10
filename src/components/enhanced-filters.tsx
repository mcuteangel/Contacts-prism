"use client";

import React, { useState, useMemo } from 'react';
import { X, Filter, Calendar, Tag, User, Phone, Mail, Briefcase, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLiveGroups } from '@/hooks/use-live-data';
import { useJalaliCalendar } from '@/hooks/use-jalali-calendar';
import { JalaliCalendar } from '@/components/ui/jalali-calendar';

// Note: `useIsMobile` and `Sheet` related imports are removed as per the request to unify the UI.

interface EnhancedFilters {
  // Text filters
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  address: string;
  
  // Date filters
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  
  // Group filters
  groups: string[];
  
  // Tag filters
  tags: string[];
  
  // Star/pin filters
  isStarred: boolean;
  isPinned: boolean;
  
  // Custom field filters
  customFields: Array<{
    name: string;
    value: string;
    operator?: 'equals' | 'contains' | 'starts_with' | 'ends_with';
  }>;
}

interface EnhancedFiltersProps {
  filters: EnhancedFilters;
  onFiltersChange: (filters: EnhancedFilters) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_TAGS = ['کار', 'دوستان', 'خانواده', 'همکاران', 'مشتریان'];

export function EnhancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen,
  onOpenChange,
}: EnhancedFiltersProps) {
  const groupsData = useLiveGroups();
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const { formatDate } = useJalaliCalendar({ type: 'jalali' });
  
  const updateFilters = (updates: Partial<EnhancedFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };
  
  const handleTextFilterChange = (field: keyof EnhancedFilters, value: string) => {
    updateFilters({ [field]: value || undefined });
  };
  
  const handleGroupToggle = (groupId: string) => {
    const newGroups = filters.groups.includes(groupId)
      ? filters.groups.filter(id => id !== groupId)
      : [...filters.groups, groupId];
    updateFilters({ groups: newGroups });
  };
  
  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };
  
  const handleDateSelect = (date: Date | undefined, type: 'from' | 'to') => {
    updateFilters(type === 'from' ? { dateFrom: date } : { dateTo: date });
  };
  
  const handleCustomFieldChange = (index: number, field: 'name' | 'value' | 'operator', value: string) => {
    const newCustomFields = [...filters.customFields];
    newCustomFields[index] = { ...newCustomFields[index], [field]: value };
    updateFilters({ customFields: newCustomFields });
  };
  
  const addCustomField = () => {
    updateFilters({
      customFields: [...filters.customFields, { name: '', value: '', operator: 'contains' }]
    });
  };
  
  const removeCustomField = (index: number) => {
    const newCustomFields = filters.customFields.filter((_, i) => i !== index);
    updateFilters({ customFields: newCustomFields });
  };
  
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      return value !== undefined && value !== '';
    }).length;
  }, [filters]);

  const renderBasicFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['name', 'email', 'phone', 'company'] as const).map(field => {
          const Icon = { name: User, email: Mail, phone: Phone, company: Briefcase }[field];
          const placeholder = { name: 'نام', email: 'ایمیل', phone: 'تلفن', company: 'شرکت' }[field];
          return (
            <div key={field} className="relative">
              <Icon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={filters[field] || ''}
                onChange={(e) => handleTextFilterChange(field, e.target.value)}
                className="pl-7 text-xs h-8"
              />
            </div>
          );
        })}
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs">گروه‌ها</Label>
        <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5 p-1 border rounded-md">
          {groupsData.map((group: any) => (
            <Badge
              key={group.id}
              variant={filters.groups.includes(String(group.id)) ? "default" : "outline"}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => handleGroupToggle(String(group.id))}
            >
              {group.name}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs">تگ‌ها</Label>
        <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1.5 p-1 border rounded-md">
          {DEFAULT_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={filters.tags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs">بازه زمانی</Label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="text-xs h-8 justify-start font-normal">
                <Calendar className="ml-2 h-3.5 w-3.5" />
                {filters.dateFrom ? formatDate(filters.dateFrom) : "تاریخ شروع"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <JalaliCalendar
                selected={filters.dateFrom}
                onSelect={(date) => handleDateSelect(date, 'from')}
                className="rounded-lg text-sm p-3"
                variant="glass"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="text-xs h-8 justify-start font-normal">
                <Calendar className="ml-2 h-3.5 w-3.5" />
                {filters.dateTo ? formatDate(filters.dateTo) : "تاریخ پایان"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <JalaliCalendar
                selected={filters.dateTo}
                onSelect={(date) => handleDateSelect(date, 'to')}
                className="rounded-lg text-sm p-3"
                variant="glass"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Button variant={filters.isStarred ? 'secondary' : 'outline'} className="text-xs h-8" onClick={() => updateFilters({ isStarred: !filters.isStarred })}>
          <Star className={cn("ml-2 h-4 w-4", filters.isStarred && 'fill-yellow-400 text-yellow-500')} />
          ستاره‌دار
        </Button>
        <Button variant={filters.isPinned ? 'secondary' : 'outline'} className="text-xs h-8" onClick={() => updateFilters({ isPinned: !filters.isPinned })}>
          <Filter className={cn("ml-2 h-4 w-4", filters.isPinned && 'fill-blue-400 text-blue-500')} />
          پین‌شده
        </Button>
      </div>
    </div>
  );
  
  const renderAdvancedFilters = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">فیلدهای سفارشی</Label>
        <Button variant="outline" size="sm" onClick={addCustomField} className="text-xs h-7 px-2">
          افزودن فیلد
        </Button>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {filters.customFields.map((field, index) => (
          <div key={index} className="space-y-2 p-2 border rounded-lg relative">
            <Button variant="ghost" size="icon" className="absolute -top-2 -left-2 h-6 w-6" onClick={() => removeCustomField(index)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
            <Input
              placeholder="نام فیلد"
              value={field.name}
              onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
              className="text-xs h-8"
            />
            <div className="flex gap-2">
              <Select value={field.operator} onValueChange={(v) => handleCustomFieldChange(index, 'operator', v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="شرط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">برابر با</SelectItem>
                  <SelectItem value="contains">شامل</SelectItem>
                  <SelectItem value="starts_with">شروع با</SelectItem>
                  <SelectItem value="ends_with">پایان با</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="مقدار"
                value={field.value}
                onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
        ))}
      </div>
      {filters.customFields.length === 0 && (
         <div className="text-xs text-muted-foreground text-center py-4">
           هیچ فیلد سفارشی تعریف نشده است.
         </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="p-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">فیلترها</h3>
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs h-8">
          <X className="ml-1 h-3.5 w-3.5" />
          پاک کردن همه
        </Button>
      </div>
      
      <div className="bg-muted p-1 rounded-lg flex gap-1 mb-4">
        <Button variant={activeTab === 'basic' ? 'default' : 'outline'} size="sm" className="flex-1 text-xs h-8" onClick={() => setActiveTab('basic')}>
          پایه
        </Button>
        <Button variant={activeTab === 'advanced' ? 'default' : 'outline'} size="sm" className="flex-1 text-xs h-8" onClick={() => setActiveTab('advanced')}>
          پیشرفته
        </Button>
      </div>
      
      {activeTab === 'basic' ? renderBasicFilters() : renderAdvancedFilters()}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="ml-2 h-4 w-4" />
          فیلترها
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -left-2 h-5 w-5 flex items-center justify-center p-1 text-xs rounded-full">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[95vw] max-w-sm sm:w-[380px] max-h-[80vh] overflow-y-auto p-3" align="start">
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
}
