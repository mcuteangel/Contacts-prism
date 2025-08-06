"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { Users, Phone, Building2, MapPin, TrendingUp } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsRes, groupsRes] = await Promise.all([
          ContactService.getAllContacts(),
          ContactService.getAllGroups()
        ]);
        const list = contactsRes.ok ? contactsRes.data.data : [];
        const groups = groupsRes.ok ? groupsRes.data : [];
        setContacts(list);
        setGroups(groups);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Gender distribution
  const genderData = [
    { name: 'مرد', value: contacts.filter(c => c.gender === 'male').length },
    { name: 'زن', value: contacts.filter(c => c.gender === 'female').length },
    { name: 'سایر', value: contacts.filter(c => c.gender === 'other').length }
  ].filter(item => item.value > 0);

  // Group distribution
  const groupData = groups.map(group => ({
    name: group.name,
    contacts: contacts.filter(c => c.groupId === group.id).length
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

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground">داشبورد آماری</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <TrendingUp size={16} /> به‌روزرسانی خودکار
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع مخاطبین</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              {totalGroups > 0 ? `${totalGroups} گروه فعال` : 'هیچ گروهی وجود ندارد'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">شماره‌های تلفن</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPhoneNumbers}</div>
            <p className="text-xs text-muted-foreground">
              میانگین {totalContacts > 0 ? (totalPhoneNumbers / totalContacts).toFixed(1) : 0} شماره در هر مخاطب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سمت‌ها</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsWithPosition}</div>
            <p className="text-xs text-muted-foreground">
              از {totalContacts} مخاطب ({((contactsWithPosition / totalContacts) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">آدرس‌ها</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsWithAddress}</div>
            <p className="text-xs text-muted-foreground">
              از {totalContacts} مخاطب ({((contactsWithAddress / totalContacts) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزیع جنسیت</CardTitle>
            <CardDescription>توزیع مخاطبین بر اساس جنسیت</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Group Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزیع گروه‌ها</CardTitle>
            <CardDescription>تعداد مخاطبین در هر گروه</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={groupData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contacts" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Phone Type Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>توزیع انواع شماره تلفن</CardTitle>
            <CardDescription>تعداد شماره‌های تلفن بر اساس نوع</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={phoneTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}