"use client";

import { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { toast } from "sonner";
import { ContactListHeader } from "@/components/contact-list-header";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { ContactList } from "@/components/contact-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isContactFormDialogOpen, setIsContactFormDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const fetchContacts = async () => {
    try {
      const response = await ContactService.getAllContacts();
      // Make sure we're setting the contacts array, not the whole response
      setContacts(Array.isArray(response) ? response : response?.data || []);
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

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, []);

  const handleAddContactClick = () => {
    setEditingContact(null);
    setIsContactFormDialogOpen(true);
  };

  const handleContactSaved = () => {
    fetchContacts(); // Refresh contacts after save/edit
    setEditingContact(null); // Clear editing state
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
    setIsContactFormDialogOpen(true);
  };

  const handleAddGroup = async (groupName: string) => {
    try {
      await ContactService.addGroup(groupName);
      toast.success("گروه با موفقیت اضافه شد!");
      fetchGroups(); // Re-fetch groups to update the select dropdown
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

  return (
    <>
      <h1 className="text-3xl font-bold text-primary-foreground mb-6">مخاطبین</h1>
      <ContactListHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <ContactFormDialog
        isOpen={isContactFormDialogOpen}
        onOpenChange={setIsContactFormDialogOpen}
        editingContact={editingContact}
        onContactSaved={handleContactSaved}
        groups={groups}
        onAddGroup={handleAddGroup}
        onGroupsRefreshed={fetchGroups}
      />

      <ContactList
        contacts={filteredContacts}
        groups={groups}
        onEditContact={handleEdit}
        onDeleteContact={handleDelete}
      />
      <ContactList
        contacts={filteredContacts}
        groups={groups}
        onEditContact={handleEdit}
        onDeleteContact={handleDelete}
      />

      {/* Floating Add Contact Button - Positioned above mobile nav */}
      <div className="fixed right-8 z-[60]" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}>
        <Button
          className="rounded-full h-14 w-14 shadow-lg flex items-center justify-center"
          onClick={handleAddContactClick}
        >
          <Plus size={24} />
        </Button>
      </div>
    </>
  );
}