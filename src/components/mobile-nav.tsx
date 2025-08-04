"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Users, Folder, ListPlus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  activeTab: 'contacts' | 'groups' | 'customFields';
  onTabChange: (tab: 'contacts' | 'groups' | 'customFields') => void;
  onOpenSettings: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenSettings }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 glass border-t border-border p-2 flex justify-around items-center shadow-lg md:hidden">
      <Button
        variant="ghost"
        className={cn("flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary", activeTab === 'contacts' && "text-primary")}
        onClick={() => onTabChange('contacts')}
      >
        <Users size={20} />
        <span className="text-xs">مخاطبین</span>
      </Button>
      <Button
        variant="ghost"
        className={cn("flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary", activeTab === 'groups' && "text-primary")}
        onClick={() => onTabChange('groups')}
      >
        <Folder size={20} />
        <span className="text-xs">گروه‌ها</span>
      </Button>
      <Button
        variant="ghost"
        className={cn("flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary", activeTab === 'customFields' && "text-primary")}
        onClick={() => onTabChange('customFields')}
      >
        <ListPlus size={20} />
        <span className="text-xs">فیلدهای سفارشی</span>
      </Button>
      <Button
        variant="ghost"
        className="flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary"
        onClick={onOpenSettings}
      >
        <Settings size={20} />
        <span className="text-xs">تنظیمات</span>
      </Button>
    </nav>
  );
}