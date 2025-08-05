"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";

interface CustomFieldTemplate {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'list';
  options?: string[]; // For list type
  description?: string;
  required: boolean;
}

export function GlobalCustomFieldsManagement() {
  const [customFields, setCustomFields] = useState<CustomFieldTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldTemplate | null>(null);
  const [newField, setNewField] = useState<Partial<CustomFieldTemplate>>({
    name: "",
    type: "text",
    options: [],
    description: "",
    required: false
  });

  // Load custom fields from localStorage
  useEffect(() => {
    const savedFields = localStorage.getItem('globalCustomFields');
    if (savedFields) {
      try {
        setCustomFields(JSON.parse(savedFields));
      } catch (error) {
        console.error("Error loading custom fields:", error);
      }
    }
  }, []);

  // Save custom fields to localStorage
  const saveCustomFields = (fields: CustomFieldTemplate[]) => {
    localStorage.setItem('globalCustomFields', JSON.stringify(fields));
    setCustomFields(fields);
  };

  const handleAddField = () => {
    if (!newField.name?.trim()) {
      toast.error("نام فیلد الزامی است");
      return;
    }

    const field: CustomFieldTemplate = {
      id: Date.now().toString(),
      name: newField.name.trim(),
      type: newField.type as 'text' | 'number' | 'date' | 'list',
      options: newField.options || [],
      description: newField.description?.trim() || "",
      required: newField.required || false
    };

    saveCustomFields([...customFields, field]);
    setNewField({
      name: "",
      type: "text",
      options: [],
      description: "",
      required: false
    });
    setIsDialogOpen(false);
    toast.success("فیلد سفارشی با موفقیت اضافه شد");
  };

  const handleEditField = () => {
    if (!editingField?.name?.trim()) {
      toast.error("نام فیلد الزامی است");
      return;
    }

    const updatedFields = customFields.map(field =>
      field.id === editingField.id ? editingField : field
    );
    saveCustomFields(updatedFields);
    setEditingField(null);
    setIsDialogOpen(false);
    toast.success("فیلد سفارشی با موفقیت ویرایش شد");
  };

  const handleDeleteField = (id: string) => {
    if (window.confirm("آیا از حذف این فیلد مطمئن هستید؟ این عمل داده‌های موجود را حذف نمی‌کند.")) {
      const updatedFields = customFields.filter(field => field.id !== id);
      saveCustomFields(updatedFields);
      toast.success("فیلد سفارشی با موفقیت حذف شد");
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (!newField.options) return;
    const updatedOptions = [...newField.options];
    updatedOptions[index] = value;
    setNewField({ ...newField, options: updatedOptions });
  };

  const addOption = () => {
    setNewField({ ...newField, options: [...(newField.options || []), ""] });
  };

  const removeOption = (index: number) => {
    if (!newField.options) return;
    const updatedOptions = newField.options.filter((_, i) => i !== index);
    setNewField({ ...newField, options: updatedOptions });
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground">مدیریت فیلدهای سفارشی سراسری</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingField(null)}>
              <Plus size={18} className="ml-2" /> افزودن فیلد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass">
            <DialogHeader>
              <DialogTitle>{editingField ? "ویرایش فیلد سفارشی" : "افزودن فیلد سفارشی"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="field-name">نام فیلد</Label>
                <Input
                  id="field-name"
                  value={editingField ? editingField.name : newField.name || ""}
                  onChange={(e) => {
                    if (editingField) {
                      setEditingField({ ...editingField, name: e.target.value });
                    } else {
                      setNewField({ ...newField, name: e.target.value });
                    }
                  }}
                  placeholder="مثال: تاریخ تولد"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="field-type">نوع فیلد</Label>
                <Select
                  value={editingField ? editingField.type : newField.type}
                  onValueChange={(value) => {
                    if (editingField) {
                      setEditingField({ ...editingField, type: value as any });
                    } else {
                      setNewField({ ...newField, type: value as any });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">متن</SelectItem>
                    <SelectItem value="number">عدد</SelectItem>
                    <SelectItem value="date">تاریخ</SelectItem>
                    <SelectItem value="list">لیست</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(editingField?.type === 'list' || newField.type === 'list') && (
                <div className="flex flex-col gap-2">
                  <Label>گزینه‌های لیست</Label>
                  {(editingField?.options || newField.options || []).map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          if (editingField) {
                            const updatedOptions = [...(editingField.options || [])];
                            updatedOptions[index] = e.target.value;
                            setEditingField({ ...editingField, options: updatedOptions });
                          } else {
                            handleOptionChange(index, e.target.value);
                          }
                        }}
                        placeholder="گزینه"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (editingField) {
                            const updatedOptions = [...(editingField.options || [])];
                            updatedOptions.splice(index, 1);
                            setEditingField({ ...editingField, options: updatedOptions });
                          } else {
                            removeOption(index);
                          }
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={editingField ? () => setEditingField({...editingField, options: [...(editingField.options || []), ""]}) : addOption}>
                    <Plus size={16} className="ml-2" /> افزودن گزینه
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="field-description">توضیحات (اختیاری)</Label>
                <Textarea
                  id="field-description"
                  value={editingField ? editingField.description || "" : newField.description || ""}
                  onChange={(e) => {
                    if (editingField) {
                      setEditingField({ ...editingField, description: e.target.value });
                    } else {
                      setNewField({ ...newField, description: e.target.value });
                    }
                  }}
                  placeholder="توضیحات درباره این فیلد"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="field-required"
                  checked={editingField ? editingField.required : newField.required || false}
                  onChange={(e) => {
                    if (editingField) {
                      setEditingField({ ...editingField, required: e.target.checked });
                    } else {
                      setNewField({ ...newField, required: e.target.checked });
                    }
                  }}
                />
                <Label htmlFor="field-required">فیلد الزامی</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="button" onClick={editingField ? handleEditField : handleAddField}>
                {editingField ? <Save size={16} className="ml-2" /> : <Plus size={16} className="ml-2" />}
                {editingField ? "ذخیره تغییرات" : "افزودن فیلد"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {customFields.length === 0 ? (
        <div className="glass p-8 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">هنوز فیلد سفارشی سراسری تعریف نشده است.</p>
          <p className="text-sm text-muted-foreground">با افزودن فیلدهای سفارشی، می‌توانید قالب‌های استاندارد برای اطلاعات مخاطبین خود ایجاد کنید.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {customFields.map((field) => (
            <div key={field.id} className="glass p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{field.name}</h3>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                      {field.type === 'text' ? 'متن' : 
                       field.type === 'number' ? 'عدد' : 
                       field.type === 'date' ? 'تاریخ' : 'لیست'}
                    </span>
                    {field.required && (
                      <span className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs">
                        الزامی
                      </span>
                    )}
                  </div>
                  {field.description && (
                    <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
                  )}
                  {field.type === 'list' && field.options && field.options.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      گزینه‌ها: {field.options.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingField(field);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteField(field.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}