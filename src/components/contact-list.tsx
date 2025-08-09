"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { ContactRow, type ContactRowProps } from "./contact-list/contact-row";
import { DeviceIntegration } from "@/utils/device-integration";
import type { ContactUI, GroupUI } from "@/domain/ui-types";
import { useDragDrop, useDraggableItem, useDragDropStyles } from "@/hooks/use-drag-drop";
import { GripVertical } from "lucide-react";

// Simple interface for filters
interface ContactFilters {
  text: string;
  group: string;
  starred: boolean | undefined;
  pinned: boolean | undefined;
  dateFilters: {
    createdAt: Date | undefined;
    updatedAt: Date | undefined;
  };
  tags: string[];
}

interface ContactListProps {
  contacts: ContactUI[];
  groups: GroupUI[];
  onEditContact?: (contact: ContactUI) => void;
  onDeleteContact?: (id: number | string) => void;
  onShareContact?: (contact: ContactUI) => void;
  onStarContact?: (contact: ContactUI) => void;
  onPinContact?: (contact: ContactUI) => void;
  outboxById?: Record<string, { status: string; tryCount: number }>;
  estimatedRowHeight?: number;
  overscan?: number;
  fixedRowHeight?: number;
  starredContacts?: Set<string | number>;
  pinnedContacts?: Set<string | number>;
  showStar?: boolean;
  showPin?: boolean;
  rowSize?: 'sm' | 'md' | 'lg';
  filters?: ContactFilters;
  onFiltersChange?: (filters: ContactFilters) => void;
  onReorderContacts?: (fromIndex: number, toIndex: number) => void;
  onMoveContactToGroup?: (contactId: string | number, groupId: string | number) => void;
  enableDragDrop?: boolean;
}

export function ContactList({
  contacts,
  groups,
  onEditContact,
  onDeleteContact,
  onShareContact,
  onStarContact,
  onPinContact,
  outboxById,
  estimatedRowHeight = 120,
  overscan = 6,
  fixedRowHeight,
  starredContacts = new Set(),
  pinnedContacts = new Set(),
  showStar = true,
  showPin = true,
  rowSize = 'md',
  filters,
  onFiltersChange,
  onReorderContacts,
  onMoveContactToGroup,
  enableDragDrop = false,
}: ContactListProps) {
  const rowH = fixedRowHeight ?? estimatedRowHeight;

  // Drag and drop functionality
  const dragDrop = useDragDrop({
    onReorder: onReorderContacts,
    onMoveToGroup: onMoveContactToGroup,
  });

  // Apply filters to contacts
  const filteredContacts = useMemo(() => {
    if (!filters || Object.keys(filters).length === 0) {
      return contacts;
    }

    return contacts.filter(contact => {
      // Text search filter
      if (filters.text && filters.text.trim()) {
        const searchText = filters.text.toLowerCase();
        const searchableText = [
          contact.firstName,
          contact.lastName,
          contact.emails?.[0]?.address,
          contact.phoneNumbers?.[0]?.number,
          contact.company,
          contact.position,
          contact.address
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchText)) {
          return false;
        }
      }

      // Group filter
      if (filters.group && filters.group !== 'all') {
        const contactGroups = contact.groupId ? [contact.groupId] : [];
        if (filters.group && !contactGroups.some((groupId: string | number) => groupId === filters.group)) {
          return false;
        }
      }

      // Starred filter
      if (filters.starred !== undefined) {
        const isStarred = starredContacts.has(contact.id!);
        if (isStarred !== filters.starred) {
          return false;
        }
      }

      // Pinned filter
      if (filters.pinned !== undefined) {
        const isPinned = pinnedContacts.has(contact.id!);
        if (isPinned !== filters.pinned) {
          return false;
        }
      }

      // Date filters
      if (filters.dateFilters) {
        const { createdAt, updatedAt } = filters.dateFilters;
        
        if (createdAt) {
          const contactDate = new Date(contact.createdAt || 0);
          const filterDate = new Date(createdAt);
          if (contactDate < filterDate) {
            return false;
          }
        }

        if (updatedAt) {
          const contactDate = new Date(contact.updatedAt || 0);
          const filterDate = new Date(updatedAt);
          if (contactDate < filterDate) {
            return false;
          }
        }
      }

      // Tag filters
      if (filters.tags && filters.tags.length > 0) {
        const contactTags = contact.tags || [];
        const hasMatchingTag = filters.tags.some((tag: string) =>
          contactTags.some(contactTag =>
            contactTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, filters, starredContacts, pinnedContacts]);

  const handleCall = useCallback((phoneNumber: string) => {
    DeviceIntegration.makeCall(phoneNumber);
  }, []);

  const handleSMS = useCallback((phoneNumber: string) => {
    DeviceIntegration.sendSMS(phoneNumber);
  }, []);

  const handleMaps = useCallback((contact: ContactUI) => {
    if (contact.address) {
      DeviceIntegration.openMaps(contact.address);
    }
  }, []);

  const itemContent = useCallback(
    (index: number) => {
      const c = filteredContacts[index];
      
      if (enableDragDrop) {
        const dragItem = {
          id: c.id!,
          type: 'contact' as const,
          index,
        };
        
        const { draggableProps } = useDraggableItem(dragItem, dragDrop);
        const dragStyles = useDragDropStyles(dragDrop, dragItem);
        
        return (
          <div
            {...draggableProps}
            className={`group relative ${dragStyles}`}
            style={{
              cursor: dragDrop.isDragging ? 'grabbing' : 'grab',
              touchAction: 'manipulate',
            }}
          >
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <ContactRow
              contact={c}
              groups={groups}
              outboxById={outboxById}
              onEditContact={onEditContact}
              onDeleteContact={onDeleteContact}
              onShareContact={onShareContact}
              onStarContact={onStarContact}
              onPinContact={onPinContact}
              onCall={handleCall}
              onSMS={handleSMS}
              onMaps={handleMaps}
              isStarred={starredContacts.has(c.id!)}
              isPinned={pinnedContacts.has(c.id!)}
              showStar={showStar}
              showPin={showPin}
              rowH={rowH}
              size={rowSize}
            />
          </div>
        );
      }
      
      return (
        <ContactRow
          contact={c}
          groups={groups}
          outboxById={outboxById}
          onEditContact={onEditContact}
          onDeleteContact={onDeleteContact}
          onShareContact={onShareContact}
          onStarContact={onStarContact}
          onPinContact={onPinContact}
          onCall={handleCall}
          onSMS={handleSMS}
          onMaps={handleMaps}
          isStarred={starredContacts.has(c.id!)}
          isPinned={pinnedContacts.has(c.id!)}
          showStar={showStar}
          showPin={showPin}
          rowH={rowH}
          size={rowSize}
        />
      );
    },
    [
      filteredContacts,
      groups,
      outboxById,
      onEditContact,
      onDeleteContact,
      onShareContact,
      onStarContact,
      onPinContact,
      handleCall,
      handleSMS,
      handleMaps,
      starredContacts,
      pinnedContacts,
      showStar,
      showPin,
      rowH,
      rowSize,
      enableDragDrop,
      dragDrop,
    ]
  );

  if (filteredContacts.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-muted-foreground">
          {filters && Object.keys(filters).length > 0
            ? "موردی با فیلترهای انتخاب شده یافت نشد."
            : "مخاطبی یافت نشد. برای شروع یک مخاطب جدید اضافه کنید!"
          }
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "70vh" }}>
      <Virtuoso
        totalCount={filteredContacts.length}
        itemContent={itemContent}
        style={{ height: "70vh" }}
        increaseViewportBy={overscan * rowH}
        components={{
          List: (props) => <div {...props} className="grid gap-4" />,
        }}
      />
    </div>
  );
}

export default memo(ContactList);