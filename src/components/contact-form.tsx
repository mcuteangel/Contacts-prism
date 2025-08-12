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

import { useTranslation } from 'react-i18next';
import { PhoneNumbersSection } from './contact-form/sections/phone-numbers-section';
import { GroupsSection } from './contact-form/sections/groups-section';
import { AdditionalInfoSection } from './contact-form/sections/additional-info-section';
import { CustomFieldsSection } from './contact-form/sections/custom-fields-section';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';

type UIContact = {
  id?: number | string;
  firstName: string;
  lastName: string;
  phoneNumbers: { type: "mobile" | "home" | "work" | "other"; number: string }[];
  gender?: "male" | "female" | "other" | "not_specified";
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
  const { user } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();
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
    console.log("Form submitted with values:", values);
    
    try {
      // Validate custom fields
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
        console.log("Custom field validation failed");
        return;
      }

      // Validate required fields
      if (!values.firstName?.trim()) {
        toast.error("نام مخاطب الزامی است");
        return;
      }

      if (!values.phoneNumbers || values.phoneNumbers.length === 0 || !values.phoneNumbers[0]?.number?.trim()) {
        toast.error("حداقل یک شماره تماس الزامی است");
        return;
      }

      if (!user) {
        toast.error("برای ذخیره مخاطب، لطفا ابتدا وارد شوید.");
        console.error("Submit failed: User is not authenticated.");
        return;
      }

      // Prepare contact data for service
      const contactData = {
        firstName: values.firstName.trim(),
        lastName: values.lastName?.trim() || "",
        phoneNumbers: values.phoneNumbers.filter(pn => pn.number?.trim()),
        gender: values.gender,
        notes: values.notes?.trim() || "",
        position: values.position?.trim() || "",
        address: values.address?.trim() || "",
        groupId: values.groupId,
        customFields: values.customFields || [],
        userId: user.id,
      };

      console.log("Prepared contact data:", contactData);

      // Execute the appropriate service call based on whether we're editing or creating
      const result = await executeAsync(async () => {
        if (editingContact?.id != null) {
          console.log("Updating existing contact:", editingContact.id);
          const updateResult = await ContactService.updateContact(String(editingContact.id), contactData);
          console.log("Update result:", updateResult);
          if (!updateResult?.ok) {
            throw new Error(updateResult?.error || "به‌روزرسانی مخاطب با شکست مواجه شد");
          }
          return updateResult;
        } else {
          console.log("Creating new contact");
          const createResult = await ContactService.createContact(contactData);
          console.log("Create result:", createResult);
          if (!createResult?.ok) {
            throw new Error(createResult?.error || "افزودن مخاطب با شکست مواجه شد");
          }
          return createResult;
        }
      });

      // If we get here, the operation was successful
      if (result?.ok) {
        toast.success(
          editingContact?.id 
            ? "مخاطب با موفقیت به‌روزرسانی شد!"
            : "مخاطب با موفقیت اضافه شد!"
        );
        
        // Redirect to home page after a short delay to show the success message
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
      
    } catch (error) {
      console.error("خطا در ارسال فرم:", error);
      // Don't show the error toast here as useErrorHandler already handles it
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-3">
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Always Visible Sections */}
            <div className="space-y-3">
              <div className="space-y-3">
                <h3 className="text-lg font-medium">اطلاعات پایه و تکمیلی</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">نام</Label>
                    <Input
                      id="firstName"
                      {...methods.register('firstName')}
                      placeholder="نام مخاطب"
                      className={methods.formState.errors.firstName ? 'border-red-500' : ''}
                    />
                    {methods.formState.errors.firstName && (
                      <p className="text-sm text-red-500">{methods.formState.errors.firstName.message as string}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lastName">نام خانوادگی</Label>
                    <Input
                      id="lastName"
                      {...methods.register('lastName')}
                      placeholder="نام خانوادگی مخاطب"
                      className={methods.formState.errors.lastName ? 'border-red-500' : ''}
                    />
                    {methods.formState.errors.lastName && (
                      <p className="text-sm text-red-500">{methods.formState.errors.lastName.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-sm font-medium" htmlFor="gender">
                      جنسیت
                    </Label>
                    <Select
                      dir={i18n.dir()}
                      value={methods.watch('gender') || ''}
                      onValueChange={(value) => methods.setValue('gender', value as 'male' | 'female' | 'other' | 'not_specified' || undefined)}
                    >
                      <SelectTrigger id="gender" className="w-fit">
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

              <PhoneNumbersSection dir={i18n.dir()} />
              
              {/* Groups Section */}
              <GroupsSection 
                dir={i18n.dir()}
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
                  className={methods.formState.errors.address?.message ? 'border-red-500' : ''}
                />
                {methods.formState.errors.address && (
                  <p className="text-sm text-red-500">
                    {String(methods.formState.errors.address?.message || '')}
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
                <CustomFieldsSection templates={templates} dir={i18n.dir()} />
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
          {process.env.NODE_ENV === 'development' && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => {
                console.log("Current form values:", methods.getValues());
                console.log("Form errors:", methods.formState.errors);
              }}
            >
              Debug
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}