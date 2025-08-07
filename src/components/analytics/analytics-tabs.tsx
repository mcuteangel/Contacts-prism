"use client";

import React, { memo, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

interface AnalyticsTabsProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AnalyticsTabs = memo(function AnalyticsTabs({ children, activeTab, onTabChange }: AnalyticsTabsProps) {
  const { t } = useTranslation("common");
  const tabs = useMemo(
    () => [
      { value: "overview", label: t("analytics.tabs.overview") },
      { value: "demographics", label: t("analytics.tabs.demographics") },
      { value: "groups", label: t("analytics.tabs.groups") },
      { value: "trends", label: t("analytics.tabs.trends") },
      { value: "activity", label: t("analytics.tabs.activity") },
    ],
    [t]
  );

  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab !== activeTab) onTabChange(tab);
    },
    [activeTab, onTabChange]
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
});