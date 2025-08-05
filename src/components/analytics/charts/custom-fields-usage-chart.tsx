"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Target } from "lucide-react";

interface CustomFieldsUsageChartProps {
  customFieldsUsage: Array<{
    name: string;
    value: number;
  }>;
}

export function CustomFieldsUsageChart({ customFieldsUsage }: CustomFieldsUsageChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target size={18} />
          استفاده از فیلدهای سفارشی
        </CardTitle>
        <CardDescription>محبوب‌ترین فیلدهای سفارشی</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={customFieldsUsage}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Radar name="استفاده" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}