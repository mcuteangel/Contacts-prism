"use client";

import React from "react";
import { Info } from "lucide-react";

export function CustomFieldsManagement() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-primary-foreground">فیلدهای سفارشی</h2>
      <div className="glass p-4 rounded-lg flex items-start gap-3">
        <Info size={20} className="text-blue-500 flex-shrink-0 mt-1" />
        <div>
          <p className="text-muted-foreground">
            فیلدهای سفارشی به شما این امکان را می‌دهند که اطلاعات اضافی و دلخواه خود را برای هر مخاطب ذخیره کنید.
            این فیلدها شامل یک "نام فیلد" (مانند "تاریخ تولد" یا "وب‌سایت") و یک "مقدار فیلد" (مانند "۱۳۷۰/۰۱/۰۱" یا "www.example.com") هستند.
          </p>
          <p className="text-muted-foreground mt-2">
            شما می‌توانید هنگام افزودن یا ویرایش هر مخاطب، فیلدهای سفارشی جدیدی را به آن اضافه کنید.
            در حال حاضر، مدیریت انواع فیلدهای سفارشی به صورت سراسری (مثلاً تعریف یک قالب برای "تاریخ تولد" که برای همه مخاطبین قابل استفاده باشد) در این بخش پشتیبانی نمی‌شود.
          </p>
        </div>
      </div>
      {/* Future: Add UI for managing global custom field templates if needed */}
    </div>
  );
}