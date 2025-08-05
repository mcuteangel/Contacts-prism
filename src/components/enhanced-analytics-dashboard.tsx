"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { TimeRangeSelector } from "./analytics/time-range-selector";
import { AnalyticsTabs } from "./analytics/analytics-tabs";
import { OverviewTab } from "./analytics/overview-tab";
import { DemographicsTab } from "./analytics/demographics-tab";
import { GroupsTab } from "./analytics/groups-tab";
import { TrendsTab } from "./analytics/trends-tab";
import { ActivityTab } from "./analytics/activity-tab";

interface ContactTrend {
  date: string;
  added: number;
  updated: number;
}

interface ContactActivity {
  hour: string;
  contacts: number;
}

export function EnhancedAnalyticsDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allContacts, allGroups] = await Promise.all([
          ContactService.getAllContacts(),
          ContactService.getAllGroups()
        ]);
        setContacts(allContacts);
        setGroups(allGroups);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeRange]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalContacts = contacts.length;
  const totalGroups = groups.length;
  const totalPhoneNumbers = contacts.reduce((sum, contact) => sum + contact.phoneNumbers.length, 0);
  const contactsWithAddress = contacts.filter(contact => contact.address).length;
  const contactsWithPosition = contacts.filter(contact => contact.position).length;
  const contactsWithNotes = contacts.filter(contact => contact.notes).length;
  const contactsWithCustomFields = contacts.filter(contact => contact.customFields && contact.customFields.length > 0).length;

  // Gender distribution
  const genderData = [
    { name: 'مرد', value: contacts.filter(c => c.gender === 'male').length, fill: '#0088FE' },
    { name: 'زن', value: contacts.filter(c => c.gender === 'female').length, fill: '#FF8042' },
    { name: 'سایر', value: contacts.filter(c => c.gender === 'other').length, fill: '#8884D8' }
  ].filter(item => item.value > 0);

  // Group distribution
  const groupData = groups.map(group => ({
    name: group.name,
    contacts: contacts.filter(c => c.groupId === group.id).length,
    fill: `hsl(${(groups.indexOf(group) * 60) % 360}, 70%, 50%)`
  }));

  // Phone type distribution
  const phoneTypeData = contacts.reduce((acc, contact) => {
    contact.phoneNumbers.forEach(phone => {
      const existing = acc.find(item => item.name === phone.type);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: phone.type, value: 1 });
      }
    });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Position distribution
  const positionData = contacts
    .filter(c => c.position)
    .reduce((acc, contact) => {
      const position = contact.position!;
      const existing = acc.find(item => item.name === position);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: position, value: 1 });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Custom fields usage
  const customFieldsUsage = contacts
    .filter(c => c.customFields && c.customFields.length > 0)
    .reduce((acc, contact) => {
      contact.customFields!.forEach(field => {
        const existing = acc.find(item => item.name === field.name);
        if (existing) {
          existing.value++;
        } else {
          acc.push({ name: field.name, value: 1 });
        }
      });
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Mock trend data for demonstration
  const trendData: ContactTrend[] = [
    { date: 'فروردین', added: 12, updated: 5 },
    { date: 'اردیبهشت', added: 19, updated: 8 },
    { date: 'خرداد', added: 15, updated: 12 },
    { date: 'تیر', added: 25, updated: 15 },
    { date: 'مرداد', added: 22, updated: 18 },
    { date: 'شهریور', added: 30, updated: 20 },
    { date: 'مهر', added: 28, updated: 25 },
    { date: 'آبان', added: 35, updated: 30 },
    { date: 'آذر', added: 40, updated: 35 },
    { date: 'دی', added: 45, updated: 40 },
    { date: 'بهمن', added: 50, updated: 45 },
    { date: 'اسفند', added: 55, updated: 50 }
  ];

  // Mock activity data
  const activityData: ContactActivity[] = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    contacts: Math.floor(Math.random() * 20) + 1
  }));

  // Calculate growth rates
  const totalGrowth = ((totalContacts - 100) / 100 * 100).toFixed(1);
  const monthlyGrowth = ((totalContacts - totalContacts * 0.8) / (totalContacts * 0.8) * 100).toFixed(1);

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">داشبورد تحلیلی پیشرفته</h1>
          <p className="text-muted-foreground">
            تحلیل جامع داده‌های مخاطبین و روندهای رشد
          </p>
        </div>
        <TimeRangeSelector 
          selectedRange={selectedTimeRange} 
          onRangeChange={setSelectedTimeRange} 
        />
      </div>

      <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab}>
        <TabsContent value="overview">
          <OverviewTab
            totalContacts={totalContacts}
            totalGroups={totalGroups}
            totalPhoneNumbers={totalPhoneNumbers}
            contactsWithAddress={contactsWithAddress}
            contactsWithPosition={contactsWithPosition}
            contactsWithNotes={contactsWithNotes}
            contactsWithCustomFields={contactsWithCustomFields}
            totalGrowth={totalGrowth}
            monthlyGrowth={monthlyGrowth}
            genderData={genderData}
            positionData={positionData}
            customFieldsUsage={customFieldsUsage}
            phoneTypeData={phoneTypeData}
          />
        </TabsContent>

        <TabsContent value="demographics">
          <DemographicsTab contacts={contacts} totalContacts={totalContacts} />
        </TabsContent>

        <TabsContent value="groups">
          <GroupsTab groupData={groupData} />
        </TabsContent>

        <TabsContent value="trends">
          <TrendsTab 
            trendData={trendData}
            totalContacts={totalContacts}
            monthlyGrowth={monthlyGrowth}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab activityData={activityData} />
        </TabsContent>
      </AnalyticsTabs>
    </div>
  );
}