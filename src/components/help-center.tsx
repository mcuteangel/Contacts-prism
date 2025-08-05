"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, MessageCircle, Mail, Phone, Video, FileText, CheckCircle } from "lucide-react";

export function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const faqs = [
    {
      question: "چگونه مخاطب جدید اضافه کنم؟",
      answer: "روی دکمه '+' در پایین صفحه یا گوشه سمت چپ کلیک کنید. اطلاعات مخاطب را وارد کرده و ذخیره کنید.",
      category: "اضافه کردن مخاطب"
    },
    {
      question: "چگونه مخاطبین را گروه‌بندی کنم؟",
      answer: "به صفحه گروه‌ها بروید و گروه جدید ایجاد کنید. سپس در فرم افزودن مخاطب، گروه مورد نظر را انتخاب کنید.",
      category: "مدیریت گروه‌ها"
    },
    {
      question: "چگونه فیلدهای سفارشی اضافه کنم؟",
      answer: "به صفحه فیلدهای سفارشی بروید و با کلیک روی 'افزودن فیلد'، فیلدهای دلخواه خود را تعریف کنید.",
      category: "فیلدهای سفارشی"
    },
    {
      question: "چگونه از مخاطبین پشتیبان بگیرم؟",
      answer: "به صفحه ابزار بروید و روی دکمه 'خروجی' کلیک کنید. فایل JSON را دانلود کرده و در مکان امنی ذخیره کنید.",
      category: "پشتیبان‌گیری"
    },
    {
      question: "چگونه تماس با مخاطب برقرار کنم؟",
      answer: "روی آیکون تلفن کنار شماره مورد نظر کلیک کنید. برنامه تماس دستگاه شما باز می‌شود.",
      category: "ارتباطات"
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your support system
    alert("پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.");
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground mb-2">مرکز راهنما</h1>
        <p className="text-muted-foreground">
          پاسخ به سوالات متداول و ارتباط با تیم پشتیبانی
        </p>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">سوالات متداول</TabsTrigger>
          <TabsTrigger value="guides">راهنماها</TabsTrigger>
          <TabsTrigger value="contact">تماس با ما</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="جستجوی سوالات متداول..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen size={18} />
                    {faq.question}
                  </CardTitle>
                  <CardDescription>
                    <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                      {faq.category}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Search size={48} className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">هیچ نتیجه‌ای یافت نشد</h3>
                  <p className="text-muted-foreground">
                    با کلیدواژه دیگری جستجو کنید یا به بخش راهنماها مراجعه کنید.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guides" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  راهنمای شروع کار
                </CardTitle>
                <CardDescription>
                  نحوه نصب و استفاده اولیه از برنامه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">مرحله ۱: نصب برنامه</h4>
                    <p className="text-sm text-muted-foreground">
                      برنامه را از طریق مرورگر وب باز کرده و گزینه "Add to Home Screen" را انتخاب کنید.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">مرحله ۲: ایجاد مخاطب اول</h4>
                    <p className="text-sm text-muted-foreground">
                      با کلیک روی دکمه +، اولین مخاطب خود را اضافه کنید.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">مرحله ۳: ایجاد گروه‌ها</h4>
                    <p className="text-sm text-muted-foreground">
                      برای سازماندهی بهتر مخاطبین، گروه‌های مورد نیاز خود را ایجاد کنید.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video size={20} />
                  ویدیوهای آموزشی
                </CardTitle>
                <CardDescription>
                  تماشای ویدیوهای آموزشی برای یادگیری بهتر
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">معرفی برنامه</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      آشنایی با رابط کاربری و قابلیت‌های اصلی
                    </p>
                    <Button variant="outline" size="sm">
                      تماشا
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">مدیریت گروه‌ها</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      نحوه ایجاد و مدیریت گروه‌های مخاطبین
                    </p>
                    <Button variant="outline" size="sm">
                      تماشا
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle size={20} />
                  تماس با پشتیبانی
                </CardTitle>
                <CardDescription>
                  برای دریافت کمک بیشتر با تیم پشتیبانی ما در ارتباط باشید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">نام و نام خانوادگی</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">ایمیل</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">موضوع</Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">پیام</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      rows={5}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                      ارسال پیام
                    </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Mail size={24} className="mx-auto h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium mb-1">ایمیل پشتیبانی</h4>
                  <p className="text-sm text-muted-foreground">support@prism-contacts.com</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Phone size={24} className="mx-auto h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium mb-1">تلفن پشتیبانی</h4>
                  <p className="text-sm text-muted-foreground">021-12345678</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <MessageCircle size={24} className="mx-auto h-8 w-8 text-primary mb-3" />
                  <h4 className="font-medium mb-1">چت آنلاین</h4>
                  <p className="text-sm text-muted-foreground">شنبه تا چهارشنبه 9-17</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}