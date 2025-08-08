"use client";

import React, { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SettingsDialog } from "@/components/settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Settings, Lock, Palette, Layout, User, LogIn, LogOut } from "lucide-react";
import { mapPathnameToTab } from "@/lib/navigation";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useAuth } from "@/context/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onContactsRefreshed: () => void;
  onOpenAppLock: () => void;
  onOpenThemeSelector: () => void;
  onOpenColumnSelector: () => void;
}

const faTitles: Record<string, string> = {
  contacts: "مخاطبین",
  groups: "گروه‌ها",
  analytics: "آنالیتیکس",
  insights: "نگاه کلان",
  ai: "دستیار هوشمند",
  help: "راهنما",
  tools: "ابزارها",
  customFields: "فیلدهای سفارشی",
  globalCustomFields: "فیلدهای سراسری",
  settings: "تنظیمات",
  "": "خانه",
  home: "خانه",
};

export function HeaderAuthStatus({
  onContactsRefreshed,
  onOpenAppLock,
  onOpenThemeSelector,
  onOpenColumnSelector
}: HeaderProps) {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("");
  const [network, setNetwork] = React.useState<"online" | "offline">("offline");
  const pathname = usePathname();
  const router = useRouter();
  const activeKey = mapPathnameToTab(pathname) || "";
  const activeTitle = faTitles[activeKey] ?? "مخاطبین منشور";
  const isMobile = useIsMobile();
  const { loading, user, session, role, signOut } = useAuth() as any;

  // Update network status on mount and add event listeners
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetwork(navigator.onLine ? "online" : "offline");
    };

    // Set initial status
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const goToAdvancedSettings = React.useCallback(() => {
    // لینک مستقیم به صفحه تنظیمات پیشرفته
    router.push("/settings-advanced");
  }, [router]);

  // منطق Toggle برای آیکن تنظیمات موبایل:
  // - اگر روی /settings هستیم → با کلیک دوباره، یک گام به عقب برگرد.
  // - اگر در صفحه‌ای غیر از /settings هستیم → به /settings برو.
  const onMobileSettingsClick = React.useCallback(() => {
    const isOnSettings = pathname === "/settings";
    if (isOnSettings) {
      router.back();
    } else {
      router.push("/settings");
    }
  }, [pathname, router]);

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 glass border-b border-white/10 bg-background/60 backdrop-blur-lg px-4 h-16 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      role="banner"
      aria-label="سربرگ برنامه"
      dir="rtl"
    >
      {/* لوگو */}
      <div className="flex items-center h-full">
        <div className="h-10 w-10 rounded-lg bg-background/30 dark:bg-background/50 backdrop-blur-md border border-white/10 flex items-center justify-center p-1.5">
          <img 
            src="/images/prism_contacts_glassmorphism.svg" 
            alt="لوگوی مخاطبین منشور" 
            className={`
              h-full w-auto object-contain 
              dark:invert dark:brightness-100 dark:contrast-100 dark:saturate-100
              transition-all duration-200
            `}
          />
        </div>
      </div>

      <div className="flex-1 px-4 flex justify-center">
        <h2 className="text-lg font-medium text-foreground">
          {faTitles[activeKey] || 'مخاطبین منشور'}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* ابزارها */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    try {
                      const enabled = typeof window !== "undefined" && localStorage.getItem("app_lock_enabled") === "true";
                      if (enabled) {
                        window.dispatchEvent(new Event("app-lock:lock"));
                      } else {
                        localStorage.setItem("app_lock_enabled", "true");
                        window.dispatchEvent(new Event("app-lock:lock"));
                      }
                    } catch {}
                  }}
                >
                  <Lock size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">قفل برنامه</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onOpenThemeSelector}
                >
                  <Palette size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">تغییر تم</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={onOpenColumnSelector}
                >
                  <Layout size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">شخصی‌سازی ستون‌ها</TooltipContent>
            </Tooltip>

            {isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={pathname === "/settings" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={onMobileSettingsClick}
                  >
                    <Settings size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {pathname === "/settings" ? "بستن تنظیمات" : "تنظیمات"}
                </TooltipContent>
              </Tooltip>
            )}

            <ThemeToggle />
          </TooltipProvider>
        </div>

        {/* جداکننده */}
        <div className="h-6 w-px bg-border mx-1" aria-hidden="true" />

        {/* بخش کاربر */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          ) : user && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || user?.email} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 
                       user?.email ? user.email.charAt(0).toUpperCase() : 
                       <User size={16} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || user?.email} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 
                       user?.email ? user.email.charAt(0).toUpperCase() : 
                       <User size={16} />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {role || 'کاربر'}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>خروج از حساب کاربری</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push('/login')}
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">ورود</span>
            </Button>
          )}
        </div>
      </div>

      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        onContactsRefreshed={onContactsRefreshed}
      />
    </header>
  );
}