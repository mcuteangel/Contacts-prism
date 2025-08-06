"use client";

import { redirect } from "next/navigation";

export default function AnalyticsPage() {
  // انتقال به بینش‌ها با تب آمار
  redirect("/insights?tab=analytics");
}