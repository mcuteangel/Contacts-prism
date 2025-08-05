"use client";

import React from "react";
import { SettingsDialog } from "@/components/settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Settings, Lock, Palette, Layout } from "lucide-react";

interface HeaderProps {
  onContactsRefreshed: () => void;
  onOpenAppLock: () => void;
  onOpenThemeSelector: () => void;
  onOpenColumnSelector: () => void;
}

export function Header({ 
  onContactsRefreshed, 
  onOpenAppLock, 
  onOpenThemeSelector, 
  onOpenColumnSelector 
}: HeaderProps) {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-10 glass border-b border-border p-4 flex justify-between items-center shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">مخاطبین منشور</h1>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onOpenAppLock}
          title="قفل برنامه"
        >
          <Lock size={18} />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onOpenThemeSelector}
          title="شخصی‌سازی ظاهر"
        >
          <Palette size={18} />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onOpenColumnSelector}
          title="شخصی‌سازی ستون‌ها"
        >
          <Layout size={18} />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setIsSettingsDialogOpen(true)}>
          <Settings size={18} />
        </Button>
        <ThemeToggle />
      </div>
      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        onContactsRefreshed={onContactsRefreshed}
      />
    </header>
  );
}