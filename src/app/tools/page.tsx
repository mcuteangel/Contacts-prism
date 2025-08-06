"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wrench, SlidersHorizontal, ListChecks } from "lucide-react";
import { GlobalCustomFieldsManagement } from "@/components/global-custom-fields-management";

export default function ToolsPage() {
  // صفحه ابزارها پیش‌تر فقط متن ساده داشت، برای همین خالی به‌نظر می‌رسید.
  // اینجا یک لی‌آوت ساده با کارت‌ها و ابزارهای موجود اضافه می‌کنیم.
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="text-foreground/70" />
          <div>
            <h1 className="text-2xl font-bold">ابزارها</h1>
            <p className="text-sm text-muted-foreground">مدیریت و تنظیمات پیشرفته برنامه</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks size={18} />
              فیلدهای سفارشی سراسری
            </CardTitle>
            <CardDescription>افزودن/ویرایش/حذف قالب‌های فیلدهای سفارشی برای استفاده در کل برنامه</CardDescription>
          </CardHeader>
          <CardContent>
            <GlobalCustomFieldsManagement />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal size={18} />
              تنظیمات پیشرفته
            </CardTitle>
            <CardDescription>تغییرات سیستمی و تنظیمات اپ</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-start">
            <Button asChild variant="outline">
              <Link href="/settings-advanced">رفتن به تنظیمات پیشرفته</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}