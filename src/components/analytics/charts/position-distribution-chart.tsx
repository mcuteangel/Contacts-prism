"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building2 } from "lucide-react";

interface PositionDistributionChartProps {
  positionData: Array<{
    name: string;
    value: number;
  }>;
}

export const PositionDistributionChart = memo(function PositionDistributionChart({ positionData }: PositionDistributionChartProps) {
  const dataStable = useMemo(() => positionData ?? [], [positionData]);
  const hasData = dataStable.length > 0;

  return (
    <Card className="glass">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          محبوب‌ترین مشاغل
        </CardTitle>
        <CardDescription className="text-xs">تعداد مخاطبین بر اساس سمت/تخصص</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              <BarChart data={dataStable}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--chart-2))" />
              </BarChart>
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
export default PositionDistributionChart;