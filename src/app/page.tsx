"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { Toaster, toast } from "sonner";
import { ContactListHeader } from "@/components/contact-list-header";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { ContactList } from "@/components/contact-list";
import { useContactForm } from "@/contexts/contact-form-context";
import { useIsMobile } from "@/hooks/use-is-mobile";

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const { isContactFormOpen, editingContact, closeContactForm } = useContactForm();

  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
    fetchContacts();
    fetchGroups();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await ContactService.getAllContacts();
      // Handle both array and paginated responses
      const contactsData = Array.isArray(response) ? response : response?.data || [];
      setContacts(contactsData);
    } catch (error) {
      toast.error("بارگذاری مخاطبین با شکست مواجه شد.");
      console.error("Error fetching contacts:", error);
      setContacts([]); // Ensure contacts is always an array
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

  const handleContactSaved = () => {
    fetchContacts();
    closeContactForm();
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
    // این حالت توسط context مدیریت می‌شود
  };

  const handleAddGroup = async (groupName: string) => {
    try {
      await ContactService.addGroup(groupName);
      toast.success("گروه با موفقیت اضافه شد!");
      fetchGroups();
    } catch (error) {
      toast.error("افزودن گروه با شکست مواجه شد.");
      console.error("Error adding group:", error);
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

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
        <div className="flex-grow w-full max-w-4xl mx-auto p-4 sm:p-8 pt-20 pb-20 sm:pt-24 sm:pb-24">
          <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <Toaster richColors position="top-center" />

      <div className="flex-grow p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl glass p-6 rounded-lg shadow-lg backdrop-blur-md">
          <div className="space-y-6">
            <ContactListHeader
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <ContactList
              contacts={filteredContacts}
              groups={groups}
              onEditContact={handleEdit}
              onDeleteContact={handleDelete}
            />
          </div>
        </div>
      </div>

      <ContactFormDialog
        isOpen={isContactFormOpen}
        onOpenChange={closeContactForm}
        editingContact={editingContact}
        onContactSaved={handleContactSaved}
        groups={groups}
        onAddGroup={handleAddGroup}
        onGroupsRefreshed={fetchGroups}
      />

      <MadeWithDyad />
    </div>
  );
}