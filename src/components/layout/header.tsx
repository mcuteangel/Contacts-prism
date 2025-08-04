"use client";

import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface HeaderProps {
  onContactsRefreshed: () => void;
}

export function Header({ onContactsRefreshed }: HeaderProps) {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border p-4 flex justify-between items-center shadow-lg">
      <h1 className="text-2xl font-bold text-primary-foreground">مخاطبین منشور</h1>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsSettingsDialogOpen(true)}
          className="text-foreground hover:text-primary"
        >
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

// SettingsDialog component inside header to avoid import issues
function SettingsDialog({ isOpen, onOpenChange, onContactsRefreshed }: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContactsRefreshed: () => void;
}) {
  const { theme, setTheme } = require("next-themes").useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-primary-foreground">تنظیمات</h2>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-right text-sm font-medium text-muted-foreground">تم پیش‌فرض</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className={`flex flex-col items-center justify-center p-4 h-auto ${
                  theme === "light" ? "ring-2 ring-ring ring-offset-2" : ""
                }`}
                onClick={() => setTheme("light")}
              >
                <Settings size={24} />
                <span className="mt-2 text-sm">روشن</span>
              </Button>
              <Button
                variant="outline"
                className={`flex flex-col items-center justify-center p-4 h-auto ${
                  theme === "dark" ? "ring-2 ring-ring ring-offset-2" : ""
                }`}
                onClick={() => setTheme("dark")}
              >
                <Settings size={24} />
                <span className="mt-2 text-sm">تاریک</span>
              </Button>
              <Button
                variant="outline"
                className={`flex flex-col items-center justify-center p-4 h-auto ${
                  theme === "system" ? "ring-2 ring-ring ring-offset-2" : ""
                }`}
                onClick={() => setTheme("system")}
              >
                <Settings size={24} />
                <span className="mt-2 text-sm">سیستم</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={() => onOpenChange(false)}>بستن</Button>
        </div>
      </div>
    </div>
  );
}