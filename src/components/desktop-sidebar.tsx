"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Folder, ListPlus, Settings, ChevronLeft, ChevronRight, BarChart3, Brain, HelpCircle, Wrench, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface DesktopSidebarProps {
  activeTab: 'contacts' | 'groups' | 'customFields' | 'globalCustomFields' | 'analytics' | 'ai' | 'help' | 'tools' | 'settings';
  onTabChange: (tab: 'contacts' | 'groups' | 'customFields' | 'globalCustomFields' | 'analytics' | 'ai' | 'help' | 'tools' | 'settings') => void;
  onOpenSettings: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function DesktopSidebar({ activeTab, onTabChange, onOpenSettings, onCollapseChange }: DesktopSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

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
          {!isCollapsed && <span className="text-sm">فیلدهای شخصی</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'globalCustomFields' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('globalCustomFields')}
        >
          <ListPlus size={20} />
          {!isCollapsed && <span className="text-sm">فیلدهای سراسری</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'analytics' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('analytics')}
        >
          <BarChart3 size={20} />
          {!isCollapsed && <span className="text-sm">آمار و تحلیل</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'ai' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('ai')}
        >
          <Brain size={20} />
          {!isCollapsed && <span className="text-sm">هوش مصنوعی</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'help' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('help')}
        >
          <HelpCircle size={20} />
          {!isCollapsed && <span className="text-sm">راهنما</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'tools' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('tools')}
        >
          <Wrench size={20} />
          {!isCollapsed && <span className="text-sm">ابزارspan>}
        </Button>
        <Separator className="my-2" />
        <Button
          variant="ghost"
          className={cn(
            "justify-start gap-3 px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
            activeTab === 'settings' && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          )}
          onClick={() => onTabChange('settings')}
        >
          <SlidersHorizontal size={20} />
          {!isCollapsed && <span className="text-sm">تنظیمات</span>}
        </Button>
      </nav>
    </aside>
  );
}