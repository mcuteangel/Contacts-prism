"use client";

import React from "react";
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

export function GroupCards({ groupData }: GroupCardsProps) {
  const maxContacts = Math.max(...groupData.map(g => g.contacts));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groupData.map((group, index) => (
        <Card key={group.name} className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: group.fill }}
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
                <Badge variant="outline">
                  {Math.round((group.contacts / maxContacts) * 100)}%
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(group.contacts / maxContacts) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}