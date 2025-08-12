"use client";

import React from "react";
import {
  Users,
  Folder,
  ListPlus,
  BarChart3,
  Brain,
  HelpCircle,
  Wrench,
  SlidersHorizontal,
  LineChart,
} from "lucide-react";

export type NavTab =
  | "contacts"
  | "groups"
  | "insights"
  | "help"
  | "tools"
  | "settings"
  | "customFields"
  | "globalCustomFields";

export type RouteItem = {
  key: NavTab;
  href: string;
  labelFa: string; // Persian label - will be replaced with i18n keys in future
  icon: React.ReactNode;
  ariaLabelFa: string; // Persian aria label - will be replaced with i18n keys in future
};

export const routesConfig: RouteItem[] = [
  {
    key: "contacts",
    href: "/",
    labelFa: "مخاطبین",
    icon: <Users size={20} />,
    ariaLabelFa: "رفتن به مخاطبین",
  },
  {
    key: "groups",
    href: "/groups",
    labelFa: "گروه‌ها",
    icon: <Folder size={20} />,
    ariaLabelFa: "رفتن به گروه‌ها",
  },
  {
    key: "customFields",
    href: "/tools/custom-fields",
    labelFa: "فیلدهای سفارشی",
    icon: <ListPlus size={20} />,
    ariaLabelFa: "مدیریت فیلدهای سفارشی",
  },
  {
    key: "insights",
    href: "/insights",
    labelFa: "بینش‌ها",
    icon: <LineChart size={20} />,
    ariaLabelFa: "بینش‌ها: آمار و هوش مصنوعی",
  },
  {
    key: "help",
    href: "/help",
    labelFa: "راهنما",
    icon: <HelpCircle size={20} />,
    ariaLabelFa: "مرکز راهنما",
  },
  {
    key: "tools",
    href: "/tools",
    labelFa: "ابزار",
    icon: <Wrench size={20} />,
    ariaLabelFa: "صفحه ابزارها",
  },
  {
    key: "settings",
    href: "/settings",
    labelFa: "تنظیمات",
    icon: <SlidersHorizontal size={20} />,
    ariaLabelFa: "تنظیمات برنامه",
  },
];

// Map pathname to active tab
export function mapPathnameToTab(pathname: string): NavTab {
  if (pathname === "/") return "contacts";
  if (pathname.startsWith("/groups")) return "groups";
  if (pathname.startsWith("/tools/custom-fields")) return "customFields";
  if (pathname.startsWith("/tools")) return "tools";
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/analytics")) return "insights";
  if (pathname.startsWith("/ai")) return "insights";
  if (pathname.startsWith("/help")) return "help";
  if (pathname.startsWith("/settings")) return "settings";
  return "settings";
}

// Get href by tab
export function getHrefByTab(tab: NavTab): string {
  const item = routesConfig.find((r) => r.key === tab);
  return item?.href ?? "/settings";
}

// Build a click handler that routes properly
export function buildOnTabChange(navigate: (href: string) => void) {
  return (tab: NavTab) => {
    const href = getHrefByTab(tab === "globalCustomFields" ? "customFields" : tab);
    navigate(href);
  };
}