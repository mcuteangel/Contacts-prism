"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ScatterChart, Scatter
} from "recharts";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import {
  Users, Phone, Building2, MapPin, TrendingUp, TrendingDown,
  Calendar, Clock, Star, Heart, Activity, Target
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
    { name: 'سایر', value: contacts.filter(c => c.gender === 'other').length, fill: '#

8884D8' }
  ].filter(item => item.value > 0);

  // Group distribution
  const groupData = groups.map(group => ({
    name: group.name,
    contacts: contacts.filter(c => c.groupId === group.id).length,
    fill: COLORS[groups.indexOf(group) % COLORS.length]
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
  const totalGrowth = ((contacts.length - 100) / 100 * 100).toFixed(1); // Mock calculation
  const monthlyGrowth = ((contacts.length - contacts.length * 0.8) / (contacts.length * 0.8) * 100).toFixed(1); // Mock calculation

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">داشبورد تحلیلی پیشرفته</h1>
          <p className="text-muted-foreground">
            تحلیل جامع داده‌های مخاطبین و روندهای رشد
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedTimeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeRange("7d")}
          >
            ۷ روز
          </Button>
          <Button
            variant={selectedTimeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeRange("30d")}
          >
            ۳۰ روز
          </Button>
          <Button
            variant={selectedTimeRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeRange("90d")}
          >
            ۹۰ روز
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع مخاطبین</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp size={12} className="text-green-500" />
              +{totalGrowth}% از ماه قبل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین شماره‌ها</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalContacts > 0 ? (totalPhoneNumbers / totalContacts).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              به ازای هر مخاطب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اطلاعات تکمیلی</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((contactsWithPosition + contactsWithAddress + contactsWithNotes) / 3)}%
            </div>
            <p className="text-xs text-muted-foreground">
              میانگین تکمیل اطلاعات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فیلدهای سفارشی</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((contactsWithCustomFields / totalContacts) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              استفاده از فیلدهای سفارشی
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="demographics">جمعیت‌شناسی</TabsTrigger>
          <TabsTrigger value="groups">گروه‌ها</TabsTrigger>
          <TabsTrigger value="trends">روندها</TabsTrigger>
          <TabsTrigger value="activity">فعالیت</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>محبوب‌ترین مشاغل</CardTitle>
                <CardDescription>تعداد مخاطبین بر اساس سمت/تخصص</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={positionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>استفاده از فیلدهای سفارشی</CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle>نوع شماره‌های تلفن</CardTitle>
                <CardDescription>تعداد شماره‌های تلفن بر اساس نوع</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={phoneTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزیگ سنی (تخمینی)</CardTitle>
                <CardDescription>تخمین توزیگ سنی مخاطبین</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>۱۸-۲۵ سال</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="text-sm">15%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>۲۶-۳۵ سال</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-sm">35%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>۳۶-۴۵ سال</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-sm">30%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>۴۶+ سال</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <span className="text-sm">20%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحلیل ارتباطی</CardTitle>
                <CardDescription>تحلیل الگوهای ارتباطی مخاطبین</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">تماس‌های فعال</div>
                        <div className="text-sm text-muted-foreground">مخاطبان با شماره موبایل</div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {Math.round((contacts.filter(c => c.phoneNumbers.some(p => p.type === 'Mobile')).length / totalContacts) * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">شغلی فعال</div>
                        <div className="text-sm text-muted-foreground">مخاطبان با سمت ثبت شده</div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {Math.round((contactsWithPosition / totalContacts) * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">آدرس‌های ثبت شده</div>
                        <div className="text-sm text-muted-foreground">مخاطبان با آدرس</div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {Math.round((contactsWithAddress / totalContacts) * 100)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>توزیع گروه‌ها</CardTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupData.map((group, index) => (
              <Card key={group.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-2xl font-bold text-primary">{group.contacts} مخاطب</p>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${group.fill}20` }}>
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: group.fill }}></div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(group.contacts / Math.max(...groupData.map(g => g.contacts))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>روند رشد مخاطبین</CardTitle>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>نرخ رشد ماهانه</CardTitle>
                <CardDescription>تغییرات ماهانه در تعداد مخاطبین</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">+{monthlyGrowth}%</div>
                  <p className="text-muted-foreground">رشد نسبت به ماه قبل</p>
                  <div className="mt-4 flex justify-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{contacts.length}</div>
                      <p className="text-sm text-muted-foreground">مجموع</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">+{Math.round(contacts.length * 0.2)}</div>
                      <p className="text-sm text-muted-foreground">این ماه</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>پیش‌بینی رشد</CardTitle>
                <CardDescription>پیش‌بینی تعداد مخاطبان در ۳ ماه آینده</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>ماه آینده</span>
                    <Badge variant="outline">{Math.round(contacts.length * 1.1).toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>۲ ماه آینده</span>
                    <Badge variant="outline">{Math.round(contacts.length * 1.2).toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>۳ ماه آینده</span>
                    <Badge variant="outline">{Math.round(contacts.length * 1.3).toLocaleString()}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>فعالیت ساعتی</CardTitle>
              <CardDescription>تعداد فعالیت‌های مخاطبین بر اساس ساعت روز</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="contacts" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ساعات پیک</CardTitle>
                <CardDescription>ساعات با بیشترین فعالیت مخاطبین</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                    <span className="font-medium">صبح‌ها (۹-۱۲)</span>
                    <Badge>ساعات پیک</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span>بعدازظهر‌ها (۱۴-۱۷)</span>
                    <Badge variant="secondary">ساعات متوسط</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>عصر‌ها (۱۸-۲۱)</span>
                    <Badge variant="outline">ساعات آرام</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تحلیل تعامل</CardTitle>
                <CardDescription>تحلیل الگوهای تعامل با مخاطبین</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{totalPhoneNumbers}</div>
                    <p className="text-muted-foreground">مجموع شماره‌های تلفن</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500 mb-2">{Math.round(totalPhoneNumbers / totalContacts)}</div>
                    <p className="text-muted-foreground">میانگین شماره در هر مخاطب</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-2">{groups.length}</div>
                    <p className="text-muted-foreground">تعداد گروه‌ها</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}