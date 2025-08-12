/**
 * Lazy-loaded route components for better performance
 * This file contains all the lazy imports for route components
 */

import { lazy } from 'react';

// Main pages
export const ContactsPage = lazy(() => import('@/app/contacts/page'));
export const GroupsPage = lazy(() => import('@/app/groups/page'));
export const AnalyticsPage = lazy(() => import('@/app/analytics/page'));
export const SettingsPage = lazy(() => import('@/app/settings/page'));
export const HelpPage = lazy(() => import('@/app/help/page'));
export const InsightsPage = lazy(() => import('@/app/insights/page'));

// Tools pages
export const CustomFieldsPage = lazy(() => import('@/app/tools/custom-fields/page'));
export const AIPage = lazy(() => import('@/app/ai/page'));

// Contact specific pages
export const ContactEditPage = lazy(() => import('@/app/contacts/[id]/edit/page'));
export const ContactViewPage = lazy(() => import('@/app/contacts/[id]/page'));

// Settings sub-pages
export const AdvancedSettingsPage = lazy(() => import('@/app/settings-advanced/page'));

// Auth pages
export const LoginPage = lazy(() => import('@/app/login/page'));

// Loading component for lazy routes
export const RouteLoadingSpinner = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-sm text-muted-foreground">در حال بارگذاری...</span>
  </div>
);