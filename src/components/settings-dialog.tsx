"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContactsRefreshed: () => void;
}

export function SettingsDialog({ isOpen, onOpenChange, onContactsRefreshed }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-primary-foreground">تنظیمات</h2>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label className="text-right">تم پیش‌فرض</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className={cn(
                  "flex flex-col items-center justify-center p-4 h-auto",
                  theme === "light" && "ring-2 ring-ring ring-offset-2"
                )}
                onClick={() => setTheme("light")}
              >
                <Sun size={24} />
                <span className="mt-2 text-sm">روشن</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex flex-col items-center justify-center p-4 h-auto",
                  theme === "dark" && "ring-2 ring-ring ring-offset-2"
                )}
                onClick={() => setTheme("dark")}
              >
                <Moon size={24} />
                <span className="mt-2 text-sm">تاریک</span>
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex flex-col items-center justify-center p-4 h-auto",
                  theme === "system" && "ring-2 ring-ring ring-offset-2"
                )}
                onClick={() => setTheme("system")}
              >
                <Monitor size={24} />
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