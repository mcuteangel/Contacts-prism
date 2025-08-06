"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SettingsDialog } from "@/components/settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Settings, Lock, Palette, Layout } from "lucide-react";
import { mapPathnameToTab } from "@/lib/navigation";
import { useIsMobile } from "@/hooks/use-is-mobile";

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

export function Header({
  onContactsRefreshed,
  onOpenAppLock,
  onOpenThemeSelector,
  onOpenColumnSelector
}: HeaderProps) {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeKey = mapPathnameToTab(pathname) || "";
  const activeTitle = faTitles[activeKey] ?? "مخاطبین منشور";
  const isMobile = useIsMobile();

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
      className="fixed top-0 right-0 left-0 z-50 glass border-b border-white/10 bg-background/60 backdrop-blur-lg px-4 py-3 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
      role="banner"
      aria-label="سربرگ برنامه"
      dir="rtl"
    >
      {/* در RTL، ترتیب بصری: آیکن‌ها سمت چپ، عنوان سمت راست */}
      <h1 className="text-2xl font-bold text-foreground mr-0 ml-auto">
        <span className="sr-only">عنوان صفحه:</span>
        {activeTitle}
      </h1>

      <div className="flex items-center gap-2 ml-0 mr-auto">
        <div className="flex items-center gap-2">
          {/* قفل برنامه با استفاده از رویداد سراسری AppSecureLock */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              try {
                const enabled = typeof window !== "undefined" && localStorage.getItem("app_lock_enabled") === "true";
                if (enabled) {
                  // اگر فعال است، مستقیم وارد حالت قفل شو
                  window.dispatchEvent(new Event("app-lock:lock"));
                } else {
                  // اگر فعال نیست، ابتدا فعال و وارد setup شو
                  localStorage.setItem("app_lock_enabled", "true");
                  window.dispatchEvent(new Event("app-lock:lock"));
                }
              } catch {}
            }}
            title="قفل برنامه"
            aria-label="قفل برنامه"
          >
            <Lock size={18} aria-hidden="true" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onOpenThemeSelector}
            title="شخصی‌سازی ظاهر"
            aria-label="شخصی‌سازی ظاهر"
          >
            <Palette size={18} aria-hidden="true" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onOpenColumnSelector}
            title="شخصی‌سازی ستون‌ها"
            aria-label="شخصی‌سازی ستون‌ها"
          >
            <Layout size={18} aria-hidden="true" />
          </Button>

          {/* قفل برنامه با استفاده از رویداد سراسری AppSecureLock - دکمه‌های دیگر بدون تغییر */}

          {/* اگر دستگاه موبایل است (و ناوبری موبایل فعال است)، یک میانبر تنظیمات نشان بده
              رفتار: اگر در /settings بودیم با کلیک دوباره به صفحه قبلی برمی‌گردد (Toggle) */}
          {isMobile && (
            <Button
              variant={pathname === "/settings" ? "default" : "outline"}
              size="icon"
              onClick={onMobileSettingsClick}
              title={pathname === "/settings" ? "بازگشت از تنظیمات" : "تنظیمات"}
              aria-label="تنظیمات"
            >
              <Settings size={18} aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

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