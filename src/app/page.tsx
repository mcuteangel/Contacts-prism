"use client";

// ===== IMPORTS & DEPENDENCIES =====
import React, { useEffect, useState, useCallback } from "react";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { Toaster, toast } from "sonner";
import { ContactListHeader } from "@/components/contact-list-header";
import { ContactFormDialog } from "@/components/contact-form-dialog";
import { ContactList } from "@/components/contact-list";
import { useContactForm } from "@/contexts/contact-form-context";
import { useIsMobile } from "@/hooks/use-is-mobile";

// ===== UTILITY FUNCTIONS (HOOKS) =====
/**
 * A custom hook to debounce a value.
 * It delays updating the value until after a specified delay has passed without any new changes.
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns The debounced value.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function to clear the timeout if the value changes before the delay is over.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ===== CORE BUSINESS LOGIC (MAIN COMPONENT) =====
export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the global state from context for the form dialog
  const { isContactFormOpen, editingContact, setEditingContact, closeContactForm } = useContactForm();
  const isMobile = useIsMobile();

  // Debounce the search term to avoid excessive database queries while typing
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchContacts = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      // Use the efficient search service which queries Dexie with indexes
      const response = await ContactService.searchContacts(query);
      // Handle both array and paginated responses
      const contactsData = Array.isArray(response) ? response : response?.data || [];
      setContacts(contactsData);
    } catch (error) {
      toast.error("بارگذاری مخاطبین با شکست مواجه شد.");
      console.error("Error fetching contacts:", error);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const allGroups = await ContactService.getAllGroups();
      setGroups(allGroups);
    } catch (error) {
      toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
      console.error("Error fetching groups:", error);
      setGroups([]);
    }
  }, []);

  // Fetch groups only once on mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Fetch contacts whenever the debounced search term changes
  useEffect(() => {
    fetchContacts(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchContacts]);

  const refreshData = () => {
    fetchContacts(debouncedSearchTerm);
    fetchGroups();
  };

  const handleContactSaved = () => {
    refreshData();
    closeContactForm();
  };
  
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("آیا از حذف این مخاطب مطمئن هستید؟")) {
      try {
        await ContactService.deleteContact(id);
        toast.success("مخاطب با موفقیت حذف شد!");
        refreshData();
      } catch (error) {
        toast.error("حذف مخاطب با شکست مواجه شد.");
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleAddGroup = async (groupName: string) => {
    try {
      await ContactService.addGroup(groupName);
      toast.success("گروه با موفقیت اضافه شد!");
      fetchGroups(); // Re-fetch groups to update the dialog
    } catch (error) {
      toast.error("افزودن گروه با شکست مواجه شد.");
      console.error("Error adding group:", error);
    }
  };
  
  // Loading skeleton for initial load
  if (isLoading && contacts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
        <div className="flex-grow w-full max-w-4xl mx-auto p-4 sm:p-8 pt-20 pb-20 sm:pt-24 sm:pb-24">
          <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-full mb-6"></div>
              <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
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
              contacts={contacts}
              groups={groups}
              onEditContact={handleEdit}
              onDeleteContact={handleDelete}
            />
          </div>
        </div>
      </div>

      <ContactFormDialog
        isOpen={isContactFormOpen}
        onOpenChange={(isOpen) => !isOpen && closeContactForm()}
        editingContact={editingContact}
        onContactSaved={handleContactSaved}
        groups={groups}
        onAddGroup={handleAddGroup}
        onGroupsRefreshed={fetchGroups}
      />

    </div>
  );
}