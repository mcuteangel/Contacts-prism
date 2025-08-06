"use client";

import { redirect } from "next/navigation";

export default function AIPage() {
  // انتقال به بینش‌ها با تب هوش مصنوعی
  redirect("/insights?tab=ai");
}