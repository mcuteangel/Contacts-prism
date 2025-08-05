"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/theme-selector";
import { Database, Download, Upload, Trash2, Shield, Bell } from "lucide-react";

export default function AdvancedSettingsPage() {
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground">تنظیمات پیشرفته</h1>
        <Button onClick={() => setIsThemeSelectorOpen(true)}>
          شخصی‌سازی ظاهر
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">عمومی</TabsTrigger>
          <TabsTrigger value="data">مدیریت داده</TabsTrigger>
          <TabsTrigger value="privacy">حریم خصوصی</TabsTrigger>
          <TabsTrigger value="notifications">اعلانات</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات عمومی</CardTitle>
              <CardDescription>
                تنظیمات کلی برنامه و رفتار پیش‌فرض
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>حالت نمایش پیش‌فرض</Label>
                  <p className="text-sm text-muted-foreground">
                    لیست مخاطبین به صورت پیش‌فرض نمایش داده می‌شود
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>جستجوی بلادرنگ</Label>
                  <p className="text-sm text-muted-foreground">
                    نتایج جستجو به صورت فوری نمایش داده می‌شوند
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تاییدیه حذف</Label>
                  <p className="text-sm text-muted-foreground">
                    قبل از حذف مخاطب، تاییدیه نمایش داده می‌شود
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>تعداد آیتم در صفحه</Label>
                <Input type="number" defaultValue="20" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                مدیریت داده
              </CardTitle>
              <CardDescription>
                پشتیبان‌گیری، بازیابی و مدیریت پایگاه داده
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="flex items-center gap-2">
                  <Download size={18} />
                  خروجی پایگاه داده
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload size={18} />
                  ورودی پایگاه داده
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">حذف داده‌ها</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 size={16} className="mr-2" />
                    حذف همه مخاطبین
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 size={16} className="mr-2" />
                    حذف همه گروه‌ها
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Trash2 size={16} className="mr-2" />
                    حذف همه فیلدهای سفارشی
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                حریم خصوصی
              </CardTitle>
              <CardDescription>
                تنظیمات مربوط به حریم خصوصی و امنیت داده‌ها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>قفل برنامه</Label>
                  <p className="text-sm text-muted-foreground">
                    با استفاده از رمز عبور یا بیومتریک برنامه قفل شود
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>رمز عبور</Label>
                  <p className="text-sm text-muted-foreground">
                    رمز عبور برای دسترسی به برنامه
                  </p>
                </div>
                <Button variant="outline">تنظیم</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ذخیره‌سازی محلی</Label>
                  <p className="text-sm text-muted-foreground">
                    داده‌ها به صورت محلی روی دستگاه ذخیره می‌شوند
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>شفافیت داده</Label>
                  <p className="text-sm text-muted-foreground">
                    اطلاعات جمع‌آوری شده برای بهبود برنامه
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                اعلانات
              </CardTitle>
              <CardDescription>
                مدیریت اعلانات و نوتیفیکیشن‌های برنامه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>اعلانات مرتبط با مخاطبین</Label>
                  <p className="text-sm text-muted-foreground">
                    اعلان‌های مربوط به تولد مخاطبین
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>اعلان‌های سیستم</Label>
                  <p className="text-sm text-muted-foreground">
                    اعلان‌های مربوط به به‌روزرسانی‌ها
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>صدای اعلان</Label>
                  <p className="text-sm text-muted-foreground">
                    پخش صدا هنگام دریافت اعلان
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>زمان اعلان تولد</Label>
                <Input type="time" defaultValue="09:00" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ThemeSelector 
        isOpen={isThemeSelectorOpen} 
        onOpenChange={setIsThemeSelectorOpen} 
      />
    </div>
  );
}