"use client";

import React from "react";
import { CustomFieldsManagement } from "@/components/custom-fields-management";

export default function CustomFieldsPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-primary-foreground mb-4">فیلدهای سفارشی</h1>
      <CustomFieldsManagement />
    </div>
  );
}