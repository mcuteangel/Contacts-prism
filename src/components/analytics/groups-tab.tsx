"use client";

import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

// Charts/widgets: فقط در کلاینت و تنبل + اسکلت لودینگ
const GroupDistributionChart = dynamic(() => import("./groups/group-distribution-chart").then(m => m.GroupDistributionChart), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 w-full animate-pulse rounded-md bg-muted"
      aria-busy="true"
      aria-label="loading-groups-distribution"
    />
  )
});
const GroupCards = dynamic(() => import("./groups/group-cards").then(m => m.GroupCards), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 w-full animate-pulse rounded-md bg-muted"
      aria-busy="true"
      aria-label="loading-group-cards"
    />
  )
});

interface GroupsTabProps {
  groupData: Array<{
    name: string;
    contacts: number;
    fill: string;
  }>;
}

export const GroupsTab = memo(function GroupsTab({ groupData }: GroupsTabProps) {
  const { t } = useTranslation("common");
  const groupDataStable = useMemo(() => groupData, [groupData]);

  return (
    <div className="mt-6 space-y-6">
      <section aria-label={t("analytics.groups.distribution")}>
        <GroupDistributionChart groupData={groupDataStable as any} />
      </section>
      <section aria-label={t("analytics.groups.cards")}>
        <GroupCards groupData={groupDataStable as any} />
      </section>
    </div>
  );
});
export default GroupsTab;