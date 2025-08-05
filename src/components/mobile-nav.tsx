"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Users, Folder, ListPlus, Settings, BarChart3, Brain, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  activeTab: 'contacts' | 'groups' | 'customFields' | 'globalCustomFields' | 'analytics' | 'ai' | 'help';
  onTabChange: (tab: 'contacts' | 'groups' | 'customFields' | 'globalCustomFields' | 'analytics' | 'ai' | 'help') => void;
  onOpenSettings: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenSettings }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border p-2 flex justify-around items-center shadow-lg">
      <Button
        variant="ghost"
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary",
          activeTab === 'contacts' && "text-primary"
        )}
        onClick={() => onTabChange('contacts')}
      >
        <Users size={20} />
        <span className="text-xs">مخاطبین</span>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary",
          activeTab === 'groups' && "text-primary"
        )}
        onClick={() => onTabChange('groups')}
      >
        <Folder size={20} />
        <span className="text-xs">گروه‌ها</span>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary",
          activeTab === 'customFields' && "text-primary"
        )}
        onClick={() => onTabChange('customFields')}
      >
        <ListPlus size={20} />
        <span className="text-xs">فیلدهای شخصی</span>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary",
          activeTab === 'globalCustomFields' && "text-primary"
        )}
        onClick={() => onTabChange('globalCustomFields')}
      >
        <ListPlus size={20} />
        <span className="text-xs">فیلدهای سراسری</span>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary",
          activeTab === 'analytics' && "text-primary"
        )}
        onClick={() => onTabChange('analytics')}
      >
        <BarChart3 size={20} />
        <span className="text-xs">آمار</span>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary",
          activeTab === 'ai' && "text-primary"
        )}
        onClick={() => onTabChange('ai')}
      >
        <Brain size={20} />
        <span className="text-xs">هوش مصنوعی</span>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 text-foreground hover:text-primary",
          activeTab === 'help' && "text-primary"
        )}
        onClick={() => onTabChange('help')}
      >
        <HelpCircle size={20} />
        <span className="text-xs">راهنما</span>
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