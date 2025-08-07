import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { ContactFormProvider } from "@/contexts/contact-form-context";
import { AuthShell } from "./providers/auth-shell";
import { getDirFromLang } from "@/lib/direction";
import { I18nProvider } from "@/i18n/I18nProvider";

/**
 * توجه: RootLayout باید سروری باقی بماند تا بتواند metadata صادر کند.
 * AuthGate را به فایل جداگانهٔ کلاینت منتقل می‌کنیم و آن را اینجا استفاده می‌کنیم.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "مخاطبین منشور",
  description: "اپلیکیشن مدیریت مخاطبین محلی",
};

function AuthGate({ children }: { children: React.ReactNode }) {
  // AuthGate دیگر از useAuth مستقیم استفاده نمی‌کند.
  // منطق احراز هویت به AuthShell (کلاینت) منتقل شده است که در پایین استفاده می‌شود.
  return <>{children}</>;
}

import { headers } from "next/headers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // تشخیص ساده زبان از Accept-Language برای تعیین dir/lang در SSR
  // headers() در Next 15 هم‌اکنون یک Promise برمی‌گرداند؛ برای دسترسی به get باید await کنیم.
  // چون RootLayout تابع سروری sync است، از headers().getUnsafeHeaders() برای دسترسی فوری استفاده می‌کنیم.
  // توجه: getUnsafeHeaders در رندر سرور در دسترس است و مقدار ReadonlyHeaders را برمی‌گرداند.
  const accept =
    (headers() as any)?.getUnsafeHeaders?.().get("accept-language") || "";
  const first = accept.split(",")[0]?.trim() || "fa";
  const lang = first.split(";")[0].split("-")[0] || "fa";
  const dir = getDirFromLang(lang);

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* احراز هویت و الزام ورود در شل کلاینتی */}
          <I18nProvider>
            <AuthShell>
              <ContactFormProvider>
                <MainLayout>{children}</MainLayout>
              </ContactFormProvider>
            </AuthShell>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}