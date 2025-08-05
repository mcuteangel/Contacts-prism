"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface AgeDistributionProps {
  totalContacts: number;
}

export function AgeDistribution({ totalContacts }: AgeDistributionProps) {
  const ageGroups = [
    { range: "۱۸-۲۵ سال", percentage: 15, count: Math.round(totalContacts * 0.15) },
    { range: "۲۶-۳۵ سال", percentage: 35, count: Math.round(totalContacts * 0.35) },
    { range: "۳۶-۴۵ سال", percentage: 30, count: Math.round(totalContacts * 0.30) },
    { range: "۴۶+ سال", percentage: 20, count: Math.round(totalContacts * 0.20) }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar size={18} />
          توزیع سنی (تخمینی)
        </CardTitle>
        <CardDescription>
          تخمین توزیع سنی مخاطبین
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ageGroups.map((group, index) => (
            <div key={index} className="flex justify-between items-center">
              <span>{group.range}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${group.percentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{group.percentage}%</span>
                  <span className="text-xs text-muted-foreground">({group.count})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}