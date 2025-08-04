"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Contact } from "@/database/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toaster, toast } from "sonner"; // Import Sonner components
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
import { Plus, Search, Upload, Download, Trash2, Edit } from "lucide-react"; // Icons
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle

// Define the schema for the form input values
const formSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  phoneNumbers: z.string().min(1, "حداقل یک شماره تلفن الزامی است"), // This is a string for the input field
  gender: z.enum(['male', 'female', 'other']).optional(),
  notes: z.string().optional(),
});

type ContactFormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema), // Use formSchema here
    defaultValues: {
      name: "",
      phoneNumbers: "", // Default as a string
      gender: undefined,
      notes: "",
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

  useEffect(() => {
    fetchContacts();
  }, []);

  const onSubmit = async (values: ContactFormValues) => {
    try {
      // Transform phoneNumbers from string (from form) to string[] (for service)
      const phoneNumbersArray = values.phoneNumbers.split(',').map(s => s.trim()).filter(Boolean);

      if (editingContact) {
        await ContactService.updateContact(editingContact.id!, {
          name: values.name,
          phoneNumbers: phoneNumbersArray, // Use the transformed array
          gender: values.gender,
          notes: values.notes,
        });
        toast.success("مخاطب با موفقیت به‌روزرسانی شد!");
      } else {
        await ContactService.addContact({
          name: values.name,
          phoneNumbers: phoneNumbersArray, // Use the transformed array
          gender: values.gender,
          notes: values.notes,
        });
        toast.success("مخاطب با موفقیت اضافه شد!");
      }
      form.reset();
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
      name: contact.name,
      phoneNumbers: contact.phoneNumbers.join(', '), // Convert string[] to string for form input
      gender: contact.gender,
      notes: contact.notes,
    });
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
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phoneNumbers.some(num => num.includes(searchTerm)) ||
    (contact.notes && contact.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-4xl glass p-6 rounded-lg shadow-lg backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary-foreground">مخاطبین منشور</h1>
          <ThemeToggle /> {/* Add ThemeToggle here */}
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
              }
            }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={18} /> {editingContact ? "ویرایش مخاطب" : "افزودن مخاطب"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                  <DialogTitle>{editingContact ? "ویرایش مخاطب" : "افزودن مخاطب جدید"}</DialogTitle>
                  <DialogDescription>
                    {editingContact ? "تغییرات مخاطب را اینجا اعمال کنید." : "مخاطب جدیدی به لیست خود اضافه کنید."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      نام
                    </Label>
                    <Input id="name" {...form.register("name")} className="col-span-3" />
                    {form.formState.errors.name && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phoneNumbers" className="text-right">
                      شماره(ها)
                    </Label>
                    <Input id="phoneNumbers" placeholder="با کاما جدا کنید" {...form.register("phoneNumbers")} className="col-span-3" />
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
                    <Label htmlFor="notes" className="text-right">
                      یادداشت‌ها
                    </Label>
                    <Textarea id="notes" {...form.register("notes")} className="col-span-3" />
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
                <div>
                  <h3 className="font-semibold text-lg">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {contact.phoneNumbers.join(', ')}
                  </p>
                  {contact.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{contact.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
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