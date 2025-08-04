"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { Toaster, toast } from "sonner";
import { ContactListHeader } from "@/components/contact-list-header";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { ContactList } from "@/components/contact-list";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { GroupsManagement } from "@/components/groups-management";
import { CustomFieldsManagement } from "@/components/custom-fields-management";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isContactFormDialogOpen, setIsContactFormDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups' | 'customFields'>('contacts');

  const isMobile = useIsMobile();

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

  const handleAddContactClick = () => {
    setEditingContact(null);
    setIsContactFormDialogOpen(true);
  };

  const handleContactSaved = () => {
    fetchContacts();
    setEditingContact(null);
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <Toaster richColors position="top-center" />

      <Header onContactsRefreshed={fetchContacts} />

      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsDialogOpen(true)}
      />

      <div className={`flex-grow w-full max-w-4xl mx-auto p-4 sm:p-8 pt-20 pb-20 sm:pt-24 sm:pb-24 ${!isMobile ? 'mr-64' : ''}`}>
        <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md">
          {activeTab === 'contacts' && (
            <>
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
            </>
          )}

          {activeTab === 'groups' && (
            <GroupsManagement />
          )}

          {activeTab === 'customFields' && (
            <CustomFieldsManagement />
          )}
        </div>
      </div>

      <ContactFormDialog
        isOpen={isContactFormDialogOpen}
        onOpenChange={setIsContactFormDialogOpen}
        editingContact={editingContact}
        onContactSaved={handleContactSaved}
        groups={groups}
        onAddGroup={handleAddGroup}
        onGroupsRefreshed={fetchGroups}
      />

      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        onContactsRefreshed={fetchContacts}
      />

      {activeTab === 'contacts' && (
        <Button
          className="fixed bottom-8 left-8 rounded-full h-14 w-14 shadow-lg flex items-center justify-center z-20"
          onClick={handleAddContactClick}
        >
          <Plus size={24} />
        </Button>
      )}

      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsDialogOpen(true)}
      />

      <MadeWithDyad />
    </div>
  );
}