"use client";

import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

// Chart را فقط در کلاینت و تنبل لود کنیم + اسکلت لودینگ سبک
const ActivityChart = dynamic(() => import("./charts/activity-chart").then(m => m.ActivityChart), {
  ssr: false,
  loading: () => (
    <div
      className="h-72 w-full animate-pulse rounded-md bg-muted"
      aria-busy="true"
      aria-label="loading-activity-chart"
    />
  )
});

interface ActivityTabProps {
  activityData: Array<{
    hour: string;
    contacts: number;
  }>;
}

export const ActivityTab = memo(function ActivityTab({ activityData }: ActivityTabProps) {
  const { t } = useTranslation("common");
  const dataStable = useMemo(() => activityData, [activityData]);

  return (
    <div className="mt-6 space-y-6">
      <section aria-label={t("analytics.activity.chart")}>
        <ActivityChart activityData={dataStable} />
      </section>
    </div>
  );
});
export default ActivityTab;