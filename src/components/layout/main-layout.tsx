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
      <Toaster richColors position="top-center" />
      <Header 
        onContactsRefreshed={() => { /* This prop is not directly used here, but passed down */ }} 
        onOpenAppLock={() => setIsAppLockOpen(true)}
        onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
        onOpenColumnSelector={() => setIsColumnSelectorOpen(true)}
      />
      
      {isMobile ? (
        <MobileNav
          activeTab={pathname.substring(1) as any || 'contacts'}
          onTabChange={handleTabChange}
          onOpenSettings={handleOpenSettings}
        />
      ) : (
        <DesktopSidebar
          activeTab={pathname.substring(1) as any || 'contacts'}
          onTabChange={handleTabChange}
          onOpenSettings={handleOpenSettings}
          onCollapseChange={setIsSidebarCollapsed}
        />
      )}

      <main className={`flex-1 p-4 sm:p-8 transition-all duration-300 ${
        isMobile 
          ? "pb-20" 
          : isSidebarCollapsed 
            ? "mr-16 pt-20" 
            : "mr-64 pt-20"
      }`}>
        {children}
      </main>

      {isMainPage && (
        <Button
          className="fixed bottom-8 left-8 rounded-full h-14 w-14 shadow-lg flex items-center justify-center z-40"
          onClick={() => openContactForm()}
        >
          <Plus size={24} />
        </Button>
      )}

      <AppLock isOpen={isAppLockOpen} onOpenChange={setIsAppLockOpen} />
      <ThemeSelector isOpen={isThemeSelectorOpen} onOpenChange={setIsThemeSelectorOpen} />
      <ContactListColumns 
        isOpen={isColumnSelectorOpen} 
        onOpenChange={setIsColumnSelectorOpen} 
        onColumnsChange={() => { /* Implement column saving logic */ }}
        defaultColumns={[
          { id: 'firstName', label: 'نام', icon: User, description: 'نام مخاطب', visible: true, order: 0 },
          { id: 'lastName', label: 'نام خانوادگی', icon: User, description: 'نام خانوادگی مخاطب', visible: true, order: 1 },
          { id: 'phoneNumbers', label: 'شماره تلفن', icon: Phone, description: 'شماره‌های تماس مخاطب', visible: true, order: 2 },
          { id: 'position', label: 'سمت', icon: Briefcase, description: 'سمت یا تخصص مخاطب', visible: true, order: 3 },
          { id: 'address', label: 'آدرس', icon: MapPin, description: 'آدرس پستی مخاطب', visible: true, order: 4 },
          { id: 'notes', label: 'یادداشت‌ها', icon: Layout, description: 'یادداشت‌های مربوط به مخاطب', visible: true, order: 5 },
          { id: 'customFields', label: 'فیلدهای سفارشی', icon: Layout, description: 'فیلدهای سفارشی مخاطب', visible: true, order: 6 },
        ]}
      />
    </div>
  );
}