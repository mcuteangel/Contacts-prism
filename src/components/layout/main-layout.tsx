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
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  const isMainPage = ['/contacts', '/groups', '/custom-fields', '/custom-fields-global', '/analytics', '/ai', '/tools', '/settings', '/'].includes(pathname);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleTabChange = (tab: 'contacts' | 'groups' | 'customFields' | 'globalCustomFields' | 'analytics' | 'ai') => {
    if (tab === 'contacts') {
      window.location.href = '/';
    } else if (tab === 'groups') {
      window.location.href = '/groups';
    } else if (tab === 'customFields') {
      window.location.href = '/custom-fields';
    } else if (tab === 'globalCustomFields') {
      window.location.href = '/custom-fields-global';
    } else if (tab === 'analytics') {
      window.location.href = '/analytics';
    } else if (tab === 'ai') {
      window.location.href = '/ai';
    }
  };

  const handleOpenSettings = () => {
    window.location.href = '/settings';
  };

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <Toaster richColors position="top-center" />
      <Header />
      
      <div className="flex flex-1">
        {!isMobile && (
          <DesktopSidebar
            activeTab={
              pathname === '/contacts' || pathname === '/' ? 'contacts' :
              pathname === '/groups' ? 'groups' :
              pathname === '/custom-fields' ? 'customFields' :
              pathname === '/custom-fields-global' ? 'globalCustomFields' :
              pathname === '/analytics' ? 'analytics' :
              pathname === '/ai' ? 'ai' : 'contacts'
            }
            onTabChange={handleTabChange}
            onOpenSettings={handleOpenSettings}
            onCollapseChange={(collapsed) => setIsSidebarCollapsed(collapsed)}
          />
        )}
        
        <div className={`flex-grow ${!isMobile && !isSidebarCollapsed ? 'mr-64' : ''}`}>
          <div className="p-4 sm:p-8">
            {children}
          </div>
        </div>
      </div>

      {isMobile && isMainPage && (
        <MobileNav 
          activeTab={
            pathname === '/contacts' || pathname === '/' ? 'contacts' :
            pathname === '/groups' ? 'groups' :
            pathname === '/custom-fields' ? 'customFields' :
            pathname === '/custom-fields-global' ? 'globalCustomFields' :
            pathname === '/analytics' ? 'analytics' :
            pathname === '/ai' ? 'ai' : 'contacts'
          }
          onTabChange={handleTabChange}
          onOpenSettings={handleOpenSettings}
        />
      )}
    </div>
  );
}