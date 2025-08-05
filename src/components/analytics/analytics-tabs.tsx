"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsTabsProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AnalyticsTabs({ children, activeTab, onTabChange }: AnalyticsTabsProps) {
  const tabs = [
    { value: "overview", label: "نمای کلی" },
    { value: "demographics", label: "جمعیت‌شناسی" },
    { value: "groups", label: "گروه‌ها" },
    { value: "trends", label: "روندها" },
    { value: "activity", label: "فعالیت" }
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}