import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { baseContactSchema, BaseContactInput } from '@/domain/schemas/contact';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { ErrorManager } from '@/lib/error-manager';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Save } from 'lucide-react';
import { ContactService } from '@/services/contact-service';
import { BasicInfoSection } from './contact-form/sections/basic-info-section';
import { PhoneNumbersSection } from './contact-form/sections/phone-numbers-section';
import { ProfessionalInfoSection } from './contact-form/sections/professional-info-section';
import { GroupsSection } from './contact-form/sections/groups-section';
import { AdditionalInfoSection } from './contact-form/sections/additional-info-section';
import { CustomFieldsSection } from './contact-form/sections/custom-fields-section';

type UIContact = {
  id?: number | string;
  firstName: string;
  lastName: string;
  phoneNumbers: { type: "mobile" | "home" | "work" | "other"; number: string }[];
  gender?: "male" | "female" | "other";
  notes?: string;
  position?: string;
  address?: string;
  groupId?: number | string;
  customFields?: { name: string; value: string; type?: 'text' | 'number' | 'date' | 'list' }[];
  avatar?: string | null;
};

type UIGroup = { id?: number | string; name: string };

type Template = {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'list';
  options?: string[];
  required: boolean;
};

interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingContact: UIContact | null;
  onContactSaved: () => void;
  groups: UIGroup[];
  onAddGroup: (groupName: string) => Promise<void>;
  onGroupsRefreshed: () => void;
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
  const { isLoading, executeAsync } = useErrorHandler(null, {
    maxRetries: 3,
    retryDelay: 1000,
    showToast: true,
    customErrorMessage: "خطایی در ذخیره مخاطب رخ داد",
    onError: (error) => {
      ErrorManager.logError(error, {
        component: 'ContactFormDialog',
        action: 'saveContact',
        metadata: { contactId: editingContact?.id },
      });
    },
  });

  const methods = useForm<BaseContactInput>({
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
      customFields: [],
      avatar: undefined,
    },
  });

  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (editingContact) {
      methods.reset({
        firstName: editingContact.firstName,
        lastName: editingContact.lastName,
        gender: editingContact.gender,
        notes: editingContact.notes,
        position: editingContact.position,
        address: editingContact.address,
        groupId: (editingContact.groupId as any) as number | undefined,
        customFields: (editingContact.customFields ?? []).map((cf) => ({ name: cf.name, value: cf.value, type: cf.type || 'text' })),
        phoneNumbers: (editingContact.phoneNumbers ?? []).map((pn) => ({ type: pn.type, number: pn.number })),
        avatar: (editingContact.avatar as any),
      });
    } else {
      methods.reset({
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
    }
  }, [editingContact, methods]);

  useEffect(() => {
    (async () => {
      if (!("getAllCustomFieldTemplates" in ContactService)) {
        setTemplates([]);
        return;
      }
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

  const onSubmit = async (values: BaseContactInput) => {
    const invalid = (values.customFields || []).some(cf => {
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

    try {
      if (editingContact?.id != null) {
        await executeAsync(async () => {
          const result = await (ContactService as any).updateContact(String(editingContact.id), values);
          if (!result?.ok) {
            throw new Error(result?.error || "به‌روزرسانی مخاطب با شکست مواجه شد");
          }
          return result;
        });
        toast.success("مخاطب با موفقیت به‌روزرسانی شد!");
      } else {
        await executeAsync(async () => {
          const result = await (ContactService as any).createContact(values);
          if (!result?.ok) {
            throw new Error(result?.error || "افزودن مخاطب با شکست مواجه شد");
          }
          return result;
        });
        toast.success("مخاطب با موفقیت اضافه شد!");
      }
      onContactSaved();
      onOpenChange(false);
    } catch (error) {
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
