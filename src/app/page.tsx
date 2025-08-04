"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toaster, toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Upload, Download, Trash2, Edit, Phone, Tag, MapPin, Briefcase, User, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // State for dynamic phone number inputs
  const [phoneInputs, setPhoneInputs] = useState<{ id: number; type: string; number: string }[]>([]);
  // State for dynamic custom field inputs
  const [customFieldInputs, setCustomFieldInputs] = useState<{ id: number; name: string; value: string; type: 'text' | 'number' | 'date' | 'list' }[]>([]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumbers: [{ id: 0, type: "Mobile", number: "" }], // Initialize with one phone number field
      gender: undefined,
      notes: "",
      position: "",
      address: "",
      groupId: undefined,
      customFields: [],
    },
  });

  const fetchContacts = async () => {
    try {
      const allContacts = await ContactService.getAllContacts();
      setContacts(allContacts);
    } catch (error) {
      toast.error("بارگذاری مخاطبین با شکست مواجه شد.");
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const allGroups = await ContactService.getAllGroups();
      setGroups(allGroups);
    } catch (error) {
      toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, []);

  // --- Dynamic Phone Number Handlers ---
  const addPhoneNumberField = () => {
    setPhoneInputs(prev => [...prev, { id: prev.length > 0 ? Math.max(...prev.map(p => p.id || 0)) + 1 : 0, type: "Mobile", number: "" }]);
  };

  const removePhoneNumberField = (idToRemove: number) => {
    setPhoneInputs(prev => prev.filter(p => p.id !== idToRemove));
  };

  const updatePhoneNumberField = (id: number, field: 'type' | 'number', value: string) => {
    setPhoneInputs(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // --- Dynamic Custom Field Handlers ---
  const addCustomField = () => {
    setCustomFieldInputs(prev => [...prev, { id: prev.length > 0 ? Math.max(...prev.map(cf => cf.id || 0)) + 1 : 0, name: "", value: "", type: "text" }]);
  };

  const removeCustomField = (idToRemove: number) => {
    setCustomFieldInputs(prev => prev.filter(cf => cf.id !== idToRemove));
  };

  const updateCustomField = (id: number, field: 'name' | 'value' | 'type', value: string) => {
    setCustomFieldInputs(prev => prev.map(cf => cf.id === id ? { ...cf, [field]: value } : cf));
  };

  // --- Group Creation Handler ---
  const handleAddGroup = async (groupName: string) => {
    if (!groupName.trim()) {
      toast.error("نام گروه نمی‌تواند خالی باشد.");
      return;
    }
    try {
      await ContactService.addGroup(groupName);
      toast.success("گروه با موفقیت اضافه شد!");
      fetchGroups(); // Re-fetch groups to update the select dropdown
    } catch (error) {
      toast.error("افزودن گروه با شکست مواجه شد.");
      console.error("Error adding group:", error);
    }
  };

  const onSubmit = async (values: ContactFormValues) => {
    try {
      // Ensure phoneInputs and customFieldInputs are used from state, not form values directly
      const contactData: Omit<Contact, 'createdAt' | 'updatedAt' | 'id'> = {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumbers: phoneInputs.map(({ id, ...rest }) => rest), // Remove temporary 'id'
        gender: values.gender,
        notes: values.notes,
        position: values.position,
        address: values.address,
        groupId: values.groupId,
        customFields: customFieldInputs.map(({ id, ...rest }) => rest), // Remove temporary 'id'
      };

      if (editingContact) {
        await ContactService.updateContact(editingContact.id!, contactData);
        toast.success("مخاطب با موفقیت به‌روزرسانی شد!");
      } else {
        await ContactService.addContact(contactData);
        toast.success("مخاطب با موفقیت اضافه شد!");
      }
      form.reset();
      setPhoneInputs([{ id: 0, type: "Mobile", number: "" }]); // Reset phone inputs
      setCustomFieldInputs([]); // Reset custom fields
      setIsAddContactDialogOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      toast.error("ذخیره مخاطب با شکست مواجه شد.");
      console.error("Error saving contact:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("آیا از حذف این مخاطب مطمئن هستید؟")) {
      try {
        await ContactService.deleteContact(id);
        toast.success("مخاطب با موفقیت حذف شد!");
        fetchContacts();
      } catch (error) {
        toast.error("حذف مخاطب با شکست مواجه شد.");
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    form.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      gender: contact.gender,
      notes: contact.notes,
      position: contact.position,
      address: contact.address,
      groupId: contact.groupId,
    });
    // Populate dynamic phone inputs
    setPhoneInputs(contact.phoneNumbers.map((pn, index) => ({ id: index, ...pn })));
    // Populate dynamic custom fields
    setCustomFieldInputs(contact.customFields?.map((cf, index) => ({ id: index, ...cf })) || []);
    setIsAddContactDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      const json = await ContactService.exportContacts();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prism_contacts_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("مخاطبین با موفقیت خروجی گرفته شدند!");
    } catch (error) {
      toast.error("خروجی گرفتن از مخاطبین با شکست مواجه شد.");
      console.error("Error exporting contacts:", error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          await ContactService.importContacts(jsonString);
          toast.success("مخاطبین با موفقیت ورودی گرفته شدند!");
          fetchContacts();
        } catch (error) {
          toast.error("ورودی گرفتن از مخاطبین با شکست مواجه شد. لطفاً از معتبر بودن فایل JSON اطمینان حاصل کنید.");
          console.error("Error importing contacts:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    contact.phoneNumbers.some(pn => pn.number.includes(searchTerm) || pn.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.notes && contact.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.position && contact.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.address && contact.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.customFields && contact.customFields.some(cf => cf.name.toLowerCase().includes(searchTerm.toLowerCase()) || cf.value.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-4xl glass p-6 rounded-lg shadow-lg backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary-foreground">مخاطبین منشور</h1>
          <ThemeToggle />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="جستجوی مخاطبین..."
              className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddContactDialogOpen} onOpenChange={(open) => {
              setIsAddContactDialogOpen(open);
              if (!open) {
                form.reset();
                setEditingContact(null);
                setPhoneInputs([{ id: 0, type: "Mobile", number: "" }]); // Reset phone inputs
                setCustomFieldInputs([]); // Reset custom fields
              }
            }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={18} /> {editingContact ? "ویرایش مخاطب" : "افزودن مخاطب"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] glass overflow-y-auto max-h-[90vh]"> {/* Increased max-width and added scroll */}
                <DialogHeader>
                  <DialogTitle>{editingContact ? "ویرایش مخاطب" : "افزودن مخاطب جدید"}</DialogTitle>
                  <DialogDescription>
                    {editingContact ? "تغییرات مخاطب را اینجا اعمال کنید." : "مخاطب جدیدی به لیست خود اضافه کنید."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="firstName" className="text-right">
                      نام
                    </Label>
                    <Input id="firstName" {...form.register("firstName")} className="col-span-3" />
                    {form.formState.errors.firstName && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.firstName.message}</p>}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lastName" className="text-right">
                      نام خانوادگی
                    </Label>
                    <Input id="lastName" {...form.register("lastName")} className="col-span-3" />
                  </div>

                  {/* Dynamic Phone Numbers */}
                  <div className="col-span-4 grid gap-2">
                    <Label className="text-right">شماره(ها)</Label>
                    {phoneInputs.map((phoneInput, index) => (
                      <div key={phoneInput.id} className="grid grid-cols-4 items-center gap-2">
                        <Select
                          value={phoneInput.type}
                          onValueChange={(value) => updatePhoneNumberField(phoneInput.id!, 'type', value)}
                        >
                          <SelectTrigger className="col-span-1">
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
                          className="col-span-2"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePhoneNumberField(phoneInput.id!)}
                          className="col-span-1"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addPhoneNumberField} className="col-span-4 flex items-center gap-2">
                      <Plus size={16} /> افزودن شماره تلفن
                    </Button>
                    {form.formState.errors.phoneNumbers && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.phoneNumbers.message}</p>}
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gender" className="text-right">
                      جنسیت
                    </Label>
                    <Select onValueChange={(value) => form.setValue("gender", value as "male" | "female" | "other")} value={form.watch("gender")}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="انتخاب جنسیت" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">مرد</SelectItem>
                        <SelectItem value="female">زن</SelectItem>
                        <SelectItem value="other">سایر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="position" className="text-right">
                      سمت/تخصص
                    </Label>
                    <Input id="position" {...form.register("position")} className="col-span-3" />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      آدرس
                    </Label>
                    <Textarea id="address" {...form.register("address")} className="col-span-3" />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="groupId" className="text-right">
                      گروه
                    </Label>
                    <div className="col-span-3 flex gap-2">
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Plus size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[300px]">
                          <DialogHeader>
                            <DialogTitle>افزودن گروه جدید</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <Input
                              id="new-group-name"
                              placeholder="نام گروه"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddGroup((e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = ''; // Clear input
                                  e.preventDefault(); // Prevent form submission
                                }
                              }}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" onClick={() => {
                              const inputElement = document.getElementById('new-group-name') as HTMLInputElement;
                              if (inputElement) {
                                handleAddGroup(inputElement.value);
                                inputElement.value = '';
                              }
                            }}>افزودن</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      یادداشت‌ها
                    </Label>
                    <Textarea id="notes" {...form.register("notes")} className="col-span-3" />
                  </div>

                  {/* Dynamic Custom Fields */}
                  <div className="col-span-4 grid gap-2">
                    <Label className="text-right">فیلدهای سفارشی</Label>
                    {customFieldInputs.map((cfInput, index) => (
                      <div key={cfInput.id} className="grid grid-cols-4 items-center gap-2">
                        <Input
                          placeholder="نام فیلد"
                          value={cfInput.name}
                          onChange={(e) => updateCustomField(cfInput.id!, 'name', e.target.value)}
                          className="col-span-1"
                        />
                        <Select
                          value={cfInput.type}
                          onValueChange={(value) => updateCustomField(cfInput.id!, 'type', value as 'text' | 'number' | 'date' | 'list')}
                        >
                          <SelectTrigger className="col-span-1">
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
                          className="col-span-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomField(cfInput.id!)}
                          className="col-span-1"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addCustomField} className="col-span-4 flex items-center gap-2">
                      <Plus size={16} /> افزودن فیلد سفارشی
                    </Button>
                  </div>

                  <DialogFooter>
                    <Button type="submit">{editingContact ? "ذخیره تغییرات" : "افزودن مخاطب"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download size={18} /> خروجی
            </Button>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Label htmlFor="import-file" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer">
              <Upload size={18} /> ورودی
            </Label>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredContacts.length === 0 ? (
            <p className="text-center text-muted-foreground">مخاطبی یافت نشد. برای شروع یک مخاطب جدید اضافه کنید!</p>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.id} className="glass p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{contact.firstName} {contact.lastName}</h3>
                  {contact.phoneNumbers.length > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Phone size={14} className="ml-1" />
                      {contact.phoneNumbers.map((pn, idx) => (
                        <span key={idx} className="ml-2">
                          {pn.type}: {pn.number}
                        </span>
                      ))}
                    </div>
                  )}
                  {contact.position && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                      <Briefcase size={14} className="ml-1" /> {contact.position}
                    </p>
                  )}
                  {contact.address && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                      <MapPin size={14} className="ml-1" /> {contact.address}
                    </p>
                  )}
                  {contact.groupId && groups.find(g => g.id === contact.groupId) && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                      <Tag size={14} className="ml-1" /> {groups.find(g => g.id === contact.groupId)?.name}
                    </p>
                  )}
                  {contact.gender && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                      <User size={14} className="ml-1" /> {contact.gender === 'male' ? 'مرد' : contact.gender === 'female' ? 'زن' : 'سایر'}
                    </p>
                  )}
                  {contact.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{contact.notes}</p>
                  )}
                  {contact.customFields && contact.customFields.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {contact.customFields.map((cf, idx) => (
                        <p key={idx}>
                          <span className="font-medium">{cf.name}:</span> {cf.value} ({cf.type})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(contact)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(contact.id!)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
}