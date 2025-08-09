import React from 'react';
import { Tag } from 'lucide-react';
import { type ContactUI, type GroupUI } from '@/domain/ui-types';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface ContactMetaInfoProps {
  contact: ContactUI;
  groups: GroupUI[];
  groupNameFor: (gid?: number | string | null) => string | undefined;
}

export function ContactMetaInfo({ contact, groups, groupNameFor }: ContactMetaInfoProps) {
  const groupMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const g of groups) {
      if (g?.id != null) m.set(String(g.id), g.name ?? "");
    }
    return m;
  }, [groups]);

  const getGroupNameFor = React.useCallback((gid?: number | string | null) => {
    if (!gid) return undefined;
    return groupMap.get(String(gid));
  }, [groupMap]);

  const groupName = getGroupNameFor(contact.groupId);

  return (
    <div className="space-y-1">
      {groupName && (
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{groupName}</span>
        </div>
      )}
      
      {Array.isArray(contact.customFields) && contact.customFields.length > 0 && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
              <span className="font-medium">{contact.customFields.length} فیلد سفارشی</span>
              <span>•</span>
              <span>برای مشاهده کلیک کنید</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">فیلدهای سفارشی</h4>
              {contact.customFields.map((cf, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-border/20 last:border-0">
                  <span className="font-medium text-xs">{cf.name}:</span>
                  <span className="text-xs text-muted-foreground">
                    {cf.value} {cf.type ? `(${cf.type})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}