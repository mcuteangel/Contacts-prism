"use client";

import React, { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// استفاده واحد از اسکیمای دامِین
import { baseContactSchema, type BaseContactInput } from "@/domain/schemas/contact";
import { toast } from "sonner";
import { useErrorHandler, useValidationErrorHandler } from "@/hooks/use-error-handler";
import { ErrorManager } from "@/lib/error-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { ContactService } from "@/services/contact-service";
// UI-level lightweight types به جای وارد کردن از دیتابیس
type UIPhone = { type: "mobile" | "home" | "work" | "other"; number: string };
type UICustomField = { name: string; value: string; type?: 'text' | 'number' | 'date' | 'list' };
type UIContact = {
  id?: number | string;
  firstName: string;
  lastName: string;
  phoneNumbers: UIPhone[];
  searchablePhoneNumbers?: string[];
  gender?: "male" | "female" | "other";
  notes?: string;
  position?: string;
  address?: string;
  groupId?: number | string;
  customFields?: UICustomField[];
  avatar?: string | null;
};
type UIGroup = { id?: number | string; name: string };

import { AddGroupDialog } from "./add-group-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";


interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingContact: UIContact | null;
  onContactSaved: () => void;
  groups: UIGroup[];
  onAddGroup: (groupName: string) => Promise<void>;
  onGroupsRefreshed: () => void; // Callback to refresh groups in parent
}

export function ContactFormDialog({
  isOpen,
  onOpenChange,
  editingContact,
  onContactSaved,
  groups,
  onAddGroup,
  onGroupsRefreshed,
}: ContactFormDialogProps) {
  // استفاده از Error Handler پیشرفته
  const {
    isLoading,
    error,
    errorMessage,
    retryCount,
    retry,
    executeAsync
  } = useErrorHandler(null, {
    maxRetries: 3,
    retryDelay: 1000,
    showToast: true,
    customErrorMessage: "خطایی در ذخیره مخاطب رخ داد",
    onError: (error) => {
      // لاگ کردن خطا با جزئیات بیشتر
      ErrorManager.logError(error, {
        component: 'ContactFormDialog',
        action: 'saveContact',
        metadata: { contactId: editingContact?.id }
      });
    }
  });

  // توجه: baseContactSchema ممکن است customFields را به صورت required تعریف کرده باشد.
  // بنابرین defaultValues باید دقیقا با اسکیمای دامِین هم‌خوان باشد.
  const form = useForm<BaseContactInput>({
    resolver: zodResolver(baseContactSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumbers: [{ type: "mobile", number: "" }],
      gender: undefined,
      notes: "",
      position: "",
      address: "",
      groupId: undefined,
      customFields: [], // ensure defined array to satisfy resolver options typing
      avatar: undefined,
    },
  });

  const [phoneInputs, setPhoneInputs] = useState<{ id: number; type: "mobile" | "home" | "work" | "other"; number: string }[]>([]);
  const [customFieldInputs, setCustomFieldInputs] = useState<{ id: number; name: string; value: string; type: 'text' | 'number' | 'date' | 'list' }[]>([]);
  // Templateهای سراسری برای فیلدهای سفارشی
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; type: 'text' | 'number' | 'date' | 'list'; options?: string[]; required: boolean }>>([]);

  useEffect(() => {
    if (editingContact) {
      form.reset({
        firstName: editingContact.firstName,
        lastName: editingContact.lastName,
        gender: editingContact.gender,
        notes: editingContact.notes,
        position: editingContact.position,
        address: editingContact.address,
        groupId: (editingContact.groupId as any) as number | undefined,
        customFields: (editingContact.customFields ?? []).map((cf: UICustomField) => ({ name: cf.name, value: cf.value })),
        phoneNumbers: (editingContact.phoneNumbers ?? []).map((pn: UIPhone) => ({ type: pn.type as "mobile"|"home"|"work"|"other", number: pn.number })),
        avatar: (editingContact.avatar as any),
      });
      // همگام‌سازی state داخلی ورودی‌ها با داده‌های ویرایشی
      setPhoneInputs((editingContact.phoneNumbers ?? []).map((pn: UIPhone, index: number) => ({ id: index, type: pn.type as "mobile"|"home"|"work"|"other", number: pn.number })));
      setCustomFieldInputs((editingContact.customFields ?? []).map((cf: UICustomField, index: number) => ({ id: index, name: cf.name, value: cf.value, type: (cf as any).type ?? "text" })));
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        phoneNumbers: [{ type: "mobile", number: "" }],
        gender: undefined,
        notes: "",
        position: "",
        address: "",
        groupId: undefined,
        customFields: [],
        avatar: undefined,
      });
      setPhoneInputs([{ id: 0, type: "mobile", number: "" }]);
      setCustomFieldInputs([]);
    }
  }, [editingContact, form]);

 // بارگیری Templateها در mount
 useEffect(() => {
   (async () => {
     // اگر سرویسی برای Templateها در دسترس نیست، فعلاً از مقدار خالی استفاده می‌کنیم تا UI کار کند
     if (!("getAllCustomFieldTemplates" in ContactService)) {
       setTemplates([]);
       return;
     }
     // @ts-ignore - نوع در سرویس ممکن است به‌صورت اختیاری تعریف شده باشد
     const res = await (ContactService as any).getAllCustomFieldTemplates();
     if (res?.ok) {
       setTemplates(res.data.map((t: any) => ({
         id: t.id!,
         name: t.name,
         type: t.type as 'text' | 'number' | 'date' | 'list',
         options: t.options,
         required: t.required
       })));
     } else {
       console.error("getAllCustomFieldTemplates error:", res?.error);
     }
   })();
 }, []);

  const addPhoneNumberField = () => {
    setPhoneInputs(prev => [...prev, { id: prev.length > 0 ? Math.max(...prev.map(p => p.id || 0)) + 1 : 0, type: "mobile", number: "" }]);
  };

  const removePhoneNumberField = (idToRemove: number) => {
    setPhoneInputs(prev => prev.filter(p => p.id !== idToRemove));
  };

  const updatePhoneNumberField = (id: number, field: 'type' | 'number', value: string) => {
    setPhoneInputs(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addCustomField = () => {
    setCustomFieldInputs(prev => [...prev, { id: prev.length > 0 ? Math.max(...prev.map(cf => cf.id || 0)) + 1 : 0, name: "", value: "", type: "text" }]);
  };

  // افزودن از روی Template سراسری
  const addCustomFieldFromTemplate = (templateId: number) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    setCustomFieldInputs(prev => {
      const nextId = prev.length > 0 ? Math.max(...prev.map(cf => cf.id || 0)) + 1 : 0;
      // اگر لیست است و options دارد، مقدار اولیه را خالی می‌گذاریم تا کاربر انتخاب کند
      return [...prev, { id: nextId, name: tpl.name, value: "", type: tpl.type }];
    });
  };

  const removeCustomField = (idToRemove: number) => {
    setCustomFieldInputs(prev => prev.filter(cf => cf.id !== idToRemove));
  };

  const updateCustomField = (id: number, field: 'name' | 'value' | 'type', value: string) => {
    setCustomFieldInputs(prev => prev.map(cf => cf.id === id ? { ...cf, [field]: value } : cf));
  };

  const onSubmit = async (values: BaseContactInput) => {
    const phoneNumbers = phoneInputs.map(({ id, ...rest }) => rest);

    // ولیدیشن پیش از ارسال: الزامی‌ها و همچنین نوع 'list' مطابق options
    const invalid = customFieldInputs.some(cf => {
      const tpl = templates.find(t => t.name === cf.name && t.type === cf.type);
      if (!tpl) return false;
      if (tpl.required && !cf.value.trim()) {
        ErrorManager.notifyUser("این فیلد الزامی است", "error");
        return true;
      }
      if (tpl.type === 'list' && tpl.options && tpl.options.length > 0) {
        if (!tpl.options.includes(cf.value)) {
          ErrorManager.notifyUser("مقدار انتخاب شده معتبر نیست", "error");
          return true;
        }
      }
      return false;
    });
    if (invalid) {
      return;
    }

    const customFields = customFieldInputs.map(({ id, ...rest }) => rest);
    // اطمینان از رشته بودن برای تطابق با نوع UIContact
    const contactData: Omit<UIContact, 'id' | 'searchablePhoneNumbers'> = {
      firstName: (values.firstName ?? "").toString(),
      lastName: (values.lastName ?? "").toString(),
      phoneNumbers,
      gender: values.gender,
      notes: values.notes,
      position: values.position,
      address: values.address,
      groupId: values.groupId,
      customFields,
    };

    try {
      let res;
      if (editingContact?.id != null) {
        // امضای سرویس: updateContact(id: string, partial)
        res = await executeAsync(async () => {
          const result = await (ContactService as any).updateContact(String(editingContact.id), contactData);
          if (!result?.ok) {
            throw new Error(result?.error || "به‌روزرسانی مخاطب با شکست مواجه شد");
          }
          return result;
        }, {
          component: "ContactFormDialog",
          action: "update",
          // maxRetries: 3, // Handled by useErrorHandler
          // retryDelay: 1000, // Handled by useErrorHandler
          // onRetry: (retryCount: number) => {
          //   toast.warning(`خطا در به‌روزرسانی مخاطب. تلاش مجدد (${retryCount + 1}/3)...`);
          //   return true;
          // }
        });
        
        toast.success("مخاطب با موفقیت به‌روزرسانی شد!");
      } else {
        // امضای سرویس: createContact(dto)
        res = await executeAsync(async () => {
          const result = await (ContactService as any).createContact(contactData);
          if (!result?.ok) {
            throw new Error(result?.error || "افزودن مخاطب با شکست مواجه شد");
          }
          return result;
        }, {
          component: "ContactFormDialog",
          action: "create",
          // maxRetries: 3, // Handled by useErrorHandler
          // retryDelay: 1000, // Handled by useErrorHandler
          // onRetry: (retryCount: number) => {
          //   toast.warning(`خطا در ایجاد مخاطب. تلاش مجدد (${retryCount + 1}/3)...`);
          //   return true;
          // }
        });
        
        toast.success("مخاطب با موفقیت اضافه شد!");
      }
      
      onContactSaved();
      onOpenChange(false);
      return res;
    } catch (error) {
      // خطاهایی که خارج از executeAsync رخ می‌دهند (مثل خطاهای اعتبارسنجی)
      console.error("خطا در ارسال فرم:", error);
      ErrorManager.logError(error as Error, {
        component: "ContactFormDialog",
        action: editingContact ? "update" : "create"
      });
      toast.error("خطایی در ارسال فرم رخ داد. لطفاً دوباره تلاش کنید.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingContact ? "ویرایش مخاطب" : "افزودن مخاطب جدید"}</DialogTitle>
          <DialogDescription>
            {editingContact ? "تغییرات مخاطب را اینجا اعمال کنید." : "مخاطب جدیدی به لیست خود اضافه کنید."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName" className="text-right">
              نام
            </Label>
            <Input id="firstName" {...form.register("firstName")} />
            {form.formState.errors.firstName && <p className="text-right text-red-500 text-sm">{form.formState.errors.firstName.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName" className="text-right">
              نام خانوادگی
            </Label>
            <Input id="lastName" {...form.register("lastName")} />
          </div>

          {/* Dynamic Phone Numbers */}
          <div className="col-span-full flex flex-col gap-2">
            <Label className="text-right">شماره(ها)</Label>
            {phoneInputs.map((phoneInput) => (
              <div key={phoneInput.id} className="flex items-center gap-2">
                <Select
                  value={phoneInput.type}
                  onValueChange={(value) => updatePhoneNumberField(phoneInput.id!, 'type', value as "mobile" | "home" | "work" | "other")}
                >
                  <SelectTrigger className="w-[120px] flex-shrink-0">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">موبایل</SelectItem>
                    <SelectItem value="home">خانه</SelectItem>
                    <SelectItem value="work">کار</SelectItem>
                    <SelectItem value="other">سایر</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="شماره تلفن"
                  value={phoneInput.number}
                  onChange={(e) => updatePhoneNumberField(phoneInput.id!, 'number', e.target.value)}
                  className="flex-grow"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePhoneNumberField(phoneInput.id!)}
                  className="flex-shrink-0"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPhoneNumberField} className="flex items-center gap-2">
              <Plus size={16} /> افزودن شماره تلفن
            </Button>
            {form.formState.errors.phoneNumbers && <p className="text-right text-red-500 text-sm">{form.formState.errors.phoneNumbers.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="gender" className="text-right">
              جنسیت
            </Label>
            <Select onValueChange={(value) => form.setValue("gender", value as "male" | "female" | "other")} value={form.watch("gender")}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب جنسیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">مرد</SelectItem>
                <SelectItem value="female">زن</SelectItem>
                <SelectItem value="other">سایر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="position" className="text-right">
              سمت/تخصص
            </Label>
            <Input id="position" {...form.register("position")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address" className="text-right">
              آدرس
            </Label>
            <Textarea id="address" {...form.register("address")} />
          </div>

          <div className="col-span-full flex flex-col gap-2">
            <Label htmlFor="groupId" className="text-right">
              گروه
            </Label>
            <div className="flex gap-2">
              <Select onValueChange={(value) => form.setValue("groupId", value ? parseInt(value) : undefined)} value={form.watch("groupId")?.toString()}>
                <SelectTrigger className="flex-grow">
                  <SelectValue placeholder="انتخاب گروه" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id!.toString()}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AddGroupDialog onAddGroup={onAddGroup} onGroupAdded={onGroupsRefreshed} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="text-right">
              یادداشت‌ها
            </Label>
            <Textarea id="notes" {...form.register("notes")} />
          </div>

          {/* Dynamic Custom Fields */}
          <div className="col-span-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-right">فیلدهای سفارشی</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={addCustomField} className="flex items-center gap-2">
                  <Plus size={16} /> افزودن فیلد دستی
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="secondary" className="flex items-center gap-2">
                      <Plus size={16} /> افزودن از قالب
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">قالب‌های سراسری</div>
                      {templates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">هیچ قالبی تعریف نشده است.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {templates.map(tpl => (
                            <Button
                              key={tpl.id}
                              variant="outline"
                              className="justify-between"
                              type="button"
                              onClick={() => addCustomFieldFromTemplate(tpl.id)}
                            >
                              <span>{tpl.name}</span>
                              <Badge variant="secondary">
                                {tpl.type === 'text' ? 'متن' : tpl.type === 'number' ? 'عدد' : tpl.type === 'date' ? 'تاریخ' : 'لیست'}
                              </Badge>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // به‌روزرسانی از قالب‌ها: هم‌ترازی نوع/گزینه‌ها با Templateهای فعلی
                    setCustomFieldInputs(prev => {
                      return prev.map(cf => {
                        const tpl = templates.find(t => t.name === cf.name);
                        if (!tpl) return cf;
                        // همسان‌سازی نوع
                        let next = { ...cf, type: tpl.type };
                        // اگر نوع لیست است و مقدار فعلی خارج از گزینه‌ها باشد، مقدار را خالی کن تا کاربر انتخاب کند
                        if (tpl.type === 'list' && tpl.options && tpl.options.length > 0) {
                          if (!tpl.options.includes(next.value)) {
                            next.value = "";
                          }
                        }
                        return next;
                      });
                    });
                    toast.success("فیلدهای سفارشی با قالب‌های سراسری همگام شد");
                  }}
                >
                  به‌روزرسانی از قالب‌ها
                </Button>
              </div>
            </div>

            {customFieldInputs.map((cfInput) => (
              <div key={cfInput.id} className="flex items-center gap-2">
                <Input
                  placeholder="نام فیلد"
                  value={cfInput.name}
                  onChange={(e) => updateCustomField(cfInput.id!, 'name', e.target.value)}
                  className="w-[140px] flex-shrink-0"
                />
                <Select
                  value={cfInput.type}
                  onValueChange={(value) => updateCustomField(cfInput.id!, 'type', value as 'text' | 'number' | 'date' | 'list')}
                >
                  <SelectTrigger className="w-[110px] flex-shrink-0">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">متن</SelectItem>
                    <SelectItem value="number">عدد</SelectItem>
                    <SelectItem value="date">تاریخ</SelectItem>
                    <SelectItem value="list">لیست</SelectItem>
                  </SelectContent>
                </Select>

                {/* مقدار فیلد: اگر نوع list باشد و Template متناظر options داشته باشد، Select نمایش بده */}
                {cfInput.type === 'list' ? (
                  (() => {
                    const tpl = templates.find(t => t.name === cfInput.name && t.type === 'list');
                    const options = tpl?.options || [];
                    if (options.length > 0) {
                      return (
                        <Select
                          value={cfInput.value}
                          onValueChange={(value) => updateCustomField(cfInput.id!, 'value', value)}
                        >
                          <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="انتخاب مقدار" />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((opt, idx) => (
                              <SelectItem key={idx} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }
                    // اگر options وجود ندارد، به ورودی متن برگرد
                    return (
                      <Input
                        placeholder="مقدار فیلد"
                        value={cfInput.value}
                        onChange={(e) => updateCustomField(cfInput.id!, 'value', e.target.value)}
                        className="flex-grow"
                      />
                    );
                  })()
                ) : (
                  <Input
                    placeholder="مقدار فیلد"
                    value={cfInput.value}
                    onChange={(e) => updateCustomField(cfInput.id!, 'value', e.target.value)}
                    className="flex-grow"
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomField(cfInput.id!)}
                  className="flex-shrink-0"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter className="col-span-full flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "در حال ذخیره..." : editingContact ? "ذخیره تغییرات" : "افزودن مخاطب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
