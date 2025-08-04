"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UsersRound, Settings, Tool, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/contacts", icon: Users, label: "مخاطبین" },
    { href: "/groups", icon: UsersRound, label: "گروه‌ها" },
    { href: "/custom-fields", icon: LayoutGrid, label: "فیلدها" },
    { href: "/tools", icon: Tool, label: "ابزار" },
    { href: "/settings", icon: Settings, label: "تنظیمات" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-50 sm:hidden">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs font-medium transition-colors",
              pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon size={20} className="mb-1" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}