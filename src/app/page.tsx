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

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumbers: z.string().min(1, "At least one phone number is required").transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  gender: z.enum(['male', 'female', 'other']).optional(),
  notes: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phoneNumbers: "",
      gender: undefined,
      notes: "",
    },
  });

  const fetchContacts = async () => {
    try {
      const allContacts = await ContactService.getAllContacts();
      setContacts(allContacts);
    } catch (error) {
      toast.error("Failed to load contacts.");
      console.error("Error fetching contacts:", error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const onSubmit = async (values: ContactFormValues) => {
    try {
      if (editingContact) {
        await ContactService.updateContact(editingContact.id!, {
          name: values.name,
          phoneNumbers: values.phoneNumbers,
          gender: values.gender,
          notes: values.notes,
        });
        toast.success("Contact updated successfully!");
      } else {
        await ContactService.addContact({
          name: values.name,
          phoneNumbers: values.phoneNumbers,
          gender: values.gender,
          notes: values.notes,
        });
        toast.success("Contact added successfully!");
      }
      form.reset();
      setIsAddContactDialogOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (error) {
      toast.error("Failed to save contact.");
      console.error("Error saving contact:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await ContactService.deleteContact(id);
        toast.success("Contact deleted successfully!");
        fetchContacts();
      } catch (error) {
        toast.error("Failed to delete contact.");
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      phoneNumbers: contact.phoneNumbers.join(', '),
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
      toast.success("Contacts exported successfully!");
    } catch (error) {
      toast.error("Failed to export contacts.");
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
          toast.success("Contacts imported successfully!");
          fetchContacts();
        } catch (error) {
          toast.error("Failed to import contacts. Please ensure the file is valid JSON.");
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
        <h1 className="text-3xl font-bold text-center mb-6 text-primary-foreground">Prism Contacts</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search contacts..."
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
                  <Plus size={18} /> {editingContact ? "Edit Contact" : "Add Contact"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass">
                <DialogHeader>
                  <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
                  <DialogDescription>
                    {editingContact ? "Make changes to your contact here." : "Add a new contact to your list."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" {...form.register("name")} className="col-span-3" />
                    {form.formState.errors.name && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phoneNumbers" className="text-right">
                      Phone(s)
                    </Label>
                    <Input id="phoneNumbers" placeholder="Comma separated" {...form.register("phoneNumbers")} className="col-span-3" />
                    {form.formState.errors.phoneNumbers && <p className="col-span-4 text-right text-red-500 text-sm">{form.formState.errors.phoneNumbers.message}</p>}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gender" className="text-right">
                      Gender
                    </Label>
                    <Select onValueChange={(value) => form.setValue("gender", value as "male" | "female" | "other")} value={form.watch("gender")}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Notes
                    </Label>
                    <Textarea id="notes" {...form.register("notes")} className="col-span-3" />
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingContact ? "Save Changes" : "Add Contact"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download size={18} /> Export
            </Button>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Label htmlFor="import-file" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer">
              <Upload size={18} /> Import
            </Label>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredContacts.length === 0 ? (
            <p className="text-center text-muted-foreground">No contacts found. Add a new contact to get started!</p>
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