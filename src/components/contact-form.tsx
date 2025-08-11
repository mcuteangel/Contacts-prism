"use client";

import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { baseContactSchema, BaseContactInput } from '@/domain/schemas/contact';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { ErrorManager } from '@/lib/error-manager';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContactService } from '@/services/contact-service';
import { BasicInfoSection } from './contact-form/sections/basic-info-section';
import { PhoneNumbersSection } from './contact-form/sections/phone-numbers-section';
import { GroupsSection } from './contact-form/sections/groups-section';
import { AdditionalInfoSection } from './contact-form/sections/additional-info-section';
import { CustomFieldsSection } from './contact-form/sections/custom-fields-section';
import { useRouter } from 'next/navigation';

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

interface ContactFormProps {
  editingContact?: UIContact | null;
  groups: UIGroup[];
  onAddGroup: (groupName: string) => Promise<void>;
  onGroupsRefreshed: () => void;
}

export function ContactForm({
  editingContact,
  groups,
  onAddGroup,
  onGroupsRefreshed,
}: ContactFormProps) {
  const router = useRouter();
  const [showAdvancedFields, setShowAdvancedFields] = React.useState(false);
  const { isLoading, executeAsync } = useErrorHandler(null, {
    maxRetries: 3,
    retryDelay: 1000,
    showToast: true,
    customErrorMessage: "خطایی در ذخیره مخاطب رخ داد",
    onError: (error) => {
      ErrorManager.logError(error, {
        component: 'ContactForm',
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
      router.push('/'); // Redirect to home page after saving
    } catch (error) {
      console.error("خطا در ارسال فرم:", error);
      ErrorManager.logError(error as Error, {
        component: "ContactForm",
        action: editingContact ? "update" : "create"
      });
      toast.error("خطایی در ارسال فرم رخ داد. لطفاً دوباره تلاش کنید.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3">
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Always Visible Sections */}
            <div className="space-y-3">
              <BasicInfoSection />
              <PhoneNumbersSection />
              
              {/* Gender and Position Section */}
              <div className="space-y-3 pt-2">
                <h3 className="text-lg font-medium">اطلاعات تکمیلی</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium" htmlFor="gender">
                      جنسیت
                    </Label>
                    <Select
                      value={methods.watch('gender') || ''}
                      onValueChange={(value) => methods.setValue('gender', value as 'male' | 'female' | 'other' || undefined)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="انتخاب نشده" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">آقا</SelectItem>
                        <SelectItem value="female">خانم</SelectItem>
                        <SelectItem value="other">سایر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium" htmlFor="position">
                      سمت/تخصص
                    </Label>
                    <Input
                      id="position"
                      {...methods.register('position')}
                      placeholder="مثال: مدیر فنی"
                    />
                  </div>
                </div>
              </div>
              
              {/* Groups Section */}
              <GroupsSection 
                groups={groups} 
                onAddGroup={onAddGroup} 
                onGroupsRefreshed={onGroupsRefreshed} 
              />
              
              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">آدرس</Label>
                <Textarea
                  id="address"
                  {...methods.register('address')}
                  placeholder="آدرس کامل"
                  rows={2}
                  className={methods.formState.errors.address ? 'border-red-500' : ''}
                />
                {methods.formState.errors.address && (
                  <p className="text-sm text-red-500">
                    {String(methods.formState.errors.address.message || '')}
                  </p>
                )}
              </div>
            </div>

            {/* Advanced Fields Toggle */}
            <div className="pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full flex items-center justify-between text-sm text-muted-foreground"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              >
                <span>سایر اطلاعات</span>
                {showAdvancedFields ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Advanced Fields Section (Conditional) */}
            {showAdvancedFields && (
              <div className="space-y-4 pt-3 border-t border-border">
                <AdditionalInfoSection />
                <CustomFieldsSection templates={templates} />
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex flex-row-reverse gap-2">
          <Button 
            type="submit" 
            className="flex-1 sm:flex-initial" 
            disabled={isLoading}
          >
            {isLoading ? (
              'در حال ذخیره...'
            ) : editingContact ? (
              <>
                <Save className="ml-2 h-4 w-4" />
                ذخیره تغییرات
              </>
            ) : (
              <>
                <UserPlus className="ml-2 h-4 w-4" />
                افزودن مخاطب
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 sm:flex-initial" 
            onClick={() => router.back()}
          >
            انصراف
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}