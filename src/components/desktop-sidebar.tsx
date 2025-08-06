"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { routesConfig, NavTab } from "@/lib/navigation";

interface DesktopSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function DesktopSidebar({ activeTab, onTabChange, onOpenSettings, onCollapseChange }: DesktopSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const sectionId = "desktop-nav-section";

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  return (
    <aside
      className={cn(
        "fixed top-16 right-0 h-[calc(100vh-4rem)] glass border-r border-border shadow-lg flex flex-col z-40 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      role="complementary"
      aria-label="نوار کناری ناوبری"
      dir="rtl"
    >
      <div className="p-4 flex justify-between items-center border-b border-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-foreground" id="desktop-nav-heading">منو</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-foreground hover:text-primary"
          aria-label={isCollapsed ? "باز کردن منو" : "بستن منو"}
          aria-expanded={!isCollapsed}
          aria-controls={sectionId}
        >
          {/* در RTL: با سایدبار سمت راست، جهت فلش‌ها به حالت اولیه برمی‌گردد */}
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>
      
      <nav
        id={sectionId}
        className="flex flex-col gap-2 flex-1 overflow-y-auto p-2 focus:outline-none"
        role="navigation"
        aria-label="ناوبری دسکتاپ"
        aria-labelledby={!isCollapsed ? "desktop-nav-heading" : undefined}
      >
        {routesConfig.map((route) => {
          const isActive =
            route.key === "customFields"
              ? activeTab === "customFields" || activeTab === "globalCustomFields" || activeTab === "tools"
              : activeTab === route.key;

          return (
            <div
              key={route.key}
              className={cn(
                "group relative rounded-md",
                isActive && "bg-primary/10"
              )}
            >
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3 py-2 text-foreground",
                  "hover:glass hover:bg-accent/40 hover:text-accent-foreground",
                  "backdrop-blur-lg border border-transparent hover:border-white/15",
                  "transition-colors duration-200",
                  // در RTL بهتر است متن و آیکن راست‌چین باشند
                  "text-right",
                  isActive && "bg-primary/90 text-primary-foreground hover:bg-primary"
                )}
                onClick={() => onTabChange(route.key)}
                aria-current={isActive ? "page" : undefined}
                aria-label={route.ariaLabelFa}
                title={route.ariaLabelFa}
              >
                {/* در RTL: آیکن در سمت راست، متن بعد از آن */}
                {route.icon}
                {!isCollapsed && <span className="text-sm">{route.labelFa}</span>}
              </Button>

              {isCollapsed && (
                <div
                  className={cn(
                    // با سایدبار سمت راست، لیبل شناور در سمت راست آیتم ظاهر می‌شود
                    "pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  )}
                >
                  <div className="glass px-2 py-1 rounded-md text-xs border border-white/15 shadow-lg">
                    <div className="text-foreground/90">
                      {route.labelFa}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Separator className="my-2" />
      </nav>
    </aside>
  );
}