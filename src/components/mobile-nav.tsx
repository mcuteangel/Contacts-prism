"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Users, Folder, ListPlus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileNavProps {
  activeTab: 'contacts' | 'groups' | 'customFields'; // Removed 'settings' from activeTab
  onTabChange: (tab: 'contacts' | 'groups' | 'customFields') => void; // Removed 'settings' from onTabChange parameter
  onOpenSettings: () => void; // Callback to open settings dialog
}

export function MobileNav({ activeTab, onTabChange, onOpenSettings }: MobileNavProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null; // Only render on mobile
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-md border-t border-border p-2 flex justify-around items-center shadow-lg sm:hidden">
      <Button
        variant="ghost"
        className={cn("flex flex-col items-center gap-1 h-auto py-2", activeTab === 'contacts' && "text-primary")}
        onClick={() => onTabChange('contacts')}
      >
        <Users size={20} />
        <span className="text-xs">مخاطبین</span>
      </Button>
      <Button
        variant="ghost"
        className={cn("flex flex-col items-center gap-1 h-auto py-2", activeTab === 'groups' && "text-primary")}
        onClick={() => onTabChange('groups')}
      >
        <Folder size={20} />
        <span className="text-xs">گروه‌ها</span>
      </Button>
      <Button
        variant="ghost"
        className={cn("flex flex-col items-center gap-1 h-auto py-2", activeTab === 'customFields' && "text-primary")}
        onClick={() => onTabChange('customFields')}
      >
        <ListPlus size={20} />
        <span className="text-xs">فیلدهای سفارشی</span>
      </Button>
      <Button
        variant="ghost"
        className="flex flex-col items-center gap-1 h-auto py-2" // No active state for settings tab
        onClick={onOpenSettings}
      >
        <Settings size={20} />
        <span className="text-xs">تنظیمات</span>
      </Button>
    </nav>
  );
}