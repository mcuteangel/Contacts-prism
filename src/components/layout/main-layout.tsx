"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Header } from "./header";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { Toaster } from "sonner";
import { useContactForm } from "@/contexts/contact-form-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AppLock } from "@/components/app-lock";
import { ThemeSelector } from "@/components/theme-selector";
import { ContactListColumns } from "@/components/contact-list-columns";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
  const [isAppLockOpen, setIsAppLockOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const { openContactForm } = useContactForm();

  // دکمه افزودن مخاطب باید در تمام صفحات اصلی نمایش داده شود
  const isMainPage = ['/contacts', '/groups', '/custom-fields', '/custom-fields-global', '/analytics', '/ai', '/help', '/tools', '/settings', '/'].includes(pathname);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    // Check if app lock is enabled
    const savedPassword = localStorage.getItem('app-password');
    if (savedPassword && !isAppLockOpen) {
      setIsAppLockOpen(true);
    }
  }, [isAppLockOpen]);

  const handleTabChange = (tab: 'contacts' | 'groups' | 'customFields' | 'globalCustomFields' | 'analytics' | 'ai' | 'help' | 'tools' | 'settings') => {
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
    } else if (tab === 'help') {
      window.location.href = '/help';
    } else if (tab === 'tools') {
      window.location.href = '/tools';
    } else if (tab === 'settings') {
      window.location.href = '/settings';
    }
  };

  const handleOpenSettings = () => {
    window.location.href = '/settings';
  };

  // گوش دادن به رویداد برای باز کردن فرم مخاطب
  useEffect(() => {
    const handleOpenContactForm = () => {
      openContactForm();
    };

    window.addEventListener('open-contact-form', handleOpenContactForm);
    return () => window.removeEventListener('open-contact-form', handleOpenContactForm);
  }, [openContactForm]);

  if (isMobile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <AppLock isOpen={isAppLockOpen} onOpenChange={setIsAppLockOpen} />
      <ThemeSelector isOpen={isThemeSelectorOpen} onOpenChange={setIsThemeSelectorOpen} />
      
      {isMobile ? (
        <>
          <Header 
            onContactsRefreshed={() => window.location.reload()}
            onOpenAppLock={() => setIsAppLockOpen(true)}
            onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
            onOpenColumnSelector={() => setIsColumnSelectorOpen(true)}
          />
          <main className="flex-grow pt-16 pb-16 p-4">
            {children}
          </main>
          <MobileNav 
            activeTab={
              pathname === '/' ? 'contacts' :
              pathname === '/groups' ? 'groups' :
              pathname === '/custom-fields' ? 'customFields' :
              pathname === '/custom-fields-global' ? 'globalCustomFields' :
              pathname === '/analytics' ? 'analytics' :
              pathname === '/ai' ? 'ai' :
              pathname === '/help' ? 'help' :
              pathname === '/tools' ? 'tools' :
              'settings'
            }
            onTabChange={handleTabChange}
            onOpenSettings={handleOpenSettings}
          />
        </>
      ) : (
        <div className="flex flex-1">
          <DesktopSidebar 
            activeTab={
              pathname === '/' ? 'contacts' :
              pathname === '/groups' ? 'groups' :
              pathname === '/custom-fields' ? 'customFields' :
              pathname === '/custom-fields-global' ? 'globalCustomFields' :
              pathname === '/analytics' ? 'analytics' :
              pathname === '/ai' ? 'ai' :
              pathname === '/help' ? 'help' :
              pathname === '/tools' ? 'tools' :
              'settings'
            }
            onTabChange={handleTabChange}
            onOpenSettings={handleOpenSettings}
            onCollapseChange={setIsSidebarCollapsed}
          />
          <div className="flex-1 flex flex-col">
            <Header 
              onContactsRefreshed={() => window.location.reload()}
              onOpenAppLock={() => setIsAppLockOpen(true)}
              onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
              onOpenColumnSelector={() => setIsColumnSelectorOpen(true)}
            />
            <main className={`flex-grow pt-16 p-4 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
              {children}
            </main>
          </div>
        </div>
      )}
      
      {isMainPage && (
        <Button
          className="fixed bottom-8 left-8 rounded-full h-14 w-14 shadow-lg flex items-center justify-center z-40"
          onClick={() => {
            // Dispatch event to open contact form
            window.dispatchEvent(new CustomEvent('open-contact-form'));
          }}
        >
          <Plus size={24} />
        </Button>
      )}
      
      <Toaster richColors position="top-center" />
    </div>
  );
}