"use client";

import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export function Header() {
  return (
    <header className="w-full p-4 sm:p-6 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
      <Link href="/" className="text-3xl font-bold text-primary-foreground">
        مخاطبین منشور
      </Link>
      <div className="flex gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}