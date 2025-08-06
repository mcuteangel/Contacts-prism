"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Sun, Moon, Monitor, Droplets, Circle, Square, Hexagon } from "lucide-react";
import { useTheme } from "next-themes";

interface ThemeSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ColorPreset {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const colorPresets: ColorPreset[] = [
  {
    name: "آبی",
    colors: {
      primary: "221.2 83.2% 53.3%",
      secondary: "210.4 40% 98%",
      accent: "221.2 83.2% 53.3%"
    }
  },
  {
    name: "سبز",
    colors: {
      primary: "142.1 76.2% 36.3%",
      secondary: "142.1 76.2% 96%",
      accent: "142.1 76.2% 36.3%"
    }
  },
  {
    name: "بنفش",
    colors: {
      primary: "262.4 83.3% 57.8%",
      secondary: "262.4 83.3% 97%",
      accent: "262.4 83.3% 57.8%"
    }
  },
  {
    name: "نارنجی",
    colors: {
      primary: "24.6 95% 53.1%",
      secondary: "24.6 95% 96%",
      accent: "24.6 95% 53.1%"
    }
  },
  {
    name: "قرمز",
    colors: {
      primary: "0 84.2% 60.2%",
      secondary: "0 84.2% 96%",
      accent: "0 84.2% 60.2%"
    }
  }
];

const shapePresets = [
  { name: "دایره", icon: Circle, value: "50%" },
  { name: "مربع", icon: Square, value: "0.375rem" },
  { name: "هشتگ", icon: Hexagon, value: "0.5rem" }
];

export function ThemeSelector({ isOpen, onOpenChange }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [glassOpacity, setGlassOpacity] = useState([70]);
  const [blurAmount, setBlurAmount] = useState([12]);
  const [selectedColors, setSelectedColors] = useState({
    primary: "221.2 83.2% 53.3%",
    secondary: "210.4 40% 98%",
    accent: "221.2 83.2% 53.3%"
  });
  const [selectedShape, setSelectedShape] = useState("0.5rem");
  const [isGlassEnabled, setIsGlassEnabled] = useState(true);

  const applyColorPreset = (preset: ColorPreset) => {
    setSelectedColors(preset.colors);
    document.documentElement.style.setProperty('--primary', preset.colors.primary);
    document.documentElement.style.setProperty('--secondary', preset.colors.secondary);
    document.documentElement.style.setProperty('--accent', preset.colors.accent);
  };

  const applyShapePreset = (shape: string) => {
    setSelectedShape(shape);
    document.documentElement.style.setProperty('--radius', shape);
  };

  const handleCustomColorChange = (colorType: string, value: string) => {
    setSelectedColors(prev => ({ ...prev, [colorType]: value }));
    document.documentElement.style.setProperty(`--${colorType}`, value);
  };

  const resetToDefaults = () => {
    setSelectedColors({
      primary: "221.2 83.2% 53.3%",
      secondary: "210.4 40% 98%",
      accent: "221.2 83.2% 53.3%"
    });
    setGlassOpacity([70]);
    setBlurAmount([12]);
    setSelectedShape("0.5rem");
    setIsGlassEnabled(true);
    
    document.documentElement.style.setProperty('--primary', "221.2 83.2% 53.3%");
    document.documentElement.style.setProperty('--secondary', "210.4 40% 98%");
    document.documentElement.style.setProperty('--accent', "221.2 83.2% 53.3%");
    document.documentElement.style.setProperty('--radius', "0.5rem");
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
            <Palette size={24} />
            شخصی‌سازی ظاهر
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <Hexagon size={20} />
          </Button>
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">رنگ‌ها</TabsTrigger>
            <TabsTrigger value="effects">افکت‌ها</TabsTrigger>
            <TabsTrigger value="shapes">اشکال</TabsTrigger>
            <TabsTrigger value="presets">پیش‌فرض‌ها</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>رنگ‌های اصلی</CardTitle>
                <CardDescription>
                  رنگ‌های اصلی برنامه را شخصی‌سازی کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium mb-3 block">تنظیمات رنگ</Label>
                  <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>رنگ اصلی</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={hslToHex(selectedColors.primary)}
                            onChange={(e) => {
                              const hex = e.target.value; // #rrggbb
                              const next = hexToHslString(hex); // "H S% L%"
                              handleCustomColorChange('primary', next);
                            }}
                            className="w-12 h-12 rounded border-2 border-border"
                          />
                          <Input
                            value={selectedColors.primary}
                            onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                            placeholder="HSL value"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>رنگ ثانویه</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={hslToHex(selectedColors.secondary)}
                            onChange={(e) => {
                              const hex = e.target.value;
                              const next = hexToHslString(hex);
                              handleCustomColorChange('secondary', next);
                            }}
                            className="w-12 h-12 rounded border-2 border-border"
                          />
                          <Input
                            value={selectedColors.secondary}
                            onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                            placeholder="HSL value"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>رنگ تأکید</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={hslToHex(selectedColors.accent)}
                            onChange={(e) => {
                              const hex = e.target.value;
                              const next = hexToHslString(hex);
                              handleCustomColorChange('accent', next);
                            }}
                            className="w-12 h-12 rounded border-2 border-border"
                          />
                          <Input
                            value={selectedColors.accent}
                            onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                            placeholder="HSL value"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="effects" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets size={20} />
                  افکت‌های شیشه‌ای
                </CardTitle>
                <CardDescription>
                  تنظیمات افکت شیشه‌ای برای پس‌زمینه‌ها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>فعال‌سازی افکت شیشه‌ای</Label>
                    <p className="text-sm text-muted-foreground">
                      افکت شیشه‌ای را برای المان‌ها فعال یا غیرفعال کنید
                    </p>
                  </div>
                  <Switch
                    checked={isGlassEnabled}
                    onCheckedChange={setIsGlassEnabled}
                  />
                </div>

                {isGlassEnabled && (
                  <>
                    <div className="space-y-3">
                      <Label>شفافیت: {glassOpacity[0]}%</Label>
                      <Slider
                        value={glassOpacity}
                        onValueChange={setGlassOpacity}
                        max={100}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        میزان شفافیت پس‌زمینه شیشه‌ای
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>مقدار تار شدن: {blurAmount[0]}px</Label>
                      <Slider
                        value={blurAmount}
                        onValueChange={setBlurAmount}
                        max={30}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground">
                        میزان تار شدن پس‌زمینه (blur)
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shapes" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>اشکال و گوشه‌ها</CardTitle>
                <CardDescription>
                  شکل المان‌ها و گوشه‌های گرد را تنظیم کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>شکل پیش‌فرض</Label>
                <div className="grid grid-cols-3 gap-3">
                  {shapePresets.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <Button
                        key={preset.name}
                        variant={selectedShape === preset.value ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => applyShapePreset(preset.value)}
                      >
                        <Icon size={24} />
                        <span className="text-sm">{preset.name}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label>شخصی‌سازی گوشه‌ها</Label>
                  <Input
                    type="number"
                    value={selectedShape}
                    onChange={(e) => applyShapePreset(e.target.value)}
                    placeholder="مقدار radius (px یا %)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presets" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>پیش‌فرض‌های رنگی</CardTitle>
                <CardDescription>
                  از ترکیب‌های رنگی از پیش تعریف شده استفاده کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => applyColorPreset(preset)}
                    >
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: `hsl(${preset.colors.secondary})` }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
                        />
                      </div>
                      <span className="text-sm">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تم‌های کامل</CardTitle>
                <CardDescription>
                  ترکیب کامل رنگ و افکت را انتخاب کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4"
                    onClick={() => {
                      setTheme("light");
                      applyColorPreset(colorPresets[0]); // Blue
                      setGlassOpacity([70]);
                      setBlurAmount([12]);
                    }}
                  >
                    <div className="text-left w-full">
                      <h4 className="font-semibold mb-2">روشن مدرن</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        تم روشن با افکت شیشه‌ای و رنگ آبی
                      </p>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-blue-500" />
                        <div className="w-4 h-4 rounded bg-blue-100" />
                        <div className="w-4 h-4 rounded bg-blue-200" />
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4"
                    onClick={() => {
                      setTheme("dark");
                      applyColorPreset(colorPresets[2]); // Purple
                      setGlassOpacity([80]);
                      setBlurAmount([16]);
                    }}
                  >
                    <div className="text-left w-full">
                      <h4 className="font-semibold mb-2">تاریک گلاسی</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        تم تاریک با افکت شیشه‌ای قوی و رنگ بنفش
                      </p>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-purple-500" />
                        <div className="w-4 h-4 rounded bg-purple-900" />
                        <div className="w-4 h-4 rounded bg-purple-800" />
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 mt-6">
          <Button variant="outline" onClick={resetToDefaults}>
            بازگشت به پیش‌فرض
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Utilities:
 * - selectedColors.* ذخیره به صورت "H S% L%"
 * - input[type=color] نیاز به "#rrggbb" دارد، پس تبدیل HSL<->HEX لازم است.
 */
function hslToHex(hslString: string): string {
  // hslString format: "H S% L%"
  try {
    const [hStr, sStr, lStr] = hslString.split(" ");
    const h = parseFloat(hStr);
    const s = parseFloat(sStr.replace("%", "")) / 100;
    const l = parseFloat(lStr.replace("%", "")) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = (h % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));

    let r1 = 0, g1 = 0, b1 = 0;
    if (0 <= hp && hp < 1) [r1, g1, b1] = [c, x, 0];
    else if (1 <= hp && hp < 2) [r1, g1, b1] = [x, c, 0];
    else if (2 <= hp && hp < 3) [r1, g1, b1] = [0, c, x];
    else if (3 <= hp && hp < 4) [r1, g1, b1] = [0, x, c];
    else if (4 <= hp && hp < 5) [r1, g1, b1] = [x, 0, c];
    else if (5 <= hp && hp <= 6) [r1, g1, b1] = [c, 0, x];

    const m = l - c / 2;
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);

    return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  } catch {
    return "#000000";
  }
}

function hexToHslString(hex: string): string {
  // hex: "#rrggbb"
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
      if (h < 0) h += 360;
    } else {
      h = 0;
      s = 0;
    }

    return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`;
  } catch {
    return "0 0% 0%";
  }
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}