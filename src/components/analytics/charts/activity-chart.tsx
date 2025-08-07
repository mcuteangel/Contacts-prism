"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";

interface ActivityChartProps {
  activityData: Array<{
    hour: string;
    contacts: number;
  }>;
}

/**
 * ActivityChart - نسخه memo شده با ورودی پایدار برای کاهش رندر
 */
export const ActivityChart = memo(function ActivityChart({ activityData }: ActivityChartProps) {
  const dataStable = useMemo(() => activityData, [activityData]);

  const hasData = dataStable && dataStable.length > 0;

  return (
    <Card className="glass">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock size={18} />
          فعالیت ساعتی
        </CardTitle>
        <CardDescription className="text-xs">
          تعداد فعالیت‌های مخاطبین بر اساس ساعت روز
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              <AreaChart data={dataStable}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="contacts"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.35}
                  name="فعالیت"
                />
              </AreaChart>
            ) : (
              // Fallback بدون داده
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
export default ActivityChart;