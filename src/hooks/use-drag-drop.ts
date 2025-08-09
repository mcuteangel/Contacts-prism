/**
 * Hook برای مدیریت قابلیت‌های کشیدن و رها کردن (Drag and Drop)
 * 
 * این hook امکانات زیر را فراهم می‌کند:
 * - کشیدن آیتم‌ها (contacts, groups)
 * - رها کردن آیتم‌ها در مکان‌های مختلف
 * - مرتب‌سازی مجدد آیتم‌ها
 * - مدیریت استایل‌های بصری در حین drag and drop
 */

import { useState, useCallback, useRef } from 'react';

interface DragItem {
  id: string | number;
  type: 'contact' | 'group';
  index: number;
}

interface DragDropResult {
  // وضعیت drag and drop
  isDragging: boolean;
  dragItem: DragItem | null;
  dragOverItem: DragItem | null;
  
  // عملیات
  handleDragStart: (item: DragItem, event: React.DragEvent) => void;
  handleDragEnter: (item: DragItem, event: React.DragEvent) => void;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => void;
  handleDragEnd: (event: React.DragEvent) => void;
  
  // کمکی‌ها
  getDragPreview: () => string | null;
}

interface UseDragDropOptions {
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onMoveToGroup?: (contactId: string | number, groupId: string | number) => void;
  onGroupReorder?: (fromIndex: number, toIndex: number) => void;
}

export function useDragDrop(options: UseDragDropOptions = {}): DragDropResult {
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<DragItem | null>(null);
  const dragPreviewRef = useRef<string | null>(null);

  const { onReorder, onMoveToGroup, onGroupReorder } = options;

  // شروع کشیدن آیتم
  const handleDragStart = useCallback((item: DragItem, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(item));
    
    // ذخیره اطلاعات آیتم برای preview
    dragPreviewRef.current = JSON.stringify(item);
    
    setDragItem(item);
    setIsDragging(true);
    
    // تنظیم استایل‌های بصری
    event.currentTarget.classList.add('opacity-50', 'scale-95');
  }, []);

  // ورود به آیتم مقصد
  const handleDragEnter = useCallback((item: DragItem, event: React.DragEvent) => {
    event.preventDefault();
    setDragOverItem(item);
    
    // تنظیم استایل‌های بصری
    event.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
  }, []);

  // حرکت روی آیتم مقصد
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // خروج از آیتم مقصد
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
  }, []);

  // رها کردن آیتم
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!dragItem || !dragOverItem) return;
    
    // حذف استایل‌های بصری
    document.querySelectorAll('.bg-blue-50, .dark\\:bg-blue-900\\/20').forEach(el => {
      el.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
    });
    
    // اگر هر دو آیتم از نوع contact هستند و در لیست یکسان هستند
    if (dragItem.type === 'contact' && dragOverItem.type === 'contact' && dragItem !== dragOverItem) {
      const fromIndex = dragItem.index;
      const toIndex = dragOverItem.index;
      
      if (onReorder) {
        onReorder(fromIndex, toIndex);
      }
    }
    
    // اگر آیتم مخاطب است و روی گروه رها می‌شود
    if (dragItem.type === 'contact' && dragOverItem.type === 'group') {
      if (onMoveToGroup) {
        onMoveToGroup(dragItem.id, dragOverItem.id);
      }
    }
    
    // اگر هر دو آیتم از نوع group هستند
    if (dragItem.type === 'group' && dragOverItem.type === 'group' && dragItem !== dragOverItem) {
      const fromIndex = dragItem.index;
      const toIndex = dragOverItem.index;
      
      if (onGroupReorder) {
        onGroupReorder(fromIndex, toIndex);
      }
    }
    
    setDragOverItem(null);
  }, [dragItem, dragOverItem, onReorder, onMoveToGroup, onGroupReorder]);

  // پایان کشیدن
  const handleDragEnd = useCallback((event: React.DragEvent) => {
    // حذف استایل‌های بصری
    document.querySelectorAll('.opacity-50, .scale-95, .bg-blue-50, .dark\\:bg-blue-900\\/20').forEach(el => {
      el.classList.remove('opacity-50', 'scale-95', 'bg-blue-50', 'dark:bg-blue-900/20');
    });
    
    setDragItem(null);
    setDragOverItem(null);
    setIsDragging(false);
    dragPreviewRef.current = null;
  }, []);

  // دریافت preview برای drag and drop
  const getDragPreview = useCallback(() => {
    return dragPreviewRef.current;
  }, []);

  return {
    isDragging,
    dragItem,
    dragOverItem,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDragPreview,
  };
}

// Hook کمکی برای استفاده در کامپوننت‌های قابل کشیدن
export function useDraggableItem(item: DragItem, dragDrop: DragDropResult) {
  const draggableProps = {
    draggable: true,
    onDragStart: (event: React.DragEvent) => dragDrop.handleDragStart(item, event),
    onDragEnter: (event: React.DragEvent) => dragDrop.handleDragEnter(item, event),
    onDragOver: dragDrop.handleDragOver,
    onDragLeave: dragDrop.handleDragLeave,
    onDrop: dragDrop.handleDrop,
    onDragEnd: dragDrop.handleDragEnd,
  };

  return { draggableProps };
}

// Hook کمکی برای استایل‌های بصری در حین drag and drop
export function useDragDropStyles(dragDrop: DragDropResult, item: DragItem) {
  const isDragItem = dragDrop.dragItem?.id === item.id && dragDrop.dragItem?.type === item.type;
  const isDragOverItem = dragDrop.dragOverItem?.id === item.id && dragDrop.dragOverItem?.type === item.type;
  
  const baseStyles = "transition-all duration-200 ease-in-out";
  const dragStyles = isDragItem 
    ? "opacity-50 scale-95 shadow-lg border-2 border-blue-400" 
    : isDragOverItem
    ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400"
    : "hover:bg-gray-50 dark:hover:bg-gray-800";
  
  return `${baseStyles} ${dragStyles}`;
}