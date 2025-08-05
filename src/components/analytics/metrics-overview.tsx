"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, Building2, MapPin, TrendingUp, Activity, Target } from "lucide-react";

interface MetricsOverviewProps {
  totalContacts: number;
  totalGroups: number;
  totalPhoneNumbers: number;
  contactsWithAddress: number;
  contactsWithPosition: number;
  contactsWithNotes: number;
  contactsWithCustomFields: number;
  totalGrowth: string;
  monthlyGrowth: string;
}

export function MetricsOverview({
  totalContacts,
  totalGroups,
  totalPhoneNumbers,
  contactsWithAddress,
  contactsWithPosition,
  contactsWithNotes,
  contactsWithCustomFields,
  totalGrowth,
  monthlyGrowth
}: MetricsOverviewProps) {
  const avgPhonesPerContact = totalContacts > 0 ? (totalPhoneNumbers / totalContacts).toFixed(1) : 0;
  const avgInfoCompletion = Math.round((contactsWithPosition + contactsWithAddress + contactsWithNotes) / 3);
  const customFieldsUsage = Math.round((contactsWithCustomFields / totalContacts) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">مجموع مخاطبین</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp size={12} className="text-green-500" />
            +{totalGrowth}% از ماه قبل
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">میانگین شماره‌ها</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgPhonesPerContact}</div>
          <p className="text-xs text-muted-foreground">
            به ازای هر مخاطب
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">اطلاعات تکمیلی</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgInfoCompletion}%</div>
          <p className="text-xs text-muted-foreground">
            میانگین تکمیل اطلاعات
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">فیلدهای سفارشی</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customFieldsUsage}%</div>
          <p className="text-xs text-muted-foreground">
            استفاده از فیلدهای سفارشی
          </p>
        </CardContent>
      </Card>
    </div>
  );
}