"use client";

import React, { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

// Charts: فقط در کلاینت و به‌صورت تنبل لود شوند + اسکلت لودینگ سبک
const AgeDistribution = dynamic(() => import("./demographics/age-distribution").then(m => m.AgeDistribution), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-md bg-muted" aria-busy="true" aria-label="loading-age" />
});
const InteractionAnalysis = dynamic(() => import("./demographics/interaction-analysis").then(m => m.InteractionAnalysis), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-md bg-muted" aria-busy="true" aria-label="loading-interaction" />
});

interface DemographicsTabProps {
  contacts: Array<{
    phoneNumbers: Array<{ type: string }>;
    position?: string;
    address?: string;
  }>;
  totalContacts: number;
}

// جلوگیری از رندرهای غیرضروری با memo/useMemo
export const DemographicsTab = memo(function DemographicsTab({ contacts, totalContacts }: DemographicsTabProps) {
  const { t } = useTranslation("common");
  const contactsStable = useMemo(() => contacts, [contacts]);
  const totalStable = useMemo(() => totalContacts, [totalContacts]);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-label={t("analytics.demographics.ageDistribution")}>
          <AgeDistribution totalContacts={totalStable as any} />
        </section>
        <section aria-label={t("analytics.demographics.interactionAnalysis")}>
          <InteractionAnalysis contacts={contactsStable as any} totalContacts={totalStable as any} />
        </section>
      </div>
    </div>
  );
});
export default DemographicsTab;