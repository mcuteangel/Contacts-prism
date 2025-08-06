"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { routesConfig, NavTab } from "@/lib/navigation";

interface MobileNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSettings: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenSettings }: MobileNavProps) {
  // فهرست ناوبری موبایل: تنظیمات را حذف می‌کنیم تا با دکمه هدر تداخل نداشته باشد
  const mobileRoutes = routesConfig.filter(r => r.key !== "settings");

  return (
    <nav
      className="fixed bottom-0 right-0 left-0 z-40 glass border-t border-border px-3 py-2 shadow-lg
                 pb-[calc(env(safe-area-inset-bottom)+8px)]"
      role="navigation"
      aria-label="ناوبری اصلی موبایل"
      dir="rtl"
    >
      <div className="flex items-center justify-around">
        {mobileRoutes
          // نمایش آیتم‌های موبایل: حذف help/settings و اطمینان از وجود insights به‌جای ai/analytics
          .filter((r) => r.key !== "help" && r.key !== "settings")
          .map((r) => {
            const isActive =
              r.key === "customFields"
                ? activeTab === "customFields" || activeTab === "globalCustomFields" || activeTab === "tools"
                : activeTab === r.key;

            return (
              <Button
                key={r.key}
                variant="ghost"
                className={cn(
                  "flex flex-col items-center gap-1 h-auto py-2 px-3 min-w-[64px] text-foreground hover:text-primary",
                  "rtl:flex-col", // اطمینان از ستون‌بندی در RTL نیز
                  isActive && "text-primary border-t-2 border-primary font-medium"
                )}
                onClick={() => onTabChange(r.key)}
                aria-current={isActive ? "page" : undefined}
                aria-label={r.ariaLabelFa}
                title={r.ariaLabelFa}
              >
                {r.icon}
                <span className="text-[11px] leading-none">{r.labelFa}</span>
              </Button>
            );
          })}
      </div>
    </nav>
  );
}