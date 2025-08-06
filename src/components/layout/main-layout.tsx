"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { buildOnTabChange, mapPathnameToTab, NavTab } from "@/lib/navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [isAppLockOpen, setIsAppLockOpen] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const { openContactForm } = useContactForm();

  // Memoize the main page check to prevent recalculations
  const isMainPage = React.useMemo(() =>
    ['/contacts', '/groups',
     '/analytics', '/ai', '/help', '/tools', '/settings', '/'].includes(pathname),
    [pathname]
  );

  // حذف لاجیک تکراری تشخیص موبایل؛ از useIsMobile استفاده می‌شود

  useEffect(() => {
    // Check if app lock is enabled and not already unlocked in this session
    const savedPassword = localStorage.getItem('app-password');
    const wasUnlocked = sessionStorage.getItem('app-unlocked') === 'true';
    
    if (savedPassword) {
      if (wasUnlocked) {
        // If app was previously unlocked in this session, keep it unlocked
        setIsAppLockOpen(false);
        setIsUnlocked(true);
      } else if (!isUnlocked) {
        // Otherwise, show the lock screen
        setIsAppLockOpen(true);
      }
    } else {
      // If no password is set, keep the app unlocked
      setIsAppLockOpen(false);
      setIsUnlocked(true);
    }
  }, [isUnlocked]);

  const router = useRouter();
  // استفاده از util واحد برای ناوبری
  const handleTabChange = buildOnTabChange((href: string) => router.push(href));

  const handleOpenSettings = () => {
    router.push('/settings');
  };

  // گوش دادن به رویداد برای باز کردن فرم مخاطب
  useEffect(() => {
    const handleOpenContactForm = () => {
      openContactForm();
    };

    window.addEventListener('open-contact-form', handleOpenContactForm);
    return () => window.removeEventListener('open-contact-form', handleOpenContactForm);
  }, [openContactForm]);

  // با useIsMobile دیگر حالت undefined نداریم؛ اسپلش لودر حذف شد

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <AppLock 
        isOpen={isAppLockOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // When unlocking, set the unlocked state in session storage
            sessionStorage.setItem('app-unlocked', 'true');
            setIsUnlocked(true);
          }
          setIsAppLockOpen(open);
        }} 
      />
      <ThemeSelector isOpen={isThemeSelectorOpen} onOpenChange={setIsThemeSelectorOpen} />
      
      {isMobile ? (
        <>
          <Header
            onContactsRefreshed={() => window.location.reload()}
            onOpenAppLock={() => setIsAppLockOpen(true)}
            onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
            onOpenColumnSelector={() => setIsColumnSelectorOpen(true)}
          />
          {/* جبران ارتفاع هدر ثابت */}
          <div className="h-16" aria-hidden="true" />
          <main className="flex-grow pb-20 p-4" id="main-content">
            {children}
          </main>
          <MobileNav
            activeTab={mapPathnameToTab(pathname) as NavTab}
            onTabChange={handleTabChange}
            onOpenSettings={handleOpenSettings}
          />
        </>
      ) : (
        <>
          {/* ساختار دسکتاپ با RTL/LTR داینامیک؛ از logical padding-inline استفاده می‌کنیم */}
          <div className="flex flex-1">
            <div className="flex-1 flex flex-col">
              <Header
                onContactsRefreshed={() => window.location.reload()}
                onOpenAppLock={() => setIsAppLockOpen(true)}
                onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
                onOpenColumnSelector={() => setIsColumnSelectorOpen(true)}
              />
              {/* Spacer به اندازه ارتفاع هدر برای جلوگیری از هم‌پوشانی */}
              <div className="h-16" aria-hidden="true" />
              <div
                className="flex-grow transition-[padding] duration-300 ease-in-out"
                style={
                  typeof document !== "undefined" && document?.documentElement?.dir === "rtl"
                    ? { paddingRight: isSidebarCollapsed ? 64 : 256, paddingLeft: 16, paddingTop: 16, paddingBottom: 16 }
                    : { paddingLeft: isSidebarCollapsed ? 64 : 256, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }
                }
                id="main-content"
              >
                <div className="h-full">
                  {children}
                </div>
              </div>
            </div>
            {/* سایدبار ثابت */}
            <DesktopSidebar
              activeTab={mapPathnameToTab(pathname) as NavTab}
              onTabChange={handleTabChange}
              onOpenSettings={handleOpenSettings}
              onCollapseChange={setIsSidebarCollapsed}
            />
          </div>
        </>
      )}
      
      {isMainPage && (
        <Button
          className="fixed bottom-24 left-6 md:left-8 rounded-full h-14 w-14 shadow-lg flex items-center justify-center z-40"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-contact-form'));
          }}
          aria-label="ایجاد مخاطب جدید"
        >
          <Plus size={24} />
        </Button>
      )}
      
      <Toaster richColors position="top-center" />
    </div>
  );
}