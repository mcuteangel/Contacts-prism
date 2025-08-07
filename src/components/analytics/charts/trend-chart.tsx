"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface TrendChartProps {
  trendData: Array<{
    date: string;
    added: number;
    updated: number;
  }>;
}

// تثبیت ورودی برای جلوگیری از رندرهای غیرضروری
export const TrendChart = memo(function TrendChart({ trendData }: TrendChartProps) {
  const dataStable = useMemo(() => trendData ?? [], [trendData]);
  const hasData = dataStable.length > 0;

  return (
    <Card className="glass">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          روند رشد مخاطبین
        </CardTitle>
        <CardDescription className="text-xs">
          تعداد مخاطبان اضافه شده و به‌روزرسانی شده در طول زمان
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {hasData ? (
              <LineChart data={dataStable}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="added" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="افزوده شده" />
                <Line type="monotone" dataKey="updated" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="به‌روزرسانی شده" />
              </LineChart>
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
export default TrendChart;