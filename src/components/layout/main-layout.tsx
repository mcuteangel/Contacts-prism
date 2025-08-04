"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { Toaster } from "sonner";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // تعیین اینکه آیا صفحه فعلی یکی از صفحات اصلی است
  const isMainPage = ['/contacts', '/groups', '/custom-fields', '/tools', '/settings'].includes(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <Toaster richColors position="top-center" />
      <Header />
      <main className="flex-grow p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl glass p-6 rounded-lg shadow-lg backdrop-blur-md">
          {children}
        </div>
      </main>
      {isMobile && isMainPage && <MobileNav />}
    </div>
  );
}