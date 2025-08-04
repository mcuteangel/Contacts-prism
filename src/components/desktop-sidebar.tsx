"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Folder, ListPlus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";

interface DesktopSidebarProps {
  activeTab: 'contacts' | 'groups' | 'customFields';
  onTabChange: (tab: 'contacts' | 'groups' | 'customFields') => void;
  onOpenSettings: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function DesktopSidebar({ activeTab, onTabChange, onOpenSettings, onCollapseChange }: DesktopSidebarProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isMobile) {
    return null; // فقط روی دسکتاپ نمایش داده شود
  }

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  return (
    <aside className={cn(
      "fixed top-0 right-0 h-screen bg-sidebar/80 backdrop-blur-md border-l border-sidebar-border shadow-lg flex flex-col z-10 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with collapse button */}
      <div className="p-4 pt-20 flex justify-between items-center border-b border-sidebar-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">منو</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-sidebar-foreground hover:text-sidebar-primary-foreground"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            activeTab === 'contacts' && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
          )}
          onClick={() => onTabChange('contacts')}
        >
          <Users size={20} />
          {!isCollapsed && <span>مخاطبین</span>}
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
          {!isCollapsed && <span>گروه‌ها</span>}
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
          {!isCollapsed && <span>فیلدهای سفارشی</span>}
        </Button>
        <Separator className={cn("my-2 bg-sidebar-border", isCollapsed && "mx-2")} />
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center"
          )}
          onClick={onOpenSettings}
        >
          <Settings size={20} />
          {!isCollapsed && <span>تنظیمات</span>}
        </Button>
      </nav>
    </aside>
  );
}