"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sun, Moon, Monitor, Shield, RefreshCw, WifiOff, Wifi, ListOrdered, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { RequireRole } from "@/components/auth/role-guard";
import { db, type OutboxItem } from "@/database/db";
import AdminSyncPanel from "@/components/settings/admin-sync-panel";

/**
 * Settings Page
 * - عمومی برای همه کاربران
 * - بخش «تنظیمات پیشرفته (ادمین)» به عنوان کارت جداگانه اینجا اضافه شده تا فقط برای ادمین نشان داده شود.
 * - شامل کارت «همگام‌سازی» برای سنک دستی/نمایش وضعیت پایه
 * - افزوده شد: کارت «وضعیت Outbox» برای مشاهده صف آفلاین و لاگ ساده عملیات
 */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Outbox state
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [outboxLoading, setOutboxLoading] = useState(false);

  // همگام با تغییر وضعیت شبکه
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // تریگر دستی سنک: از CustomEvent برای درخواست سنک از SyncBootstrapper استفاده می‌کنیم
  const handleManualSync = useCallback(async () => {
    setError(null);
    setSyncing(true);
    try {
      window.dispatchEvent(new CustomEvent("sync:request", { detail: { reason: "manual_settings" } }));
      // بازخورد فوری UI
      await new Promise((r) => setTimeout(r, 400));
      setLastSyncAt(new Date().toISOString());
      // بعد از تریگر سنک، وضعیت Outbox را نیز تازه کنیم
      refreshOutbox();
    } catch (e: any) {
      setError(e?.message ?? "sync failed");
    } finally {
      setSyncing(false);
    }
  }, []);

  const refreshOutbox = useCallback(async () => {
    try {
      setOutboxLoading(true);
      const items = await db.outbox_queue.orderBy("clientTime").toArray();
      setOutbox(items.reverse()); // جدیدترین بالا
    } catch (e) {
      console.error("load outbox failed:", e);
    } finally {
      setOutboxLoading(false);
    }
  }, []);

  // بارگذاری اولیه Outbox + رفرش هنگام visibilitychange برای رصد سبک
  useEffect(() => {
    refreshOutbox();
    const vis = () => {
      if (document.visibilityState === "visible") refreshOutbox();
    };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [refreshOutbox]);

  // آمار خلاصه Outbox
  const outboxStats = useMemo(() => {
    const total = outbox.length;
    const queued = outbox.filter((i) => i.status === "queued").length;
    const sending = outbox.filter((i) => i.status === "sending").length;
    const errorC = outbox.filter((i) => i.status === "error").length;
    const done = outbox.filter((i) => i.status === "done").length;
    return { total, queued, sending, error: errorC, done };
  }, [outbox]);

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">تنظیمات</h1>
      {/* لنگر تب ادمین برای scrollIntoView */}
      <div id="tab-sync" className="h-0 w-0 overflow-hidden" aria-hidden="true" />

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
              <CardDescription>کنترل‌های امنیتی و مدیریتی اپلیکیشن + گزارش‌های سنک</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <Link href="/settings/advanced" aria-label="رفتن به گزارش سنک (ادمین)">
                  <Button
                    className="w-full justify-center"
                    variant="secondary"
                  >
                    رفتن به گزارش سنک (ادمین)
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                اگر تب داخلی بارگذاری نشد، از لینک بالا به نمای یکسان «Advanced» بروید.
              </p>
            </CardContent>
          </Card>
        </RequireRole>

        {/* کارت همگام‌سازی */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {online ? <Wifi size={18} className="text-green-600" /> : <WifiOff size={18} className="text-red-600" />}
              همگام‌سازی
            </CardTitle>
            <CardDescription>
              سنک دستی داده‌ها و مشاهده وضعیت پایه (شبکه/آخرین سنک). در فاز ۲ به سنک کامل وصل می‌شود.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>وضعیت شبکه:</span>
              <span className={online ? "text-green-600" : "text-red-600"}>{online ? "آنلاین" : "آفلاین"}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              آخرین همگام‌سازی:{" "}
              {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "هنوز انجام نشده"}
            </div>
            {error ? (
              <div className="text-sm text-red-600">خطا: {error}</div>
            ) : null}
            <div className="flex gap-2">
              <Button
                onClick={handleManualSync}
                disabled={syncing || !online}
                className="gap-2"
                variant="outline"
                aria-label="اجرای سنک دستی"
              >
                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                {syncing ? "در حال سنک..." : "سنک دستی"}
              </Button>
              {!online && (
                <span className="text-xs text-muted-foreground self-center">
                  برای سنک، اتصال اینترنت لازم است.
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* کارت وضعیت Outbox */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered size={18} />
              وضعیت Outbox (آفلاین)
            </CardTitle>
            <CardDescription>صف عملیات آفلاین آماده برای Push در فاز ۲</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>مجموع:</span>
              <span className="font-medium">{outboxStats.total}</span>
              <span className="mx-1">|</span>
              <span className="text-blue-600">Queued: {outboxStats.queued}</span>
              <span className="text-amber-600">Sending: {outboxStats.sending}</span>
              <span className="text-red-600">Error: {outboxStats.error}</span>
              <span className="text-green-600">Done: {outboxStats.done}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshOutbox} aria-label="بازخوانی Outbox">
                بازخوانی
              </Button>
              <Button
                variant="destructive"
                size="sm"
                aria-label="پاک‌سازی آیتم‌های Done"
                onClick={async () => {
                  try {
                    const doneItems = await db.outbox_queue.where("status").equals("done").toArray();
                    if (doneItems.length === 0) return;
                    await db.transaction("rw", db.outbox_queue, async () => {
                      for (const it of doneItems) {
                        if (it.id != null) await db.outbox_queue.delete(it.id);
                      }
                    });
                    await refreshOutbox();
                  } catch (e) {
                    console.error("clear done outbox failed:", e);
                  }
                }}
              >
                <Trash2 size={16} className="mr-1" /> پاک‌سازی Done
              </Button>
            </div>

            <div className={cn("rounded-md border p-2 max-h-64 overflow-auto", outboxLoading && "opacity-70")}>
              {outboxLoading ? (
                <div className="text-sm text-muted-foreground">در حال بارگذاری...</div>
              ) : outbox.length === 0 ? (
                <div className="text-sm text-muted-foreground">صف Outbox خالی است.</div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {outbox.slice(0, 50).map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.entity}/{item.op} • <span className="uppercase">{item.status}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(item.clientTime).toLocaleString()} • try#{item.tryCount}
                        </div>
                        <pre className="mt-1 bg-muted/30 rounded p-2 overflow-auto max-h-24">
{JSON.stringify(item.payload, null, 2)}
                        </pre>
                      </div>
                      {item.status === "error" ? (
                        <span className="text-red-600 whitespace-nowrap ml-2">خطا</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
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