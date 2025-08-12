"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, LogIn } from "lucide-react";

/**
 * صفحه لاگین با Glassmorphism واقعی:
 * - لایه پس‌زمینه با گرادیان و الگوی subtle
 * - خود کارت شیشه‌ای: کلاس glass + شفافیت ورودی‌ها و دکمه‌ها
 * - حلقه‌های نورانی بلور برای حس عمق
 */
export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  // تابع تبدیل خطاهای انگلیسی به فارسی
  const translateError = (error: string): string => {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'اطلاعات ورود نامعتبر است',
      'Email not confirmed': 'ایمیل تأیید نشده است',
      'Too many requests': 'تعداد درخواست‌ها زیاد است، لطفاً کمی صبر کنید',
      'User not found': 'کاربر یافت نشد',
      'Invalid email': 'فرمت ایمیل نامعتبر است',
      'Password should be at least 6 characters': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
      'Network error': 'خطای شبکه، لطفاً اتصال اینترنت خود را بررسی کنید',
      'Server error': 'خطای سرور، لطفاً بعداً تلاش کنید'
    };

    // جستجوی دقیق
    if (errorMap[error]) {
      return errorMap[error];
    }

    // جستجوی جزئی
    for (const [englishError, persianError] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(englishError.toLowerCase())) {
        return persianError;
      }
    }

    // اگر ترجمه‌ای پیدا نشد، خطای اصلی را برگردان
    return error;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) {
      setError(translateError(error));
      setSubmitting(false);
      return;
    }
    router.replace("/");
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* لایه گرادیان پس‌زمینه */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-blue-200/40 via-purple-200/30 to-pink-200/40 dark:from-slate-900 dark:via-slate-950 dark:to-black" />
      {/* حلقه‌های بلوری نورانی برای حس عمق */}
      <div className="pointer-events-none absolute -z-10 inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-blue-400/30 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl dark:bg-fuchsia-500/10" />
        <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-500/10" />
      </div>

      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        {/* کارت شیشه‌ای */}
        <Card className="w-full max-w-md glass border border-white/20 dark:border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30">
              <Shield className="text-primary" size={22} />
            </div>
            <CardTitle className="text-2xl">ورود به حساب</CardTitle>
            <CardDescription className="text-sm">
              برای استفاده از اپلیکیشن، با حساب Supabase خود وارد شوید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">ایمیل</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || submitting}
                  className="bg-background/60 backdrop-blur-sm border-white/30 dark:border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || submitting}
                  className="bg-background/60 backdrop-blur-sm border-white/30 dark:border-white/10"
                />
              </div>
              {error && (
                <div className="rounded-md bg-destructive/15 text-destructive text-sm px-3 py-2 border border-destructive/30 backdrop-blur-sm">
                  <div className="font-medium">خطا در ورود:</div>
                  <div className="mt-1">{error}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    اگر حساب کاربری ندارید، ابتدا در Supabase Dashboard یک کاربر ایجاد کنید.
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary/80 hover:bg-primary/90 border-white/20 backdrop-blur-sm"
                disabled={loading || submitting}
              >
                <LogIn size={16} className="ml-2" />
                {submitting ? "در حال ورود..." : "ورود"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                با ورود، قوانین حریم‌خصوصی و شرایط استفاده را می‌پذیرید
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}