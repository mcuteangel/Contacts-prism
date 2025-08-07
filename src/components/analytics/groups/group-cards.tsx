"use client";

import React, { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface GroupCardsProps {
  groupData: Array<{
    name: string;
    contacts: number;
    fill: string;
  }>;
}

export const GroupCards = memo(function GroupCards({ groupData }: GroupCardsProps) {
  const dataStable = useMemo(() => groupData ?? [], [groupData]);
  const hasData = dataStable.length > 0;

  // امن‌سازی maxContacts برای آرایه خالی
  const maxContacts = useMemo(() => {
    if (!hasData) return 0;
    return Math.max(...dataStable.map((g) => g.contacts));
  }, [dataStable, hasData]);

  if (!hasData) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm rounded-md border border-dashed">
        داده‌ای برای نمایش موجود نیست
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {dataStable.map((group) => {
        const coverage = maxContacts > 0 ? Math.round((group.contacts / maxContacts) * 100) : 0;
        return (
          <Card key={group.name} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: group.fill }}
                    aria-label={`Group ${group.name}`}
                  >
                    {group.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold">{group.name}</h3>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-primary">{group.contacts}</p>
                <p className="text-sm text-muted-foreground">مخاطب</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>پوشش</span>
                  <Badge variant="outline">{coverage}%</Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2" aria-label="Coverage progress">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${coverage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
export default GroupCards;