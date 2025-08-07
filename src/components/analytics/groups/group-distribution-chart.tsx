"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";

interface GroupDistributionChartProps {
  groupData: Array<{
    name: string;
    contacts: number;
    fill: string;
  }>;
}

/**
 * GroupDistributionChart - memo + useMemo با fallback بدون داده
 */
export const GroupDistributionChart = memo(function GroupDistributionChart({ groupData }: GroupDistributionChartProps) {
  const dataStable = useMemo(() => groupData ?? [], [groupData]);
  const hasData = dataStable.length > 0;

  return (
    <Card className="glass">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users size={18} />
          توزیع گروه‌ها
        </CardTitle>
        <CardDescription className="text-xs">تعداد مخاطبین در هر گروه</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              <BarChart data={dataStable}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="contacts" fill="hsl(var(--chart-4))" />
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
export default GroupDistributionChart;