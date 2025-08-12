"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingOverlay, InlineLoading } from '@/components/ui/loading-overlay';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

export interface DataTableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: number | string;
  minWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortFn?: (a: T, b: T) => number;
  filterFn?: (row: T, filterValue: string) => boolean;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  error?: string | null;
  
  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  
  // Selection
  selectable?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedRows: Set<number>) => void;
  
  // Sorting
  defaultSort?: {
    key: keyof T | string;
    direction: 'asc' | 'desc';
  };
  onSortChange?: (key: keyof T | string, direction: 'asc' | 'desc') => void;
  
  // Filtering
  searchable?: boolean;
  searchPlaceholder?: string;
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  
  // Virtualization
  virtualized?: boolean;
  rowHeight?: number;
  overscan?: number;
  
  // Styling
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  headerClassName?: string;
  
  // Actions
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  
  // Empty state
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  loading = false,
  error = null,
  pagination,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  defaultSort,
  onSortChange,
  searchable = false,
  searchPlaceholder = 'جستجو...',
  globalFilter = '',
  onGlobalFilterChange,
  virtualized = false,
  rowHeight = 50,
  overscan = 5,
  className,
  rowClassName,
  headerClassName,
  onRowClick,
  onRowDoubleClick,
  emptyMessage = 'داده‌ای یافت نشد',
  emptyIcon,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: 'asc' | 'desc';
  } | null>(defaultSort || null);
  
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
    new Set(initialColumns.filter(col => col.hidden).map(col => String(col.key)))
  );
  
  const [internalGlobalFilter, setInternalGlobalFilter] = useState(globalFilter);

  // Visible columns
  const visibleColumns = useMemo(() => 
    initialColumns.filter(col => !hiddenColumns.has(String(col.key))),
    [initialColumns, hiddenColumns]
  );

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply global filter
    const currentGlobalFilter = onGlobalFilterChange ? globalFilter : internalGlobalFilter;
    if (currentGlobalFilter.trim()) {
      result = result.filter(row => {
        return visibleColumns.some(col => {
          const value = row[col.key as keyof T];
          const stringValue = String(value || '').toLowerCase();
          return stringValue.includes(currentGlobalFilter.toLowerCase());
        });
      });
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue.trim()) {
        const column = visibleColumns.find(col => String(col.key) === key);
        if (column?.filterFn) {
          result = result.filter(row => column.filterFn!(row, filterValue));
        } else {
          result = result.filter(row => {
            const value = row[key as keyof T];
            const stringValue = String(value || '').toLowerCase();
            return stringValue.includes(filterValue.toLowerCase());
          });
        }
      }
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const column = visibleColumns.find(col => col.key === sortConfig.key);
        if (column?.sortFn) {
          const sortResult = column.sortFn(a, b);
          return sortConfig.direction === 'desc' ? -sortResult : sortResult;
        }

        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, visibleColumns, globalFilter, internalGlobalFilter, onGlobalFilterChange, columnFilters, sortConfig]);

  // Handle sorting
  const handleSort = useCallback((key: keyof T | string) => {
    const newDirection = 
      sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    setSortConfig({ key, direction: newDirection });
    onSortChange?.(key, newDirection);
  }, [sortConfig, onSortChange]);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === processedData.length) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(processedData.map((_, index) => index)));
    }
  }, [selectedRows.size, processedData.length, onSelectionChange]);

  const handleSelectRow = useCallback((index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    onSelectionChange?.(newSelection);
  }, [selectedRows, onSelectionChange]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  }, []);

  // Render cell content
  const renderCell = useCallback((column: DataTableColumn<T>, row: T, index: number) => {
    const value = row[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, row, index);
    }
    
    return String(value || '');
  }, []);

  // Render table header
  const renderHeader = () => (
    <div className={cn(
      'flex items-center border-b bg-muted/50 font-medium text-sm',
      headerClassName
    )}>
      {selectable && (
        <div className="w-12 flex items-center justify-center p-2">
          <input
            type="checkbox"
            checked={selectedRows.size === processedData.length && processedData.length > 0}
            onChange={handleSelectAll}
            className="rounded border-input"
          />
        </div>
      )}
      
      {visibleColumns.map((column) => (
        <div
          key={String(column.key)}
          className={cn(
            'flex items-center gap-2 p-2 border-r',
            column.align === 'center' && 'justify-center',
            column.align === 'right' && 'justify-end',
            column.sortable && 'cursor-pointer hover:bg-muted/80'
          )}
          style={{
            width: column.width,
            minWidth: column.minWidth || 100,
            flex: column.width ? undefined : 1,
          }}
          onClick={() => column.sortable && handleSort(column.key)}
        >
          <span>{column.title}</span>
          
          {column.sortable && (
            <div className="flex flex-col">
              {sortConfig?.key === column.key ? (
                sortConfig.direction === 'asc' ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          )}
          
          {column.filterable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <div className="p-2">
                  <Input
                    placeholder={`فیلتر ${column.title}...`}
                    value={columnFilters[String(column.key)] || ''}
                    onChange={(e) => setColumnFilters(prev => ({
                      ...prev,
                      [String(column.key)]: e.target.value
                    }))}
                    className="h-8"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );

  // Render table row
  const renderRow = useCallback((row: T, index: number) => (
    <div
      key={index}
      className={cn(
        'flex items-center border-b hover:bg-muted/50 cursor-pointer',
        selectedRows.has(index) && 'bg-muted',
        rowClassName?.(row, index)
      )}
      style={{ height: rowHeight }}
      onClick={() => onRowClick?.(row, index)}
      onDoubleClick={() => onRowDoubleClick?.(row, index)}
    >
      {selectable && (
        <div className="w-12 flex items-center justify-center p-2">
          <input
            type="checkbox"
            checked={selectedRows.has(index)}
            onChange={() => handleSelectRow(index)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-input"
          />
        </div>
      )}
      
      {visibleColumns.map((column) => (
        <div
          key={String(column.key)}
          className={cn(
            'p-2 border-r text-sm truncate',
            column.align === 'center' && 'text-center',
            column.align === 'right' && 'text-right'
          )}
          style={{
            width: column.width,
            minWidth: column.minWidth || 100,
            flex: column.width ? undefined : 1,
          }}
        >
          {renderCell(column, row, index)}
        </div>
      ))}
    </div>
  ), [visibleColumns, selectedRows, rowHeight, rowClassName, onRowClick, onRowDoubleClick, handleSelectRow, renderCell]);

  // Empty state
  if (!loading && processedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={onGlobalFilterChange ? globalFilter : internalGlobalFilter}
                onChange={(e) => {
                  if (onGlobalFilterChange) {
                    onGlobalFilterChange(e.target.value);
                  } else {
                    setInternalGlobalFilter(e.target.value);
                  }
                }}
                className="pl-9 w-64"
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                ستون‌ها
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {initialColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={String(column.key)}
                  checked={!hiddenColumns.has(String(column.key))}
                  onCheckedChange={() => toggleColumnVisibility(String(column.key))}
                >
                  {column.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <LoadingOverlay isLoading={loading} message="در حال بارگذاری...">
        <div className="relative">
          {error ? (
            <div className="p-8 text-center text-destructive">
              خطا در بارگذاری داده‌ها: {error}
            </div>
          ) : (
            <>
              {renderHeader()}
              
              {virtualized ? (
                <Virtuoso
                  data={processedData}
                  itemContent={(index, row) => renderRow(row, index)}
                  fixedItemHeight={rowHeight}
                  overscan={overscan}
                  style={{ height: 400 }}
                />
              ) : (
                <div className="max-h-96 overflow-auto">
                  {processedData.map((row, index) => renderRow(row, index))}
                </div>
              )}
            </>
          )}
        </div>
      </LoadingOverlay>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            نمایش {((pagination.page - 1) * pagination.pageSize) + 1} تا{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} از{' '}
            {pagination.total} مورد
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              قبلی
            </Button>
            
            <span className="text-sm">
              صفحه {pagination.page} از {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}