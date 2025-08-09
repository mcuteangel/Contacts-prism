"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { ContactRow, type ContactRowProps } from "./contact-list/contact-row";
import { DeviceIntegration } from "@/utils/device-integration";
import type { ContactUI, GroupUI } from "@/domain/ui-types";

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
}: ContactListProps) {
  const rowH = fixedRowHeight ?? estimatedRowHeight;

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
      const c = contacts[index];
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
      contacts,
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
    ]
  );

  if (contacts.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-muted-foreground">مخاطبی یافت نشد. برای شروع یک مخاطب جدید اضافه کنید!</p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: "70vh" }}>
      <Virtuoso
        totalCount={contacts.length}
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