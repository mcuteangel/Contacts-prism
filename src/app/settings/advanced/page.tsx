"use client";

import React from "react";
import AdminSyncPanel from "@/components/settings/admin-sync-panel";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock } from "lucide-react";
import AppSecureLock from "@/components/security/app-secure-lock";

/**
 * SettingsAdvancedPage
 * - Advanced اکنون شامل:
 *   1) کارت «تنظیمات امنیتی (PIN/بیومتریک/قفل اپ)» با رندر مستقیم AppSecureLock
 *   2) کارت «تنظیمات مدیریتی» (بازگشت/سنک دستی)
 *   3) پنل گزارش سنک مشترک (AdminSyncPanel)
 */
export default function SettingsAdvancedPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">تنظیمات پیشرفته (ادمین)</h1>

      {/* کارت تنظیمات امنیتی (PIN و قفل اپ) */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={18} />
            تنظیمات امنیتی (PIN / قفل اپ)
          </CardTitle>
          <CardDescription>
            فعال‌سازی قفل اپ، تنظیم/تغییر PIN، بیومتریک و زمان قفل خودکار مبتنی بر بیکاری.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* AppSecureLock یک overlay کنترل‌پذیر است؛ با دکمه‌ها می‌توان وارد setup/lock شد */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.dispatchEvent(new Event("app-lock:lock"))}
              >
                نمایش/مدیریت قفل اپ
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  try {
                    localStorage.setItem("app_lock_enabled", "true");
                    window.dispatchEvent(new Event("app-lock:lock"));
                  } catch {}
                }}
              >
                فعال‌سازی و تنظیم PIN
              </Button>
            </div>
            {/* خود کامپوننت برای مدیریت overlay در DOM حضور دارد */}
            <AppSecureLock />
            <p className="text-xs text-muted-foreground">
              نکته: اگر قفل فعال باشد، پس از بی‌کاری به‌صورت خودکار قفل می‌شود. می‌توانید از دکمه بالا برای قفل فوری استفاده کنید.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* کارت تنظیمات مدیریتی (قبلی) */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={18} />
            تنظیمات مدیریتی
          </CardTitle>
          <CardDescription>
            کنترل‌های مدیریتی و میانبرها.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/settings" aria-label="بازگشت به تنظیمات">
              <Button className="w-full justify-center" variant="outline">
                بازگشت به تنظیمات
              </Button>
            </Link>
            <Button
              className="w-full justify-center"
              variant="secondary"
              aria-label="اجرای سنک دستی"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("sync:request", { detail: { reason: "advanced_page_manual" } }))
              }
            >
              سنک دستی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* پنل گزارش سنک (یکپارچه) */}
      <AdminSyncPanel pageSize={100} />
    </div>
  );
}