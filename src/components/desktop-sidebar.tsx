"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Users, Folder, ListPlus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

interface DesktopSidebarProps {
  activeTab: 'contacts' | 'groups' | 'customFields';
  onTabChange: (tab: 'contacts' | 'groups' | 'customFields') => void;
  onOpenSettings: () => void;
}

export function DesktopSidebar({ activeTab, onTabChange, onOpenSettings }: DesktopSidebarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null; // Only render on desktop
  }

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 p-4 pt-20 bg-sidebar/80 backdrop-blur-md border-l border-sidebar-border shadow-lg flex flex-col z-10">
      <nav className="flex flex-col gap-2">
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            activeTab === 'contacts' && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          )}
          onClick={() => onTabChange('contacts')}
        >
          <Users size={20} />
          مخاطبین
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            activeTab === 'groups' && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          )}
          onClick={() => onTabChange('groups')}
        >
          <Folder size={20} />
          گروه‌ها
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            activeTab === 'customFields' && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          )}
          onClick={() => onTabChange('customFields')}
        >
          <ListPlus size={20} />
          فیلدهای سفارشی
        </Button>
        <Separator className="my-2 bg-sidebar-border" />
        <Button
          variant="ghost"
          className="justify-start gap-3 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onOpenSettings}
        >
          <Settings size={20} />
          تنظیمات
        </Button>
      </nav>
    </aside>
  );
}