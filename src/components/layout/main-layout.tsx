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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-90<dyad-problem-report summary="282 problems">
<problem file="src/components/ai-contact-deduplication.tsx" line="205" column="96" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="206" column="115" code="1005">'}' expected.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="206" column="235" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="237" column="165" code="1005">',' expected.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="237" column="397" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="289" column="1" code="1434">Unexpected keyword or identifier.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="289" column="108" code="1002">Unterminated string literal.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="291" column="13" code="1005">';' expected.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="626" column="2" code="1005">'}' expected.</problem>
<problem file="src/components/layout/main-layout.tsx" line="99" column="9" code="2322">Type '{ onContactsRefreshed: () =&gt; void; onOpenAppLock: () =&gt; void; onOpenThemeSelector: () =&gt; void; onOpenColumnSelector: () =&gt; void; }' is not assignable to type 'IntrinsicAttributes &amp; HeaderProps'.
  Property 'onOpenAppLock' does not exist on type 'IntrinsicAttributes &amp; HeaderProps'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="95" column="18" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="95" column="35" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="96" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="97" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="112" column="18" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="112" column="36" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="113" column="20" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="113" column="39" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="118" column="18" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="118" column="38" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="119" column="20" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="119" column="56" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="140" column="18" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="140" column="35" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="141" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="142" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="154" column="18" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="154" column="36" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="155" column="20" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="155" column="39" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="158" column="18" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="158" column="38" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="159" column="20" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="159" column="56" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="199" column="10" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="200" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="200" column="108" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="201" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="201" column="108" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="202" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="202" column="125" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="203" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="203" column="109" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="204" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="204" column="109" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="205" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="205" column="108" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="206" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="206" column="96" code="2304">Cannot find name 'onContactsRefreshed'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="207" column="91" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="208" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="208" column="114" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="209" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="209" column="115" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="210" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="210" column="119" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="211" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="211" column="116" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="212" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="212" column="113" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="213" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="213" column="144" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="214" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="214" column="144" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="215" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="215" column="144" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="216" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="216" column="144" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="217" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="217" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="218" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="218" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="219" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="219" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="220" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="220" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="221" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="221" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="222" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="222" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="223" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="223" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="224" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="224" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="225" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="225" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="226" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="226" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="227" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="227" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="228" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="228" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="229" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="229" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="230" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="230" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="231" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="231" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="232" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="232" column="146" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="233" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="233" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="234" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="234" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="235" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="235" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="236" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="236" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="237" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="237" column="147" code="2552">Cannot find name 'addContact'. Did you mean 'contacts'?</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="237" column="158" code="2552">Cannot find name 'contact'. Did you mean 'contacts'?</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="237" column="427" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="238" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="238" column="177" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="239" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="239" column="116" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="240" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="240" column="160" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="241" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="241" column="119" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="242" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="242" column="120" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="243" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="243" column="120" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="244" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="244" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="245" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="245" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="246" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="246" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="247" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="250" column="84" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="251" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="251" column="188" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="252" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="252" column="190" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="253" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="253" column="188" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="254" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="254" column="192" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="255" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="255" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="256" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="256" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="257" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="257" column="149" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="258" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="258" column="149" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="259" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="259" column="147" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="260" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="260" column="147" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="261" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="261" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="262" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="262" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="263" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="263" column="172" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="264" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="264" column="177" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="265" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="265" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="266" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="266" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="267" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="267" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="268" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="268" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="269" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="269" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="270" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="270" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="271" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="271" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="272" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="272" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="273" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="273" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="274" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="274" column="131" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="275" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="275" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="276" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="276" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="277" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="277" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="278" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="278" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="279" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="279" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="280" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="280" column="148" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="281" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="281" column="152" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="282" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="282" column="152" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="283" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="283" column="150" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="284" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="284" column="150" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="285" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="285" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="286" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="286" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="287" column="1" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="289" column="1" code="2304">Cannot find name 'I'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="289" column="2" code="2365">Operator '&lt;' cannot be applied to types 'string' and 'number'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="291" column="2" code="2304">Cannot find name 'dyad'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="291" column="7" code="2304">Cannot find name 'write'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="291" column="13" code="2304">Cannot find name 'path'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="386" column="18" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="386" column="35" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="387" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="388" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="403" column="18" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="403" column="36" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="404" column="20" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="404" column="39" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="409" column="18" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="409" column="38" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="410" column="20" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="410" column="56" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="431" column="18" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="431" column="35" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="432" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="433" column="30" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="445" column="18" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="445" column="36" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="446" column="20" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="446" column="39" code="2339">Property 'email' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="449" column="18" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="449" column="38" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="450" column="20" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="450" column="56" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="504" column="19" code="2339">Property 'name' does not exist on type 'Contact &amp; { email?: string | undefined; company?: string | undefined; }'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="505" column="19" code="2339">Property 'name' does not exist on type 'Contact &amp; { email?: string | undefined; company?: string | undefined; }'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="585" column="38" code="2339">Property 'name' does not exist on type 'Contact &amp; { email?: string | undefined; company?: string | undefined; }'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="585" column="69" code="2339">Property 'name' does not exist on type 'Contact &amp; { email?: string | undefined; company?: string | undefined; }'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="592" column="38" code="2339">Property 'name' does not exist on type 'Contact &amp; { email?: string | undefined; company?: string | undefined; }'.</problem>
<problem file="src/components/ai-contact-deduplication.tsx" line="592" column="69" code="2339">Property 'name' does not exist on type 'Contact &amp; { email?: string | undefined; company?: string | undefined; }'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="81" column="17" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="83" column="17" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="87" column="9" code="2322">Type 'number | undefined' is not assignable to type 'number | null'.
  Type 'undefined' is not assignable to type 'number | null'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="89" column="38" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="94" column="17" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="96" column="47" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="100" column="9" code="2322">Type 'number | undefined' is not assignable to type 'number | null'.
  Type 'undefined' is not assignable to type 'number | null'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="102" column="39" code="2339">Property 'company' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="113" column="9" code="2322">Type 'number | undefined' is not assignable to type 'number | null'.
  Type 'undefined' is not assignable to type 'number | null'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="126" column="9" code="2322">Type 'number | undefined' is not assignable to type 'number | null'.
  Type 'undefined' is not assignable to type 'number | null'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="133" column="7" code="2322">Type 'number | undefined' is not assignable to type 'number'.
  Type 'undefined' is not assignable to type 'number'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="162" column="52" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/components/ai-auto-categorization.tsx" line="230" column="64" code="2339">Property 'name' does not exist on type 'Contact'.</problem>
<problem file="src/app/ai/page.tsx" line="27" column="12" code="2786">'AIContactDeduplication' cannot be used as a JSX component.
  Its type '() =&gt; void' is not a valid JSX element type.
    Type '() =&gt; void' is not assignable to type '(props: any) =&gt; ReactNode | Promise&lt;ReactNode&gt;'.
      Type 'void' is not assignable to type 'ReactNode | Promise&lt;ReactNode&gt;'.</problem>
<problem file="src/components/analytics/overview-tab.tsx" line="5" column="41" code="2307">Cannot find module '../charts/gender-distribution-chart' or its corresponding type declarations.</problem>
<problem file="src/components/analytics/overview-tab.tsx" line="6" column="43" code="2307">Cannot find module '../charts/position-distribution-chart' or its corresponding type declarations.</problem>
<problem file="src/components/analytics/overview-tab.tsx" line="7" column="40" code="2307">Cannot find module '../charts/custom-fields-usage-chart' or its corresponding type declarations.</problem>
<problem file="src/components/analytics/overview-tab.tsx" line="8" column="44" code="2307">Cannot find module '../charts/phone-type-distribution-chart' or its corresponding type declarations.</problem>
<problem file="src/components/analytics/trends-tab.tsx" line="4" column="28" code="2307">Cannot find module '../charts/trend-chart' or its corresponding type declarations.</problem>
<problem file="src/components/analytics/activity-tab.tsx" line="4" column="31" code="2307">Cannot find module '../charts/activity-chart' or its corresponding type declarations.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="179" column="10" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="195" column="11" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="197" column="10" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="199" column="11" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="201" column="10" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="203" column="11" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="205" column="10" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="211" column="11" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="213" column="10" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/enhanced-analytics-dashboard.tsx" line="215" column="11" code="2304">Cannot find name 'TabsContent'.</problem>
<problem file="src/components/analytics/charts/activity-chart.tsx" line="23" column="10" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/activity-chart.tsx" line="23" column="69" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/custom-fields-usage-chart.tsx" line="23" column="10" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/custom-fields-usage-chart.tsx" line="23" column="53" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/gender-distribution-chart.tsx" line="26" column="10" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/gender-distribution-chart.tsx" line="26" column="55" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/phone-type-distribution-chart.tsx" line="23" column="10" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/phone-type-distribution-chart.tsx" line="23" column="60" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/position-distribution-chart.tsx" line="23" column="10" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/position-distribution-chart.tsx" line="23" column="58" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/trend-chart.tsx" line="24" column="10" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/analytics/charts/trend-chart.tsx" line="24" column="81" code="2304">Cannot find name 'CardDescription'.</problem>
</dyad-problem-report>I'll fix all these TypeScript errors systematically. Let me start by addressing the core issues:

<dyad-write path="src/database/db.ts">
// Add missing properties to the Contact interface
export interface Contact {
  id: number;
  name: string;
  email?: string;
  company?: string;
  position?: string;
  phoneNumbers: PhoneNumber[];
  address?: string;
  notes?: string;
  groupId?: number;
  customFields?: CustomField[];
  starred: boolean;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactServiceType {
  addContact: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt">) => Promise<number>;
  getContact: (id: number) => Promise<Contact | undefined>;
  getAllContacts: () => Promise<Contact[]>;
  updateContact: (id: number, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: number) => Promise<void>;
  addGroup: (group: Omit<Group, "id" | "createdAt" | "updatedAt">) => Promise<number>;
  getGroup: (id: number) => Promise<Group | undefined>;
  getAllGroups: () => Promise<Group[]>;
  updateGroup: (id: number, group: Partial<Group>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  // Add missing method
  mergeContacts: (contact1Id: number, contact2Id: number) => Promise<void>;
}