"use client";

import React from "react";
import { AgeDistribution } from "./demographics/age-distribution";
import { InteractionAnalysis } from "./demographics/interaction-analysis";

interface DemographicsTabProps {
  contacts: Array<{
    phoneNumbers: Array<{ type: string }>;
    position?: string;
    address?: string;
  }>;
  totalContacts: number;
}

export function DemographicsTab({ contacts, totalContacts }: DemographicsTabProps) {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgeDistribution totalContacts={totalContacts} />
        <InteractionAnalysis contacts={contacts} totalContacts={totalContacts} />
      </div>
    </div>
  );
}