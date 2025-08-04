"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { type Contact, type Group } from "@/database/db";
import { AddGroupDialog } from "./add-group-dialog";

// --- Zod Schemas ---
const phoneNumberSchema = z.object({
  id: z.number().optional(), // For unique key in React list
  type: z.string().min(1, "نوع شماره الزامی است"),
  number: z.string().min(1, "شماره تلفن الزامی است"),
});

const customFieldSchema = z.object({
  id: z.number().optional(), // For unique key in React list
  name: z.string().min(1, "نام فیلد الزامی است"),
  value: z.string().min(1, "مقدار فیلد الزامی است"),
  type: z.enum(['text', 'number', 'date', 'list']),
});

const formSchema = z.object({
  firstName: z.string().min(1, "نام الزامی است"),
  lastName: z.string().optional(),
  phoneNumbers: z.array(phoneNumberSchema).min(1, "حداقل یک شماره تلفن الزامی است"),
  gender: z.enum(['male', 'female', 'other']).optional(),
  notes: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  groupId: z.number().optional(),
  customFields: z.array(customFieldSchema).optional(),
});

type ContactFormValues = z.infer<typeof formSchema>;

interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingContact: Contact | null;
  onContactSaved: () => void;
  groups: Group[];
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
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumbers: [{ id: 0, type: "Mobile", number: "" }],
      gender: undefined,
      notes: "",
      position: "",
      address: "",
      groupId: undefined,
      customFields: [],
    },
  });

  const [phoneInputs, setPhoneInputs] = useState<{ id: number; type: string; number: string }[]>([]);
  const [customFieldInputs, setCustomFieldInputs] = useState<{ id: number; name: string; value: string; type: 'text' | 'number' | 'date' | 'list' }[]>([]);

  useEffect(() => {
    if (editingContact) {
      form.reset({
        firstName: editingContact.firstName,
        lastName: editingContact.lastName,
        gender: editingContact.gender,
        notes: editingContact.notes,
        position: editingContact.position,
        address: editingContact.address,
        groupId: editingContact.groupId,
      });
      setPhoneInputs(editingContact.phoneNumbers.map((pn, index) => ({ id: index, ...pn })));
      setCustomFieldInputs(editingContact.customFields?.map((cf, index) => ({ id: index, ...cf })) || []);
    } else {
      form.reset();
      setPhoneInputs([{ id: 0, type: "Mobile", number: "" }]);
      setCustomFieldInputs([]);
    }
  }, [editingContact, form]);

  const addPhoneNumberField = () => {
    setPhoneInputs(prev => [...prev, { id: prev.length > 0 ? Math.max(...prev.map(p => p.id || 0)) + 1 : 0, type: "Mobile", number: "" }]);
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

  const removeCustomField = (idToRemove: number) => {
    setCustomFieldInputs(prev => prev.filter(cf => cf.id !== idToRemove));
  };

  const updateCustomField = (id: number, field: 'name' | 'value' | 'type', value: string) => {
    setCustomFieldInputs(prev => prev.map(cf => cf.id === id ? { ...cf, [field]: value } : cf));
  };

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const contactData: Omit<Contact, 'createdAt' | 'updatedAt' | 'id'> = {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumbers: phoneInputs.map(({ id, ...rest }) => rest),
        gender: values.gender,
        notes: values.notes,
        position: values.position,
        address: values.address,
        groupId: values.groupId,
        customFields: customFieldInputs.map(({ id, ...rest }) => rest),
      };

      if (editingContact) {
        await ContactService.updateContact(editingContact.id!, contactData);
        toast.success("مخاطب با موفقیت به‌روزرسانی شد!");
      } else {
        await ContactService.addContact(contactData);
        toast.success("مخاطب با موفقیت اضافه شد!");
      }
      onContactSaved();
      onOpenChange(false); // Close dialog
    } catch (error) {
      toast.error("ذخیره مخاطب با شکست مواجه شد.");
      console.error("Error saving contact:", error);
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
                  onValueChange={(value) => updatePhoneNumberField(phoneInput.id!, 'type', value)}
                >
                  <SelectTrigger className="w-[120px] flex-shrink-0">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobile">موبایل</SelectItem>
                    <SelectItem value="Home">خانه</SelectItem>
                    <SelectItem value="Work">کار</SelectItem>
                    <SelectItem value="Other">سایر</SelectItem>
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
              <Select onValueChange={(value) => form.setValue("groupId", parseInt(value))} value={form.watch("groupId")?.toString()}>
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
            <Label className="text-right">فیلدهای سفارشی</Label>
            {customFieldInputs.map((cfInput) => (
              <div key={cfInput.id} className="flex items-center gap-2">
                <Input
                  placeholder="نام فیلد"
                  value={cfInput.name}
                  onChange={(e) => updateCustomField(cfInput.id!, 'name', e.target.value)}
                  className="w-[120px] flex-shrink-0"
                />
                <Select
                  value={cfInput.type}
                  onValueChange={(value) => updateCustomField(cfInput.id!, 'type', value as 'text' | 'number' | 'date' | 'list')}
                >
                  <SelectTrigger className="w-[100px] flex-shrink-0">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">متن</SelectItem>
                    <SelectItem value="number">عدد</SelectItem>
                    <SelectItem value="date">تاریخ</SelectItem>
                    <SelectItem value="list">لیست</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="مقدار فیلد"
                  value={cfInput.value}
                  onChange={(e) => updateCustomField(cfInput.id!, 'value', e.target.value)}
                  className="flex-grow"
                />
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
            <Button type="button" variant="outline" onClick={addCustomField} className="flex items-center gap-2">
              <Plus size={16} /> افزودن فیلد سفارشی
            </Button>
          </div>

          <DialogFooter className="col-span-full flex justify-end pt-4">
            <Button type="submit">{editingContact ? "ذخیره تغییرات" : "افزودن مخاطب"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}