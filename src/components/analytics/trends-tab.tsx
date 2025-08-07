"use client";

import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

// چارت‌ها و ویجت‌ها را تنبل و فقط در کلاینت لود کن + اسکلت لودینگ سبک
const TrendChart = dynamic(() => import("./charts/trend-chart").then(m => m.TrendChart), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-md bg-muted" aria-busy="true" aria-label="loading-trend-chart" />
});
const GrowthMetrics = dynamic(() => import("./growth/growth-metrics").then(m => m.GrowthMetrics), {
  ssr: false,
  loading: () => <div className="h-40 w-full animate-pulse rounded-md bg-muted" aria-busy="true" aria-label="loading-growth-metrics" />
});

interface TrendsTabProps {
  trendData: Array<{
    date: string;
    added: number;
    updated: number;
  }>;
  totalContacts: number;
  monthlyGrowth: string;
}

export const TrendsTab = memo(function TrendsTab({ trendData, totalContacts, monthlyGrowth }: TrendsTabProps) {
  const { t } = useTranslation("common");
  const trendDataStable = useMemo(() => trendData, [trendData]);
  const totalStable = useMemo(() => totalContacts, [totalContacts]);
  const growthStable = useMemo(() => monthlyGrowth, [monthlyGrowth]);

  return (
    <div className="mt-6 space-y-6">
      <section aria-label={t("analytics.trends.trendChart")}>
        <TrendChart trendData={trendDataStable as any} />
      </section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section aria-label={t("analytics.trends.growthMetrics")}>
          <GrowthMetrics totalContacts={totalStable as any} monthlyGrowth={growthStable as any} />
        </section>
      </div>
    </div>
  );
});
export default TrendsTab;