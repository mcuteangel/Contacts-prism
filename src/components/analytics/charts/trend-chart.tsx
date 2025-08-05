"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface TrendChartProps {
  trendData: Array<{
    date: string;
    added: number;
    updated: number;
  }>;
}

export function TrendChart({ trendData }: TrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={18} />
          روند رشد مخاطبین
        </CardTitle>
        <CardDescription>تعداد مخاطبان اضافه شده و به‌روزرسانی شده در طول زمان</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="added" stroke="#8884d8" strokeWidth={2} name="افزوده شده" />
            <Line type="monotone" dataKey="updated" stroke="#82ca9d" strokeWidth={2} name="به‌روزرسانی شده" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}