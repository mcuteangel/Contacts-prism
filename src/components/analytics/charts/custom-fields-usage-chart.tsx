"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Target } from "lucide-react";

interface CustomFieldsUsageChartProps {
  customFieldsUsage: Array<{
    name: string;
    value: number;
  }>;
}

export const CustomFieldsUsageChart = memo(function CustomFieldsUsageChart({ customFieldsUsage }: CustomFieldsUsageChartProps) {
  const dataStable = useMemo(() => customFieldsUsage ?? [], [customFieldsUsage]);
  const hasData = dataStable.length > 0;

  return (
    <Card className="glass">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Target className="h-4 w-4" />
          استفاده از فیلدهای سفارشی
        </CardTitle>
        <CardDescription className="text-xs">محبوب‌ترین فیلدهای سفارشی</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataStable}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis />
                <Radar
                  name="استفاده"
                  dataKey="value"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.35}
                />
                <Tooltip />
              </RadarChart>
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
export default CustomFieldsUsageChart;