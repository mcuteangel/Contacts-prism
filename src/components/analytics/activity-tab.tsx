"use client";

import React from "react";
import { ActivityChart } from "../charts/activity-chart";

interface ActivityTabProps {
  activityData: Array<{
    hour: string;
    contacts: number;
  }>;
}

export function ActivityTab({ activityData }: ActivityTabProps) {
  return (
    <div className="mt-6 space-y-6">
      <ActivityChart activityData={activityData} />
    </div>
  );
}