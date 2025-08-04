"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Header } from "./header";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Toaster } from "sonner";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isMobile, isTablet } = useIsMobile();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // تعیین اینکه آیا صفحه فعلی یکی از صفحات اصلی است
  const isMainPage = ['/contacts', '/groups', '/custom-fields', '/tools', '/settings', '/'].includes(pathname);

  const handleTabChange = (tab: 'contacts' | 'groups' | 'customFields') => {
    if (tab === 'contacts') window.location.href = '/';
    else if (tab === 'groups') window.location.href = '/groups';
    else if (tab === 'customFields') window.location.href = '/custom-fields';
  };

  const handleOpenSettings = () => {
    window.location.href = '/settings';
  };

  // برای دیباگ کردن
  console.log('Device Status:', {
    isMobile,
    isTablet,
    isMainPage,
    pathname,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown'
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <Toaster richColors position="top-center" />
      <Header />
      
      <div className="flex flex-1">
        {/* دسکتاپ سایدبار - فقط روی دسکتاپ نمایش داده شود */}
        {!isMobile && !isTablet && (
          <DesktopSidebar
            activeTab={pathname === '/contacts' || pathname === '/' ? 'contacts' : pathname === '/groups' ? 'groups' : 'customFields'}
            onTabChange={handleTabChange}
            onOpenSettings={handleOpenSettings}
            onCollapseChange={(collapsed) => setIsSidebarCollapsed(collapsed)}
          />
        )}
        
        {/* محتوای اصلی - حاشیه‌گذاری شده برای دسکتاپ */}
        <div className={`flex-grow ${!isMobile && !isTablet && !isSidebarCollapsed ? 'mr-64' : ''}`}>
          <div className="p-4 sm:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* موبایل و تبلت ناوبری - روی موبایل و تبلت و صفحات اصلی نمایش داده شود */}
      {(isMobile || isTablet) && isMainPage && (
        <MobileNav 
          activeTab={pathname === '/contacts' || pathname === '/' ? 'contacts' : pathname === '/groups' ? 'groups' : 'customFields'}
          onTabChange={handleTabChange}
          onOpenSettings={handleOpenSettings}
        />
      )}
    </div>
  );
}