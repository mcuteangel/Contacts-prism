'use client';
// این صفحه برای جلوگیری از خطاهای SSR، کامپوننت مدیریت فیلدهای سفارشی را به‌صورت داینامیک و فقط در کلاینت لود می‌کند.

import dynamic from 'next/dynamic';

// توجه: فایل src/components/global-custom-fields-management.tsx یک named export به نام GlobalCustomFieldsManagement دارد
// بنابراین باید در dynamic mapping انجام دهیم تا default را به آن نگاشت کنیم.
const GlobalCustomFieldsManagement = dynamic(
  () =>
    import('../../../components/global-custom-fields-management').then((m) => ({
      default: m.GlobalCustomFieldsManagement,
    })),
  { ssr: false }
);

export default function CustomFieldsPage() {
  return <GlobalCustomFieldsManagement />;
}