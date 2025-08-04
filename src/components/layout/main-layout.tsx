"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
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
      
      <div className="flex flex-1">
        {/* دسکتاپ سایدبار - ثابت و روی همیشه نمایش داده می‌شود */}
        {!isMobile && (
          <DesktopSidebar
            activeTab={pathname === '/contacts' ? 'contacts' : pathname === '/groups' ? 'groups' : 'customFields'}
            onTabChange={(tab) => {
              if (tab === 'contacts') window.location.href = '/';
              else if (tab === 'groups') window.location.href = '/groups';
              else if (tab === 'customFields') window.location.href = '/custom-fields';
            }}
            onOpenSettings={() => window.location.href = '/settings'}
          />
        )}
        
        {/* محتوای اصلی - حاشیه‌گذاری شده برای دسکتاپ */}
        <div className={`flex-grow ${!isMobile ? 'ml-64' : ''}`}>
          <div className="p-4 sm:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* موبایل ناوبری - ثابت در پایین صفحه */}
      {isMobile && isMainPage && (
        <MobileNav
          activeTab={pathname === '/contacts' ? 'contacts' : pathname === '/groups' ? 'groups' : 'customFields'}
          onTabChange={(tab) => {
            if (tab === 'contacts') window.location.href = '/';
            else if (tab === 'groups') window.location.href = '/groups';
            else if (tab === 'customFields') window.location.href = '/custom-fields';
          }}
          onOpenSettings={() => window.location.href = '/settings'}
        />
      )}
    </div>
  );
}