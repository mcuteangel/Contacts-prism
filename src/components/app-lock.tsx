"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, EyeOff, Fingerprint, Key } from "lucide-react";
import { toast } from "sonner";

interface AppLockProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppLock({ isOpen, onOpenChange }: AppLockProps) {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [mode, setMode] = useState<"setup" | "unlock" | "change">("setup");

  useEffect(() => {
    // Load saved settings
    const savedPassword = localStorage.getItem('app-password');
    const savedBiometric = localStorage.getItem('app-biometric');
    setIsBiometricEnabled(savedBiometric === 'true');
    
    if (savedPassword) {
      setMode("unlock");
    }
  }, []);

  const handleSetupPassword = () => {
    if (password !== confirmPassword) {
      toast.error("رمز عبور و تأیید آن یکسان نیستند");
      return;
    }
    
    if (password.length < 4) {
      toast.error("رمز عبور باید حداقل ۴ کاراکتر باشد");
      return;
    }

    localStorage.setItem('app-password', password);
    localStorage.setItem('app-biometric', isBiometricEnabled.toString());
    toast.success("قفل برنامه با موفقیت تنظیم شد");
    setPassword("");
    setConfirmPassword("");
    setMode("unlock");
    onOpenChange(false);
  };

  const handleUnlock = () => {
    const savedPassword = localStorage.getItem('app-password');
    if (password === savedPassword) {
      toast.success("قفل برنامه باز شد");
      setPassword("");
      onOpenChange(false);
    } else {
      toast.error("رمز عبور اشتباه است");
    }
  };

  const handleChangePassword = () => {
    const savedPassword = localStorage.getItem('app-password');
    if (currentPassword !== savedPassword) {
      toast.error("رمز عبور فعلی اشتباه است");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("رمز عبور جدید و تأیید آن یکسان نیستند");
      return;
    }

    localStorage.setItem('app-password', password);
    toast.success("رمز عبور با موفقیت تغییر کرد");
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setMode("unlock");
  };

  const handleRemovePassword = () => {
    const savedPassword = localStorage.getItem('app-password');
    if (currentPassword !== savedPassword) {
      toast.error("رمز عبور فعلی اشتباه است");
      return;
    }

    localStorage.removeItem('app-password');
    localStorage.removeItem('app-biometric');
    setIsBiometricEnabled(false);
    toast.success("قفل برنامه حذف شد");
    setCurrentPassword("");
    setMode("setup");
  };

  const handleBiometricAuth = async () => {
    if ('credentials' in navigator) {
      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: 'required'
          }
        });
        
        if (credential) {
          toast.success("احراز هویت بیومتریک موفق بود");
          onOpenChange(false);
        }
      } catch (error) {
        toast.error("احراز هویت بیومتریک با شکست مواجه شد");
      }
    } else {
      toast.error("مرورگر شما از احراز هویت بیومتریک پشتیبانی نمی‌کند");
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
            <Shield size={24} />
            قفل برنامه
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <Key size={20} />
          </Button>
        </div>

        {mode === "setup" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تنظیمات امنیتی</CardTitle>
                <CardDescription>
                  برای محافظت از داده‌های خود، قفل برنامه را فعال کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>استفاده از بیومتریک</Label>
                    <p className="text-sm text-muted-foreground">
                      با اثر انگشت یا چهره برنامه را باز کنید
                    </p>
                  </div>
                  <Switch
                    checked={isBiometricEnabled}
                    onCheckedChange={setIsBiometricEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setup-password">رمز عبور</Label>
                  <div className="relative">
                    <Input
                      id="setup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور جدید"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأیید رمز عبور</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="رمز عبور را دوباره وارد کنید"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSetupPassword} className="w-full">
                  <Lock size={16} className="mr-2" />
                  تنظیم قفل برنامه
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {mode === "unlock" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">باز کردن قفل برنامه</CardTitle>
                <CardDescription>
                  برنامه قفل شده است. برای ادامه یکی از روش‌های زیر را انتخاب کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isBiometricEnabled && (
                  <Button
                    onClick={handleBiometricAuth}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Fingerprint size={18} />
                    استفاده از بیومتریک
                  </Button>
                )}

                <div className="space-y-2">
                  <Label htmlFor="unlock-password">رمز عبور</Label>
                  <div className="relative">
                    <Input
                      id="unlock-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleUnlock} className="flex items-center gap-2">
                    <Lock size={16} />
                    باز کردن
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("change");
                      setPassword("");
                      setShowPassword(false);
                    }}
                  >
                    تغییر رمز
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {mode === "change" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تغییر رمز عبور</CardTitle>
                <CardDescription>
                  رمز عبور جدید خود را تنظیم کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">رمز عبور فعلی</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="رمز عبور فعلی"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">رمز عبور جدید</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور جدید"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">تأیید رمز عبور جدید</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="رمز عبور جدید را دوباره وارد کنید"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleChangePassword}>
                    <Lock size={16} />
                    تغییر رمز
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("unlock");
                      setCurrentPassword("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    انصراف
                  </Button>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleRemovePassword}
                  className="w-full"
                >
                  حذف قفل برنامه
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}