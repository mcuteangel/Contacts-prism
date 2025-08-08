"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";
import { ContactService } from "@/services/contact-service";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorManager } from "@/lib/error-manager";
import {
  customFieldTemplateSchema,
  updateCustomFieldTemplateSchema,
  type CreateCustomFieldTemplateInput,
} from "@/domain/schemas/custom-field-template";

type TemplateType = 'text' | 'number' | 'date' | 'list';

interface TemplateViewModel {
  id?: number;
  name: string;
  type: TemplateType;
  options?: string[];
  description?: string;
  required: boolean;
}

export function GlobalCustomFieldsManagement() {
  const [customFields, setCustomFields] = useState<TemplateViewModel[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateViewModel | null>(null);
  
  // Initialize advanced error handler with retry support
  const {
    isLoading: loading,
    error,
    errorMessage,
    retryCount, // Keep retryCount
    retry: retryLastOperation, // Rename retryLastOperation to retry
    executeAsync,
    setError
  } = useErrorHandler(null, {
    maxRetries: 3,
    retryDelay: 1000,
    showToast: true,
    customErrorMessage: "خطایی در مدیریت فیلدهای سفارشی رخ داد",
    onError: (error) => {
      ErrorManager.logError(error, {
        component: 'GlobalCustomFieldsManagement',
        action: 'customFieldsOperation',
        metadata: { 
          operation: error.message.includes('دریافت') ? 'fetch' : 
                   error.message.includes('افزودن') ? 'add' : 
                   error.message.includes('ویرایش') ? 'edit' :
                   error.message.includes('حذف') ? 'delete' : 'unknown'
        }
      });
    }
  });

  // RHF forms: یکی برای create و یکی برای edit
  // نکته: به‌دلیل تفاوت‌های کوچک بین نوع خروجی zodResolver و نوع generic RHF،
  // یک cast محدود به عنوان any برای Resolver به‌کار می‌بریم تا ناسازگاری optional/default حل شود.
  const createForm = useForm<CreateCustomFieldTemplateInput>({
    resolver: zodResolver(customFieldTemplateSchema) as any,
    defaultValues: {
      name: "",
      type: "text",
      options: [],
      description: "",
      required: false,
    },
    mode: "onChange",
  });

  const editForm = useForm<Partial<CreateCustomFieldTemplateInput>>({
    resolver: zodResolver(updateCustomFieldTemplateSchema) as any,
    defaultValues: {},
    mode: "onChange",
  });

  const loadTemplates = async () => {
    await executeAsync(async () => {
      const res = await (ContactService as any).getAllCustomFieldTemplates();
      if (!res.ok) {
        throw new Error(res.error || "خطا در دریافت لیست قالب‌های فیلدهای سفارشی");
      }
      setCustomFields(res.data.map((t: any) => ({
        id: t.id!,
        name: t.name,
        type: t.type as TemplateType,
        options: t.options || [],
        description: t.description || "",
        required: t.required
      })));
    }, {
      component: "GlobalCustomFieldsManagement",
      action: "loadTemplates"
    });
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // وقتی دیالوگ باز می‌شود، بسته به ویرایش/ایجاد فرم مناسب را مقداردهی کن
  useEffect(() => {
    if (isDialogOpen) {
      if (editingField) {
        editForm.reset({
          name: editingField.name,
          type: editingField.type,
          options: editingField.type === 'list' ? (editingField.options || []) : undefined,
          description: editingField.description,
          required: editingField.required,
        });
      } else {
        createForm.reset({
          name: "",
          type: "text",
          options: [],
          description: "",
          required: false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen, editingField]);

  const handleAddField = async (data: CreateCustomFieldTemplateInput) => {
    await executeAsync(async () => {
      const res = await (ContactService as any).addCustomFieldTemplate({
        name: data.name.trim(),
        type: data.type,
        options: data.type === 'list' ? (data.options || []).filter(Boolean) : undefined,
        description: data.description?.trim() || "",
        required: !!data.required,
      });
      if (!res.ok) {
        throw new Error(res.error || "خطا در افزودن قالب فیلد سفارشی");
      }
      
      // نمایش پیام موفقیت
      ErrorManager.notifyUser("قالب با موفقیت اضافه شد", "success");
      setIsDialogOpen(false);
      await loadTemplates();
    }, {
      component: "GlobalCustomFieldsManagement",
      action: "addCustomField"
    });
  };

  const handleEditField = async (data: Partial<CreateCustomFieldTemplateInput>) => {
    if (!editingField?.id) return;
    
    await executeAsync(async () => {
      // اگر type به list است ولی options خالی است، اعتبارسنجی Zod مانع شده؛ اینجا فقط ارسال می‌کنیم
      const res = await (ContactService as any).updateCustomFieldTemplate(editingField.id, {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.type === 'list' ? { options: (data.options || []).filter(Boolean) } : { options: undefined }),
        ...(data.description !== undefined ? { description: data.description?.trim() || "" } : {}),
        ...(data.required !== undefined ? { required: !!data.required } : {}),
      });
      
      if (!res.ok) {
        throw new Error(res.error || "خطا در به‌روزرسانی قالب فیلد سفارشی");
      }
      
      // نمایش پیام موفقیت
      ErrorManager.notifyUser("قالب با موفقیت به‌روزرسانی شد", "success");
      setEditingField(null);
      setIsDialogOpen(false);
      await loadTemplates();
    }, {
      component: "GlobalCustomFieldsManagement",
      action: "updateCustomField"
    });
  };

  const handleDeleteField = async (id?: number) => {
    if (id == null) return;
    
    if (window.confirm("آیا از حذف این فیلد مطمئن هستید؟ این عمل داده‌های موجود را حذف نمی‌کند.")) {
      await executeAsync(async () => {
        const res = await (ContactService as any).deleteCustomFieldTemplate(id);
        if (!res.ok) {
          throw new Error(res.error || "خطا در حذف قالب فیلد سفارشی");
        }
        
        // نمایش پیام موفقیت
        ErrorManager.notifyUser("قالب با موفقیت حذف شد", "success");
        await loadTemplates();
      }, {
        component: "GlobalCustomFieldsManagement",
        action: "deleteCustomField"
      });
    }
  };

  const handleCreateField = async (data: CreateCustomFieldTemplateInput) => {
    await executeAsync(async () => {
      const res = await (ContactService as any).createCustomFieldTemplate(data);
      if (!res.ok) {
        throw new Error(res.error || "خطا در ایجاد فیلد سفارشی");
      }
      
      await loadTemplates();
      createForm.reset();
      setIsDialogOpen(false);
      
      // نمایش پیام موفقیت
      ErrorManager.notifyUser("فیلد سفارشی با موفقیت ایجاد شد!", "success");
      
      // گزارش موفقیت‌آمیز بودن عملیات
      ErrorManager.logError(new Error(`Custom field created: ${data.name} (${data.type})`), {
        component: 'GlobalCustomFieldsManagement',
        action: 'createField',
        metadata: { 
          fieldName: data.name,
          fieldType: data.type,
          hasOptions: data.type === 'list' && data.options && data.options.length > 0
        }
      });
    }, {
      component: "GlobalCustomFieldsManagement",
      action: "createField",
      metadata: {
        fieldName: data.name,
        fieldType: data.type
      }
    });
  };

  // کمک‌متدها برای options در UI
  const addOption = (isEdit: boolean) => {
    if (isEdit) {
      const current = editForm.getValues("options") || [];
      editForm.setValue("options", [...current, ""], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } else {
      const current = createForm.getValues("options") || [];
      createForm.setValue("options", [...current, ""], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const removeOption = (isEdit: boolean, index: number) => {
    if (isEdit) {
      const current = (editForm.getValues("options") || []).filter((_, i) => i !== index);
      editForm.setValue("options", current, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } else {
      const current = (createForm.getValues("options") || []).filter((_, i) => i !== index);
      createForm.setValue("options", current, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const setOptionAt = (isEdit: boolean, index: number, value: string) => {
    if (isEdit) {
      const current = [...(editForm.getValues("options") || [])];
      current[index] = value;
      editForm.setValue("options", current, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } else {
      const current = [...(createForm.getValues("options") || [])];
      current[index] = value;
      createForm.setValue("options", current, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  // رندر فرم مشترک (Create/Edit) بر اساس حالت
  const renderFormFields = (isEdit: boolean) => {
    const f = isEdit ? editForm : createForm;
    const values = f.getValues();

    return (
      <div className="grid gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="field-name">نام فیلد</Label>
          <Input
            id="field-name"
            {...f.register("name")}
            placeholder="مثال: تاریخ تولد"
          />
          {f.formState.errors.name && (
            <p className="text-xs text-red-500">{f.formState.errors.name.message as any}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="field-type">نوع فیلد</Label>
          <Select
            value={values.type || "text"}
            onValueChange={(value) => {
              // اگر از list به نوع دیگر رفتیم، options را undefined کن
              if (isEdit) {
                editForm.setValue("type", value as any, { shouldValidate: true });
                if (value !== "list") {
                  editForm.setValue("options", undefined, { shouldValidate: true });
                } else {
                  editForm.setValue("options", editForm.getValues("options") || [""], { shouldValidate: true });
                }
              } else {
                createForm.setValue("type", value as any, { shouldValidate: true });
                if (value !== "list") {
                  createForm.setValue("options", undefined, { shouldValidate: true });
                } else {
                  createForm.setValue("options", createForm.getValues("options") || [""], { shouldValidate: true });
                }
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
          {f.formState.errors.type && (
            <p className="text-xs text-red-500">{f.formState.errors.type.message as any}</p>
          )}
        </div>

        {(values.type === 'list') && (
          <div className="flex flex-col gap-2">
            <Label>گزینه‌های لیست</Label>
            {(values.options || []).map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => setOptionAt(isEdit, index, e.target.value)}
                  placeholder="گزینه"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(isEdit, index)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => addOption(isEdit)}>
              <Plus size={16} className="ml-2" /> افزودن گزینه
            </Button>
            {f.formState.errors.options && (
              <p className="text-xs text-red-500">{(f.formState.errors.options as any)?.message}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="field-description">توضیحات (اختیاری)</Label>
          <Textarea
            id="field-description"
            {...f.register("description")}
            placeholder="توضیحات درباره این فیلد"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="field-required"
            checked={!!values.required}
            onChange={(e) => f.setValue("required", e.target.checked, { shouldDirty: true })}
          />
          <Label htmlFor="field-required">فیلد الزامی</Label>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground">فیلدهای سفارشی</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingField(null); setIsDialogOpen(true); }}>
              <Plus size={18} className="ml-2" /> افزودن فیلد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {editingField ? 'ویرایش فیلد سفارشی' : 'افزودن فیلد سفارشی جدید'}
                </DialogTitle>
                {error && (
                  <div className="text-sm text-destructive flex items-center gap-2">
                    <span>{errorMessage}</span>
                    {retryCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={retryLastOperation}
                        disabled={loading}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        تلاش مجدد ({retryCount} از ۳)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </DialogHeader>

            {editingField ? renderFormFields(true) : renderFormFields(false)}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                انصراف
              </Button>
              {editingField ? (
                <Button type="button" onClick={editForm.handleSubmit(handleEditField)}>
                  <Save size={16} className="ml-2" />
                  ذخیره تغییرات
                </Button>
              ) : (
                <Button type="button" onClick={createForm.handleSubmit(handleAddField as any)}>
                  <Plus size={16} className="ml-2" />
                  افزودن فیلد
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {customFields.length === 0 ? (
        <div className="glass p-8 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">هنوز فیلد سفارشی تعریف نشده است.</p>
          <p className="text-sm text-muted-foreground">با افزودن فیلدهای سفارشی، می‌توانید قالب‌های استاندارد برای اطلاعات مخاطبین خود ایجاد کنید.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {customFields.map((field, index) => (
            <div key={field.id || index} className="glass p-4 rounded-lg">
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