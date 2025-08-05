"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Layout, 
  User, 
  Phone, 
  Building2, 
  MapPin, 
  Tag, 
  Calendar,
  Star,
  Settings,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from "lucide-react";

interface Column {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  visible: boolean;
  width?: string;
  order: number;
}

interface ContactListColumnsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onColumnsChange: (columns: Column[]) => void;
  defaultColumns: Column[];
}

export function ContactListColumns({ 
  isOpen, 
  onOpenChange, 
  onColumnsChange, 
  defaultColumns 
}: ContactListColumnsProps) {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("visibility");

  const filteredColumns = columns.filter(column =>
    column.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    column.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    setColumns(prev => {
      const index = prev.findIndex(col => col.id === columnId);
      if (index === -1) return prev;

      const newColumns = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newColumns.length) return prev;

      [newColumns[index], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[index]];
      
      return newColumns.map((col, idx) => ({ ...col, order: idx }));
    });
  };

  const updateColumnWidth = (columnId: string, width: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, width } : col
    ));
  };

  const resetToDefaults = () => {
    setColumns(defaultColumns);
  };

  const saveColumns = () => {
    onColumnsChange(columns);
    localStorage.setItem('contact-list-columns', JSON.stringify(columns));
    onOpenChange(false);
  };

  const availableColumns = [
    {
      id: 'starred',
      label: 'ستاره‌دار',
      icon: Star,
      description: 'نمایش مخاطبان ستاره‌دار',
      visible: columns.find(c => c.id === 'starred')?.visible || false
    },
    {
      id: 'birthday',
      label: 'تاریخ تولد',
      icon: Calendar,
      description: 'نمایش تاریخ تولد مخاطبان',
      visible: columns.find(c => c.id === 'birthday')?.visible || false
    },
    {
      id: 'company',
      label: 'شرکت',
      icon: Building2,
      description: 'نمایش شرکت مخاطبان',
      visible: columns.find(c => c.id === 'company')?.visible || false
    },
    {
      id: 'group',
      label: 'گروه',
      icon: Tag,
      description: 'نمایش گروه مخاطبان',
      visible: columns.find(c => c.id === 'group')?.visible || false
    }
  ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
            <Layout size={24} />
            شخصی‌سازی ستون‌ها
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <Settings size={20} />
          </Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="جستجوی ستون‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visibility">دیداری</TabsTrigger>
            <TabsTrigger value="width">عرض</TabsTrigger>
            <TabsTrigger value="order">ترتیب</TabsTrigger>
          </TabsList>

          <TabsContent value="visibility" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ستون‌های فعلی</CardTitle>
                <CardDescription>
                  ستون‌هایی که در لیست مخاطبین نمایش داده می‌شوند
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredColumns.map((column) => {
                  const Icon = column.icon;
                  return (
                    <div key={column.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-primary" />
                        <div>
                          <div className="font-medium">{column.label}</div>
                          <div className="text-sm text-muted-foreground">{column.description}</div>
                        </div>
                      </div>
                      <Switch
                        checked={column.visible}
                        onCheckedChange={() => toggleColumnVisibility(column.id)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>افزودن ستون جدید</CardTitle>
                <CardDescription>
                  ستون‌های اضافی را به لیست خود اضافه کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableColumns
                  .filter(available => !columns.find(c => c.id === available.id))
                  .map((available) => {
                    const Icon = available.icon;
                    return (
                      <div key={available.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Icon size={18} className="text-muted-foreground" />
                          <div>
                            <div className="font-medium">{available.label}</div>
                            <div className="text-sm text-muted-foreground">{available.description}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const newColumn: Column = {
                              ...available,
                              visible: true,
                              order: columns.length
                            };
                            setColumns(prev => [...prev, newColumn]);
                          }}
                        >
                          افزودن
                        </Button>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="width" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>عرض ستون‌ها</CardTitle>
                <CardDescription>
                  عرض هر ستون را شخصی‌سازی کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {columns.filter(c => c.visible).map((column) => (
                  <div key={column.id} className="space-y-2">
                    <Label className="text-sm font-medium">{column.label}</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="پیکسل"
                        value={column.width?.replace('px', '') || ''}
                        onChange={(e) => updateColumnWidth(column.id, `${e.target.value}px`)}
                        className="w-24"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateColumnWidth(column.id, '')}
                      >
                        خودکار
                      </Button>
                      <Badge variant="secondary">
                        {column.width || 'خودکار'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="order" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ترتیب ستون‌ها</CardTitle>
                <CardDescription>
                  ترتیب نمایش ستون‌ها را تغییر دهید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {columns
                    .filter(c => c.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((column, index) => {
                      const Icon = column.icon;
                      return (
                        <div key={column.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <Icon size={18} className="text-primary" />
                            <span className="font-medium">{column.label}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === 0}
                              onClick={() => moveColumn(column.id, 'up')}
                            >
                              <EyeOff size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === columns.filter(c => c.visible).length - 1}
                              onClick={() => moveColumn(column.id, 'down')}
                            >
                              <Eye size={16} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-2 mt-6">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw size={16} className="mr-2" />
            بازگشت به پیش‌فرض
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button onClick={saveColumns}>
              <Save size={16} className="mr-2" />
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}