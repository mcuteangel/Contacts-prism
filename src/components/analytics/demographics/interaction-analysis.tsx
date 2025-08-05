"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Building2, MapPin } from "lucide-react";

interface InteractionAnalysisProps {
  contacts: Array<{
    phoneNumbers: Array<{ type: string }>;
    position?: string;
    address?: string;
  }>;
  totalContacts: number;
}

export function InteractionAnalysis({ contacts, totalContacts }: InteractionAnalysisProps) {
  const mobileUsers = contacts.filter(c => c.phoneNumbers.some(p => p.type === 'Mobile')).length;
  const positionUsers = contacts.filter(c => c.position).length;
  const addressUsers = contacts.filter(c => c.address).length;

  const interactionData = [
    {
      icon: Phone,
      title: "تماس‌های فعال",
      description: "مخاطبان با شماره موبایل",
      percentage: Math.round((mobileUsers / totalContacts) * 100),
      count: mobileUsers
    },
    {
      icon: Building2,
      title: "شغلی فعال",
      description: "مخاطبان با سمت ثبت شده",
      percentage: Math.round((positionUsers / totalContacts) * 100),
      count: positionUsers
    },
    {
      icon: MapPin,
      title: "آدرس‌های ثبت شده",
      description: "مخاطبان با آدرس",
      percentage: Math.round((addressUsers / totalContacts) * 100),
      count: addressUsers
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>تحلیل ارتباطی</CardTitle>
        <CardDescription>
          تحلیل الگوهای ارتباطی مخاطبین
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interactionData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{item.percentage}%</Badge>
                  <div className="text-xs text-muted-foreground mt-1">{item.count} مخاطب</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}