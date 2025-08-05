"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Folder, ListPlus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface DesktopSidebarProps {
  activeTab: 'contacts' | 'groups' | 'customFields';
  onTabChange: (tab: 'contacts' | 'groups' | 'customFields') => void;
  onOpenSettings: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function DesktopSidebar({ activeTab, onTabChange, onOpenSettings, onCollapseChange }: DesktopSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  return (
    <aside className={cn(
      "fixed top-0 right-0 h-screen glass border-r border-border shadow-lg flex flex-col z-40 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with collapse button */}
      <div className="p-4 pt-20 flex justify-between items-center border-b border-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-foreground">منو</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-foreground hover:text-primary"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto p-2">
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'contacts' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('contacts')}
        >
          <Users size={20} />
          {!isCollapsed && <span className="text-sm">مخاطبین</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'groups' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('groups')}
        >
          <Folder size={20} />
          {!isCollapsed && <span className="text-sm">گروه‌ها</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'customFields' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('customFields')}
        >
          <ListPlus size={20} />
          {!isCollapsed && <span className="text-sm">فیلدهای سفارشی</span>}
        </Button>
        <Separator className="my-2" />
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            isCollapsed && "justify-center"
          )}
          onClick={onOpenSettings}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="text-sm">تنظیمات</span>}
        </Button>
      </nav>
    </aside>
  );
}