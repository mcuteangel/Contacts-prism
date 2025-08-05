"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIContactDeduplication } from "@/components/ai-contact-deduplication";
import { AIAutoCategorization } from "@/components/ai-auto-categorization";

export default function AIPage() {
  const [activeTab, setActiveTab] = useState("deduplication");

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">هوش مصنوعی و اتوماسیون</h1>
        <p className="text-muted-foreground">
          از قابلیت‌های هوش مصنوعی برای مدیریت بهتر مخاطبین خود استفاده کنید
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deduplication">شناسایی تکراری‌ها</TabsTrigger>
          <TabsTrigger value="categorization">دسته‌بندی خودکار</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deduplication" className="mt-6">
          <AIContactDeduplication />
        </TabsContent>
        
        <TabsContent value="categorization" className="mt-6">
          <AIAutoCategorization />
        </TabsContent>
      </Tabs>
    </div>
  );
}