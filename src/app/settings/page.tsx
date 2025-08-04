"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-primary-foreground mb-6">تنظیمات</h1>
      <div className="grid gap-4 py-4 w-full max-w-sm">
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
    </div>
  );
}