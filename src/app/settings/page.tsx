"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sun, Moon, Monitor, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { RequireRole } from "@/components/auth/role-guard";

/**
 * Settings Page
 * - عمومی برای همه کاربران
 * - بخش «تنظیمات پیشرفته (ادمین)» به عنوان کارت جداگانه اینجا اضافه شده تا فقط برای ادمین نشان داده شود.
 */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* کارت راهنما */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle>مرکز راهنما</CardTitle>
            <CardDescription>
              پاسخ سوالات پرتکرار، راهنماها و نکات کاربردی
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/help" aria-label="رفتن به مرکز راهنما">
              <Button className="w-full justify-center gap-2" variant="outline">
                <HelpCircle size={18} />
                رفتن به راهنما
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* کارت تنظیمات پیشرفته (فقط ادمین) */}
        <RequireRole role="admin">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={18} />
                تنظیمات پیشرفته (ادمین)
              </CardTitle>
              <CardDescription>کنترل‌های امنیتی و مدیریتی اپلیکیشن</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings-advanced" aria-label="رفتن به تنظیمات پیشرفته (ادمین)">
                <Button className="w-full justify-center" variant="secondary">
                  ورود به تنظیمات پیشرفته
                </Button>
              </Link>
            </CardContent>
          </Card>
        </RequireRole>
      </div>

      {/* تنظیم تم */}
      <div className="grid gap-4 py-2 w-full max-w-sm">
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