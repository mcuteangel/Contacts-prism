"use client";

import React from "react";
import { TrendChart } from "../charts/trend-chart";
import { GrowthMetrics } from "./growth/growth-metrics";

interface TrendsTabProps {
  trendData: Array<{
    date: string;
    added: number;
    updated: number;
  }>;
  totalContacts: number;
  monthlyGrowth: string;
}

export function TrendsTab({ trendData, totalContacts, monthlyGrowth }: TrendsTabProps) {
  return (
    <div className="mt-6 space-y-6">
      <TrendChart trendData={trendData} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GrowthMetrics totalContacts={totalContacts} monthlyGrowth={monthlyGrowth} />
        {/* Add another chart component here if needed */}
      </div>
    </div>
  );
}