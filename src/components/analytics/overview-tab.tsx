"use client";

import React from "react";
import { MetricsOverview } from "./metrics-overview";
import { GenderDistributionChart } from "./charts/gender-distribution-chart";
import { PositionDistributionChart } from "./charts/position-distribution-chart";
import { CustomFieldsUsageChart } from "./charts/custom-fields-usage-chart";
import { PhoneTypeDistributionChart } from "./charts/phone-type-distribution-chart";

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
  genderData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  positionData: Array<{
    name: string;
    value: number;
  }>;
  customFieldsUsage: Array<{
    name: string;
    value: number;
  }>;
  phoneTypeData: Array<{
    name: string;
    value: number;
  }>;
}

export function OverviewTab({
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
  phoneTypeData
}: OverviewTabProps) {
  return (
    <div className="mt-6 space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GenderDistributionChart genderData={genderData} />
        <PositionDistributionChart positionData={positionData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomFieldsUsageChart customFieldsUsage={customFieldsUsage} />
        <PhoneTypeDistributionChart phoneTypeData={phoneTypeData} />
      </div>
    </div>
  );
}