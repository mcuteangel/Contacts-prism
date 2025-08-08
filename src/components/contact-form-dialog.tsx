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
      <DialogContent className="sm:max-w-[600px] bg-transparent border-none overflow-y-auto max-h-[90vh]">
        <Card className="glass">
          <CardHeader>
            <CardTitle>{editingContact ? "ویرایش مخاطب" : "افزودن مخاطب جدید"}</CardTitle>
            <CardDescription>
              {editingContact ? "تغییرات مخاطب را اینجا اعمال کنید." : "مخاطب جدیدی به لیست خود اضافه کنید."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-4">
                <BasicInfoSection />
                <PhoneNumbersSection />
                <ProfessionalInfoSection />
                <GroupsSection groups={groups} onAddGroup={onAddGroup} onGroupsRefreshed={onGroupsRefreshed} />
                <AdditionalInfoSection />
                <CustomFieldsSection templates={templates} />
              </form>
            </FormProvider>
          </CardContent>
          <CardFooter className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              onClick={methods.handleSubmit(onSubmit)}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                "در حال ذخیره..."
              ) : editingContact ? (
                <><Save size={16} /> ذخیره تغییرات</>
              ) : (
                <><UserPlus size={16} /> افزودن مخاطب</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
