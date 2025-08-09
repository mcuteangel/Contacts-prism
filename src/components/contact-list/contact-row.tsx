import React, { memo } from 'react';
import { ContactAvatar } from './contact-avatar';
import { ContactPhoneInfo } from './contact-phone-info';
import { ContactProfessionalInfo } from './contact-professional-info';
import { ContactMetaInfo } from './contact-meta-info';
import { ContactActions, type ContactActionsProps } from './contact-actions';
import { type ContactUI, type GroupUI, type PhoneNumberUI } from '@/domain/ui-types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ContactRowProps {
  contact: ContactUI;
  groups: GroupUI[];
  outboxById?: Record<string, { status: string; tryCount: number }>;
  onEditContact?: (contact: ContactUI) => void;
  onDeleteContact?: (id: number | string) => void;
  onShareContact?: (contact: ContactUI) => void;
  onStarContact?: (contact: ContactUI) => void;
  onPinContact?: (contact: ContactUI) => void;
  onCall?: (phoneNumber: string) => void;
  onSMS?: (phoneNumber: string) => void;
  onMaps?: (contact: ContactUI) => void;
  isStarred?: boolean;
  isPinned?: boolean;
  showStar?: boolean;
  showPin?: boolean;
  rowH?: number;
  size?: 'sm' | 'md' | 'lg';
}

// Simple compare helper to reduce re-render
function shallowEqualContactRowProps(a: ContactRowProps, b: ContactRowProps): boolean {
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
  if (a.isStarred !== b.isStarred) return false;
  if (a.isPinned !== b.isPinned) return false;
  
  return true;
}

const phoneList = (c: ContactUI): PhoneNumberUI[] =>
  Array.isArray(c.phoneNumbers) ? (c.phoneNumbers as PhoneNumberUI[]) : [];

export const ContactRow = memo(
  ({
    contact,
    groups,
    outboxById,
    onEditContact,
    onDeleteContact,
    onShareContact,
    onStarContact,
    onPinContact,
    onCall,
    onSMS,
    onMaps,
    isStarred = false,
    isPinned = false,
    showStar = true,
    showPin = true,
    rowH = 120,
    size = 'md'
  }: ContactRowProps) => {
    const groupMap = React.useMemo(() => {
      const m = new Map<string, string>();
      for (const g of groups) {
        if (g?.id != null) m.set(String(g.id), g.name ?? "");
      }
      return m;
    }, [groups]);

    const groupNameFor = React.useCallback((gid?: number | string | null) => {
      if (!gid) return undefined;
      return groupMap.get(String(gid));
    }, [groupMap]);

    const actionsProps: ContactActionsProps = {
      contact,
      onEdit: onEditContact,
      onDelete: onDeleteContact,
      onShare: onShareContact,
      onStar: onStarContact,
      onPin: onPinContact,
      isStarred,
      isPinned,
      showStar,
      showPin,
      size
    };

    return (
      <TooltipProvider>
        <div
          className="glass p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all duration-200 hover:shadow-lg hover:border-primary/20"
          style={{ height: `${rowH}px`, boxSizing: "border-box" }}
        >
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-3">
              <ContactAvatar contact={contact} className="flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg truncate">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  {outboxById && contact.id && outboxById[String(contact.id)] && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          {outboxById[String(contact.id)].status}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>وضعیت همگام‌سازی: {outboxById[String(contact.id)].status}</p>
                        <p>تلاش‌ها: {outboxById[String(contact.id)].tryCount}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {contact.conflict && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-300">
                          Conflict
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>تضاد در داده‌های مخاطب</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                <ContactPhoneInfo 
                  contact={contact} 
                  onCall={onCall}
                  onSMS={onSMS}
                  size={size}
                />
                
                <ContactProfessionalInfo 
                  contact={contact} 
                  onMaps={onMaps}
                />
                
                <ContactMetaInfo 
                  contact={contact} 
                  groups={groups}
                  groupNameFor={groupNameFor}
                />
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <ContactActions {...actionsProps} />
          </div>
        </div>
      </TooltipProvider>
    );
  },
  shallowEqualContactRowProps
);

ContactRow.displayName = "ContactRow";