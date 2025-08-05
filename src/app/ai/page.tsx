"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIContactDeduplication } from "@/components/ai-contact-deduplication";
import { AIContactCategorization } from "@/components/ai-auto-categorization";

export default function AIPage() {
  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">هوش مصنوعی</h1>
        <p className="text-muted-foreground">
          از قابلیت‌های هوش مصنوعی برای مدیریت بهتر مخاطبان استفاده کنید
        </p>
      </div>

      <Tabs defaultValue="deduplication" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deduplication">تشخیص تکراری‌ها</TabsTrigger>
          <TabsTrigger value="categorization">دسته‌بندی خودکار</TabsTrigger>
        </TabsList>

        <TabsContent value="deduplication" className="mt-6">
          <AIContactDeduplication />
        </TabsContent>

        <TabsContent value="categorization" className="mt-6">
          <AIContactCategorization />
        </TabsContent>
      </Tabs>
    </div>
  );
}