"use client";

import React, { useEffect, useState } from "react";
import { SettingsDialog } from "@/components/settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Settings, Lock, Palette, Layout, Circle, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-provider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onContactsRefreshed: () => void;
  onOpenAppLock: () => void;
  onOpenThemeSelector: () => void;
  onOpenColumnSelector: () => void;
}

function HeaderAuthStatus() {
  const { loading, user, session, role, signOut } = useAuth() as any;
  const [network, setNetwork] = useState<"online" | "offline">("offline");

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setNetwork(navigator.onLine ? "online" : "offline");
    }
    const on = () => setNetwork("online");
    const off = () => setNetwork("offline");
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // وضعیت همگام‌سازی
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // شبیه‌سازی سنک
  const handleSync = () => {
    setSyncState('syncing');
    // شبیه‌سازی تاخیر سنک
    setTimeout(() => {
      setSyncState('synced');
      setLastSynced(new Date().toLocaleTimeString('fa-IR'));
      setTimeout(() => setSyncState('idle'), 3000);
    }, 2000);
  };

  // استایل‌های وضعیت سنک
  const getSyncStatusStyles = () => {
    switch (syncState) {
      case 'syncing':
        return 'text-blue-500';
      case 'synced':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-foreground/60';
    }
  };

  return (
    <div className="w-full bg-muted/80 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-1.5 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Circle 
              size={8} 
              className={`${network === "online" ? "text-green-500" : "text-red-500"} animate-pulse`} 
            />
            <span className="hidden sm:inline">وضعیت:</span>
            <span className={`${network === "online" ? "text-green-600" : "text-red-600"} font-medium`}>
              {network === "online" ? "آنلاین" : "آفلاین"}
            </span>
          </span>
          
          <button 
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs transition-colors",
              "hover:bg-accent/50",
              getSyncStatusStyles(),
              syncState === 'syncing' && 'animate-pulse cursor-wait'
            )}
            title={lastSynced ? `آخرین همگام‌سازی: ${lastSynced}` : 'هنوز همگام‌سازی نشده'}
          >
            {syncState === 'syncing' ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>در حال همگام‌سازی...</span>
              </>
            ) : syncState === 'synced' ? (
              <>
                <CheckCircle size={12} />
                <span>همگام‌سازی شد</span>
              </>
            ) : syncState === 'error' ? (
              <>
                <AlertCircle size={12} />
                <span>خطا در همگام‌سازی</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                <span>همگام‌سازی</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="opacity-70 text-xs">در حال بارگذاری...</span>
          ) : user && session ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-foreground/80">
                {user?.email || user?.id}
              </span>
              {role && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {role}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => signOut()}
              >
                خروج
              </Button>
            </div>
          ) : (
            <span className="text-foreground/60 text-xs">وارد نشده‌اید</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Header({ 
  onContactsRefreshed, 
  onOpenAppLock, 
  onOpenThemeSelector, 
  onOpenColumnSelector 
}: HeaderProps) {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  return (
    <>
      <HeaderAuthStatus />
      <header className="sticky top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur border-b border-border shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-foreground">مخاطبین منشور</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onOpenAppLock}
                title="قفل برنامه"
                className="h-9 w-9"
              >
                <Lock size={18} />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={onOpenThemeSelector}
                title="شخصی‌سازی ظاهر"
                className="h-9 w-9"
              >
                <Palette size={18} />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={onOpenColumnSelector}
                title="شخصی‌سازی ستون‌ها"
                className="h-9 w-9"
              >
                <Layout size={18} />
              </Button>
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsDialogOpen(true)}
                title="تنظیمات"
                className="h-9 w-9"
              >
                <Settings size={18} />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <SettingsDialog
          isOpen={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          onContactsRefreshed={onContactsRefreshed}
        />
      </header>
    </>
  );
}