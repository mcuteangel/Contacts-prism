import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { ContactFormProvider } from "@/contexts/contact-form-context";
import { AuthShell } from "./providers/auth-shell";
import { getDirFromLang } from "@/lib/direction";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // زبان پیش‌فرض برنامه (می‌تواند بعداً از i18n یا تنظیمات کاربر بیاید)
  const lang = "fa";
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
          <AuthShell>
            <ContactFormProvider>
              <MainLayout>{children}</MainLayout>
            </ContactFormProvider>
          </AuthShell>
        </ThemeProvider>
      </body>
    </html>
  );
}