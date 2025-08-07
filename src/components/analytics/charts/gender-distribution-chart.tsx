"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users } from "lucide-react";

interface GenderDistributionChartProps {
  genderData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

const DEFAULT_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export const GenderDistributionChart = memo(function GenderDistributionChart({ genderData }: GenderDistributionChartProps) {
  const dataStable = useMemo(() => genderData ?? [], [genderData]);
  const hasData = dataStable.length > 0;

  return (
    <Card className="glass">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          توزیع جنسیت
        </CardTitle>
        <CardDescription className="text-xs">
          توزیع مخاطبین بر اساس جنسیت
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              <PieChart>
                <Pie
                  data={dataStable}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {dataStable.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
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
export default GenderDistributionChart;