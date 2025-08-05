"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface GrowthMetricsProps {
  totalContacts: number;
  monthlyGrowth: string;
}

export function GrowthMetrics({ totalContacts, monthlyGrowth }: GrowthMetricsProps) {
  const currentMonthContacts = Math.round(totalContacts * 1.2);
  const nextMonthContacts = Math.round(totalContacts * 1.3);
  const afterNextMonthContacts = Math.round(totalContacts * 1.4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>نرخ رشد ماهانه</CardTitle>
        <div className="text-sm text-muted-foreground">
          تغییرات ماهانه در تعداد مخاطبین
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-green-500 mb-2">+{monthlyGrowth}%</div>
          <div className="text-sm text-muted-foreground">رشد نسبت به ماه قبل</div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalContacts}</div>
            <div className="text-sm text-muted-foreground">مجموع</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">+{Math.round(totalContacts * 0.2)}</div>
            <div className="text-sm text-muted-foreground">این ماه</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {currentMonthContacts - totalContacts}
            </div>
            <div className="text-sm text-muted-foreground">رشد</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">پیش‌بینی ماه آینده</span>
            </div>
            <Badge variant="outline">{currentMonthContacts.toLocaleString()}</Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="font-medium">پیش‌بینی ۲ ماه آینده</span>
            </div>
            <Badge variant="outline">{nextMonthContacts.toLocaleString()}</Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="font-medium">پیش‌بینی ۳ ماه آینده</span>
            </div>
            <Badge variant="outline">{afterNextMonthContacts.toLocaleString()}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}