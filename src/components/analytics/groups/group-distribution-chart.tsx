"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";

interface GroupDistributionChartProps {
  groupData: Array<{
    name: string;
    contacts: number;
    fill: string;
  }>;
}

export function GroupDistributionChart({ groupData }: GroupDistributionChartProps) {
  const maxContacts = Math.max(...groupData.map(g => g.contacts));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={18} />
          توزیع گروه‌ها
        </CardTitle>
        <CardDescription>تعداد مخاطبین در هر گروه</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={groupData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="contacts" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}