"use client";

import React from "react";
import { NestedGroupsManagement } from "@/components/nested-groups-management";

export default function GroupsPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <div className="p-4 sm:p-8">
        <h1 className="text-3xl font-bold text-primary-foreground mb-6">مدیریت گروه‌ها</h1>
        
        {/* Nested Groups Management - Hierarchical groups with search and add functionality */}
        <NestedGroupsManagement />
      </div>
    </div>
  );
}