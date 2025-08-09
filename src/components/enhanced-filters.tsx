"use client";

import React, { useState } from 'react';
import { X, Filter, Calendar, Tag, User, Phone, Mail, MapPin, Briefcase, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLiveGroups } from '@/hooks/use-live-data';

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
  
  // Update filters handler
  const updateFilters = (updates: Partial<EnhancedFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };
  
  // Handle text filter changes
  const handleTextFilterChange = (field: keyof EnhancedFilters, value: string) => {
    updateFilters({ [field]: value || undefined });
  };
  
  // Handle group toggle
  const handleGroupToggle = (groupId: string) => {
    const newGroups = filters.groups.includes(groupId)
      ? filters.groups.filter(id => id !== groupId)
      : [...filters.groups, groupId];
    updateFilters({ groups: newGroups });
  };
  
  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date | undefined, type: 'from' | 'to') => {
    if (type === 'from') {
      updateFilters({ dateFrom: date });
    } else {
      updateFilters({ dateTo: date });
    }
  };
  
  // Handle custom field changes
  const handleCustomFieldChange = (index: number, field: 'name' | 'value' | 'operator', value: string) => {
    const newCustomFields = [...filters.customFields];
    newCustomFields[index] = { ...newCustomFields[index], [field]: value };
    updateFilters({ customFields: newCustomFields });
  };
  
  // Add custom field
  const addCustomField = () => {
    updateFilters({
      customFields: [...filters.customFields, { name: '', value: '', operator: 'contains' }]
    });
  };
  
  // Remove custom field
  const removeCustomField = (index: number) => {
    const newCustomFields = filters.customFields.filter((_, i) => i !== index);
    updateFilters({ customFields: newCustomFields });
  };
  
  // Check if any filter is active
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof EnhancedFilters];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  });
  
  // Render basic filters
  const renderBasicFilters = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name-filter" className="text-sm font-medium">نام</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name-filter"
              placeholder="جستجو بر اساس نام..."
              value={filters.name || ''}
              onChange={(e) => handleTextFilterChange('name', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email-filter" className="text-sm font-medium">ایمیل</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email-filter"
              placeholder="جستجو بر اساس ایمیل..."
              value={filters.email || ''}
              onChange={(e) => handleTextFilterChange('email', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone-filter" className="text-sm font-medium">تلفن</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone-filter"
              placeholder="جستجو بر اساس تلفن..."
              value={filters.phone || ''}
              onChange={(e) => handleTextFilterChange('phone', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company-filter" className="text-sm font-medium">شرکت</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="company-filter"
              placeholder="جستجو بر اساس شرکت..."
              value={filters.company || ''}
              onChange={(e) => handleTextFilterChange('company', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">گروه‌ها</Label>
        <div className="flex flex-wrap gap-2">
          {groupsData.map((group: any) => (
            <Badge
              key={group.id}
              variant={filters.groups.includes(String(group.id)) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleGroupToggle(String(group.id))}
            >
              {group.name}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">تگ‌ها</Label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={filters.tags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>تاریخ از</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, "yyyy/MM/dd") : <span>انتخاب تاریخ</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => handleDateSelect(date, 'from')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>تاریخ تا</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, "yyyy/MM/dd") : <span>انتخاب تاریخ</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => handleDateSelect(date, 'to')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => updateFilters({ isStarred: !filters.isStarred })}
        >
          <Star className={`mr-2 h-4 w-4 ${filters.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          {filters.isStarred ? 'فقط ستاره‌دارها' : 'نمایش ستاره‌دارها'}
        </Button>
        
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => updateFilters({ isPinned: !filters.isPinned })}
        >
          <Filter className={`mr-2 h-4 w-4 ${filters.isPinned ? 'fill-blue-400 text-blue-400' : ''}`} />
          {filters.isPinned ? 'فقط پین‌شده‌ها' : 'نمایش پین‌شده‌ها'}
        </Button>
      </div>
    </div>
  );
  
  // Render advanced filters
  const renderAdvancedFilters = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">فیلدهای سفارشی</Label>
          <Button variant="outline" size="sm" onClick={addCustomField}>
            افزودن فیلد
          </Button>
        </div>
        
        {filters.customFields.map((field, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <Input
                placeholder="نام فیلد"
                value={field.name}
                onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
              />
            </div>
            <div className="col-span-4">
              <Select
                value={field.operator}
                onValueChange={(value) => handleCustomFieldChange(index, 'operator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">مساوی با</SelectItem>
                  <SelectItem value="contains">شامل</SelectItem>
                  <SelectItem value="starts_with">شروع با</SelectItem>
                  <SelectItem value="ends_with">پایان با</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-4">
              <Input
                placeholder="مقدار"
                value={field.value}
                onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCustomField(index)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-medium">فیلترهای ترکیبی</Label>
        <div className="text-sm text-muted-foreground">
          می‌توانید چندین فیلتر را با هم ترکیب کنید تا نتایج دقیق‌تری دریافت کنید.
        </div>
      </div>
    </div>
  );
  
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          فیلترهای پیشرفته
          {hasActiveFilters && (
            <div className="absolute -top-2 -right-2 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
              {Object.keys(filters).filter(key => {
                const value = filters[key as keyof EnhancedFilters];
                if (Array.isArray(value)) return value.length > 0;
                return value !== undefined && value !== '';
              }).length}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-h-[80vh] overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">فیلترهای پیشرفته</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="mr-2 h-4 w-4" />
                پاک کردن فیلترها
              </Button>
            </div>
          </div>
          
          <div className="flex border-b">
            <Button
              variant={activeTab === 'basic' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent border-b-primary"
              onClick={() => setActiveTab('basic')}
            >
              فیلترهای پایه
            </Button>
            <Button
              variant={activeTab === 'advanced' ? 'default' : 'ghost'}
              className="rounded-none border-b-2 border-transparent border-b-primary"
              onClick={() => setActiveTab('advanced')}
            >
              فیلترهای پیشرفته
            </Button>
          </div>
          
          {activeTab === 'basic' ? renderBasicFilters() : renderAdvancedFilters()}
        </div>
      </PopoverContent>
    </Popover>
  );
}