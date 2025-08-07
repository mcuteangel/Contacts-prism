"use client";

import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { MetricsOverview } from "./metrics-overview";
import { useTranslation } from "react-i18next";

// Charts: فقط در کلاینت و به‌صورت تنبل لود شوند
const GenderDistributionChart = dynamic(() => import("./charts/gender-distribution-chart").then(m => m.GenderDistributionChart), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 w-full animate-pulse rounded-md bg-muted"
      aria-busy="true"
      aria-label="loading-gender-distribution"
    />
  )
});
const PositionDistributionChart = dynamic(() => import("./charts/position-distribution-chart").then(m => m.PositionDistributionChart), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 w-full animate-pulse rounded-md bg-muted"
      aria-busy="true"
      aria-label="loading-position-distribution"
    />
  )
});
const CustomFieldsUsageChart = dynamic(() => import("./charts/custom-fields-usage-chart").then(m => m.CustomFieldsUsageChart), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 w-full animate-pulse rounded-md bg-muted"
      aria-busy="true"
      aria-label="loading-custom-fields-usage"
    />
  )
});
const PhoneTypeDistributionChart = dynamic(() => import("./charts/phone-type-distribution-chart").then(m => m.PhoneTypeDistributionChart), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 w-full animate-pulse rounded-md bg-muted"
      aria-busy="true"
      aria-label="loading-phone-type-distribution"
    />
  )
});

interface OverviewTabProps {
  totalContacts: number;
  totalGroups: number;
  totalPhoneNumbers: number;
  contactsWithAddress: number;
  contactsWithPosition: number;
  contactsWithNotes: number;
  contactsWithCustomFields: number;
  totalGrowth: string;
  monthlyGrowth: string;
  genderData: Array<{ name: string; value: number; fill: string }>;
  positionData: Array<{ name: string; value: number }>;
  customFieldsUsage: Array<{ name: string; value: number }>;
  phoneTypeData: Array<{ name: string; value: number }>;
}

export const OverviewTab = memo(function OverviewTab({
  totalContacts,
  totalGroups,
  totalPhoneNumbers,
  contactsWithAddress,
  contactsWithPosition,
  contactsWithNotes,
  contactsWithCustomFields,
  totalGrowth,
  monthlyGrowth,
  genderData,
  positionData,
  customFieldsUsage,
  phoneTypeData,
}: OverviewTabProps) {
  // جلوگیری از بازسازی غیرضروری آبجکت‌های بزرگ
  const { t } = useTranslation("common");
  const genderDataStable = useMemo(() => genderData, [genderData]);
  const positionDataStable = useMemo(() => positionData, [positionData]);
  const customFieldsUsageStable = useMemo(() => customFieldsUsage, [customFieldsUsage]);
  const phoneTypeDataStable = useMemo(() => phoneTypeData, [phoneTypeData]);

  return (
    <div className="mt-6 space-y-6">
      <section aria-label={t("analytics.overview.metricsOverview")}>
        <MetricsOverview
          totalContacts={totalContacts}
          totalGroups={totalGroups}
          totalPhoneNumbers={totalPhoneNumbers}
          contactsWithAddress={contactsWithAddress}
          contactsWithPosition={contactsWithPosition}
          contactsWithNotes={contactsWithNotes}
          contactsWithCustomFields={contactsWithCustomFields}
          totalGrowth={totalGrowth}
          monthlyGrowth={monthlyGrowth}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-label={t("analytics.overview.genderDistribution")}>
          <GenderDistributionChart genderData={genderDataStable} />
        </section>
        <section aria-label={t("analytics.overview.positionDistribution")}>
          <PositionDistributionChart positionData={positionDataStable} />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-label={t("analytics.overview.customFieldsUsage")}>
          <CustomFieldsUsageChart customFieldsUsage={customFieldsUsageStable} />
        </section>
        <section aria-label={t("analytics.overview.phoneTypeDistribution")}>
          <PhoneTypeDistributionChart phoneTypeData={phoneTypeDataStable} />
        </section>
      </div>
    </div>
  );
});