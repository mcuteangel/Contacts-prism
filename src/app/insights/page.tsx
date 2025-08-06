"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedAnalyticsDashboard } from "@/components/enhanced-analytics-dashboard";
import { AIContactDeduplication } from "@/components/ai-contact-deduplication";
import { AIContactCategorization } from "@/components/ai-auto-categorization";

type InsightTab = "analytics" | "ai";

function useSyncedTab(defaultTab: InsightTab = "analytics") {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") as InsightTab) || defaultTab;

  const setTab = (next: InsightTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/insights?${params.toString()}`);
  };

  return [tab, setTab] as const;
}

export default function InsightsPage() {
  const [tab, setTab] = useSyncedTab("analytics");

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">بینش‌ها</h1>
        <p className="text-muted-foreground">آمار و هوش مصنوعی در یک مکان یکپارچه</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as InsightTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics">آمار</TabsTrigger>
          <TabsTrigger value="ai">هوش مصنوعی</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <EnhancedAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <div className="space-y-6">
            <AIContactDeduplication />
            <AIContactCategorization />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}