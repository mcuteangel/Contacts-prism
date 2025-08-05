"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";

interface ThemeSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemeSelector({ isOpen, onOpenChange }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: "light",
      name: "روشن",
      icon: Sun,
      description: "تم روشن با پس‌زمینه روشن"
    },
    {
      id: "dark",
      name: "تاریک",
      icon: Moon,
      description: "تم تاریک با پس‌زمینه تیره"
    },
    {
      id: "system",
      name: "سیستم",
      icon: Monitor,
      description: "همگام با تنظیمات سیستم"
    }
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary-foreground">شخصی‌سازی ظاهر</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <Palette size={20} />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium mb-3 block">انتخاب تم</Label>
            <RadioGroup value={theme} onValueChange={handleThemeChange}>
              <div className="grid grid-cols-1 gap-3">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  return (
                    <Card 
                      key={themeOption.id}
                      className={`cursor-pointer transition-all ${
                        theme === themeOption.id 
                          ? "ring-2 ring-primary ring-offset-2" 
                          : "hover:bg-accent"
                      }`}
                      onClick={() => handleThemeChange(themeOption.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <RadioGroupItem value={themeOption.id} id={themeOption.id} />
                        <div className="flex items-center gap-3">
                          <Icon size={24} className="text-primary" />
                          <div>
                            <div className="font-medium">{themeOption.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {themeOption.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">تنظیمات رنگLabel>
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">رنگ اصلی</span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-8 h-8 rounded-full bg-blue-600"
                      onClick={() => document.documentElement.style.setProperty('--primary', '221.2 83.2% 53.3%')}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-8 h-8 rounded-full bg-green-600"
                      onClick={() => document.documentElement.style.setProperty('--primary', '142.1 76.2% 36.3%')}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-8 h-8 rounded-full bg-purple-600"
                      onClick={() => document.documentElement.style.setProperty('--primary', '262.4 83.3% 57.8%')}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">حالت شیشه‌ای</span>
                  <Button variant="outline" size="sm">
                    فعال
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </div>
  );
}