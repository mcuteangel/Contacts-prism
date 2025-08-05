"use client";

import React from "react";
import { GroupDistributionChart } from "./groups/group-distribution-chart";
import { GroupCards } from "./groups/group-cards";

interface GroupsTabProps {
  groupData: Array<{
    name: string;
    contacts: number;
    fill: string;
  }>;
}

export function GroupsTab({ groupData }: GroupsTabProps) {
  return (
    <div className="mt-6 space-y-6">
      <GroupDistributionChart groupData={groupData} />
      <GroupCards groupData={groupData} />
    </div>
  );
}