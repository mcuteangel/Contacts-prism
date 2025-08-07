"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Phone } from "lucide-react";

interface PhoneTypeDistributionChartProps {
  phoneTypeData: Array<{
    name: string;
    value: number;
  }>;
}

export const PhoneTypeDistributionChart = memo(function PhoneTypeDistributionChart({ phoneTypeData }: PhoneTypeDistributionChartProps) {
  const dataStable = useMemo(() => phoneTypeData ?? [], [phoneTypeData]);
  const hasData = dataStable.length > 0;

  return (
    <Card className="glass">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Phone className="h-4 w-4" />
          نوع شماره‌های تلفن
        </CardTitle>
        <CardDescription className="text-xs">تعداد شماره‌های تلفن بر اساس نوع</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              <AreaChart data={dataStable}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.4} />
              </AreaChart>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                داده‌ای برای نمایش موجود نیست
              </div>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
export default PhoneTypeDistributionChart;