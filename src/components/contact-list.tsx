"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Phone, Tag, MapPin, Briefcase, MessageSquare, Share2 } from "lucide-react";
import { DeviceIntegration } from "@/utils/device-integration";
import type { ContactUI, GroupUI, PhoneNumberUI } from "@/domain/ui-types";
import { Virtuoso } from "react-virtuoso";

// Row props
type RowProps = {
  contact: ContactUI;
  outboxById?: Record<string, { status: string; tryCount: number }>;
  groupNameFor: (gid?: number | string | null) => string | undefined;
  handleCall: (phoneNumber: string) => void;
  handleSMS: (phoneNumber: string) => void;
  handleMaps: (contact: ContactUI) => void;
  handleShare: (contact: ContactUI) => void;
  onEditContact: (contact: ContactUI) => void;
  onDeleteContact: (id: number | string) => void;
  rowH: number;
};

// shallow compare helper to کاهش re-render
function shallowEqualRowProps(a: RowProps, b: RowProps): boolean {
  const aid = a.contact.id ? String(a.contact.id) : "";
  const bid = b.contact.id ? String(b.contact.id) : "";
  if (aid !== bid) return false;
  if (a.contact.firstName !== b.contact.firstName) return false;
  if (a.contact.lastName !== b.contact.lastName) return false;
  if (a.contact.position !== b.contact.position) return false;
  if (a.contact.address !== b.contact.address) return false;
  if (String(a.contact.groupId ?? "") !== String(b.contact.groupId ?? "")) return false;
  const al = Array.isArray(a.contact.phoneNumbers) ? a.contact.phoneNumbers.length : 0;
  const bl = Array.isArray(b.contact.phoneNumbers) ? b.contact.phoneNumbers.length : 0;
  if (al !== bl) return false;
  const a0 = al > 0 ? (a.contact.phoneNumbers as any)[0]?.number : undefined;
  const b0 = bl > 0 ? (b.contact.phoneNumbers as any)[0]?.number : undefined;
  if (a0 !== b0) return false;
  if (Boolean(a.contact.conflict) !== Boolean(b.contact.conflict)) return false;
  const ax = a.outboxById?.[aid];
  const bx = b.outboxById?.[bid];
  if (!!ax !== !!bx) return false;
  if (ax && bx && (ax.status !== bx.status || ax.tryCount !== bx.tryCount)) return false;
  if (a.rowH !== b.rowH) return false;
  return true;
}

const phoneList = (c: ContactUI): PhoneNumberUI[] =>
  Array.isArray(c.phoneNumbers) ? (c.phoneNumbers as PhoneNumberUI[]) : [];

const Row = memo(
  ({
    contact,
    outboxById,
    groupNameFor,
    handleCall,
    handleSMS,
    handleMaps,
    handleShare,
    onEditContact,
    onDeleteContact,
    rowH,
  }: RowProps) => (
    <div
      className="glass p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
      style={{ height: `${rowH}px`, boxSizing: "border-box" }}
    >
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">
            {contact.firstName} {contact.lastName}
          </h3>
          {outboxById && contact.id && outboxById[String(contact.id)] ? (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
              {outboxById[String(contact.id)].status}
            </span>
          ) : null}
          {contact.conflict ? (
            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-300">Conflict</span>
          ) : null}
        </div>
        {phoneList(contact).length > 0 && (
          <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-2">
            <Phone size={14} className="ml-1" />
            {phoneList(contact).map((pn, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span>
                  {pn.type}: {pn.number}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCall(pn.number)}
                  title="تماس"
                >
                  <Phone size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => handleSMS(pn.number)}
                  title="ارسال پیامک"
                >
                  <MessageSquare size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
        {contact.position ? (
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            <Briefcase size={14} className="ml-1" /> {contact.position}
          </p>
        ) : null}
        {contact.address ? (
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            <MapPin size={14} className="ml-1" /> {contact.address}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 ml-1"
              onClick={() => handleMaps(contact)}
              title="نمایش در نقشه"
            >
              <MapPin size={12} />
            </Button>
          </p>
        ) : null}
        {contact.groupId && groupNameFor(contact.groupId) ? (
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            <Tag size={14} className="ml-1" /> {groupNameFor(contact.groupId)}
          </p>
        ) : null}
        {Array.isArray(contact.customFields) && contact.customFields.length > 0 ? (
          <div className="text-xs text-muted-foreground mt-1">
            {contact.customFields.map((cf, idx) => (
              <p key={idx}>
                <span className="font-medium">{cf.name}:</span> {cf.value} {cf.type ? `(${cf.type})` : ""}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button variant="outline" size="icon" onClick={() => onEditContact(contact)}>
          <Edit size={16} />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleShare(contact)}>
          <Share2 size={16} />
        </Button>
        <Button variant="destructive" size="icon" onClick={() => onDeleteContact(String(contact.id!))}>
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  ),
  shallowEqualRowProps
);
Row.displayName = "ContactListRow";

interface ContactListProps {
  contacts: ContactUI[];
  groups: GroupUI[];
  onEditContact: (contact: ContactUI) => void;
  onDeleteContact: (id: number | string) => void;
  outboxById?: Record<string, { status: string; tryCount: number }>;
  estimatedRowHeight?: number; // px
  overscan?: number; // number of items to render beyond viewport
  fixedRowHeight?: number; // px - اگر ست شود، ارتفاع ردیف ثابت می‌شود
}

export function ContactList({
  contacts,
  groups,
  onEditContact,
  onDeleteContact,
  outboxById,
  estimatedRowHeight = 88,
  overscan = 6,
  fixedRowHeight,
}: ContactListProps) {
  const rowH = fixedRowHeight ?? estimatedRowHeight;

  const groupMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of groups) {
      if (g?.id != null) m.set(String(g.id), g.name ?? "");
    }
    return m;
  }, [groups]);

  const groupNameFor = useCallback(
    (gid?: number | string | null) => {
      if (!gid) return undefined;
      return groupMap.get(String(gid));
    },
    [groupMap]
  );

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

  const handleShare = useCallback((contact: ContactUI) => {
    DeviceIntegration.shareContact({
      ...contact,
      id: contact.id ? String(contact.id) : undefined,
    } as any);
  }, []);

  const itemContent = useCallback(
    (index: number) => {
      const c = contacts[index];
      return (
        <Row
          contact={c}
          outboxById={outboxById}
          groupNameFor={groupNameFor}
          handleCall={handleCall}
          handleSMS={handleSMS}
          handleMaps={handleMaps}
          handleShare={handleShare}
          onEditContact={onEditContact}
          onDeleteContact={onDeleteContact}
          rowH={rowH}
        />
      );
    },
    [
      contacts,
      outboxById,
      groupNameFor,
      handleCall,
      handleSMS,
      handleMaps,
      handleShare,
      onEditContact,
      onDeleteContact,
      rowH,
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