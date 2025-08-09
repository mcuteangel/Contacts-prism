"use client";

// ===== IMPORTS & DEPENDENCIES =====
import React, { useEffect, useState, useCallback } from "react";
import { ContactService } from "@/services/contact-service";
import type { ContactUI as UIContact, GroupUI as UIGroup } from "@/domain/ui-types";
import { useLiveContacts, useLiveGroups, useLiveOutboxMap } from "@/hooks/use-live-data";
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
  // هم‌تراز با انواع مورد انتظار ContactList
  const [contacts, setContacts] = useState<UIContact[]>([]);
  const [groups, setGroups] = useState<UIGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [starredContacts, setStarredContacts] = useState<Set<string | number>>(new Set());
  const [pinnedContacts, setPinnedContacts] = useState<Set<string | number>>(new Set());

  // Live data (Dexie liveQuery)
  const liveContacts = useLiveContacts(searchTerm);
  const liveGroups = useLiveGroups();
  const liveOutbox = useLiveOutboxMap("contacts");
  
  // Use the global state from context for the form dialog
  const { isContactFormOpen, editingContact, setEditingContact, closeContactForm } = useContactForm();
  const isMobile = useIsMobile();

  // Debounce the search term to avoid excessive database queries while typing
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // بهینه‌سازی: جلوگیری از setStateهای تکراری با memo
  const normalizedSearch = React.useMemo(() => debouncedSearchTerm.trim().toLowerCase(), [debouncedSearchTerm]);

  // حذف fetchContacts؛ داده‌ها از liveContacts تامین می‌شوند

  // حذف fetchGroups؛ داده‌ها از liveGroups تامین می‌شوند

  // Outbox map for contacts (queued/sending/error/done)
  const [outboxMap, setOutboxMap] = useState<Record<string, { status: string; tryCount: number }>>({});

  // حذف اثر قدیمی fetchGroups؛ گروه‌ها از liveGroups می‌آید

  // Fetch contacts whenever the debounced search term changes
  // Sync live data into component state with minimal churn
  useEffect(() => {
    if (Array.isArray(liveContacts)) {
      setContacts((prev) => {
        const sameLength = prev.length === liveContacts.length;
        const sameIds = sameLength && prev.every((p, i) => String(p.id) === String(liveContacts[i]?.id));
        if (sameIds) return prev;
        return liveContacts;
      });
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [liveContacts]);

  useEffect(() => {
    if (Array.isArray(liveGroups)) {
      const normalized = liveGroups.map((g) => ({ ...g, id: String(g.id ?? "") }));
      setGroups((prev) => {
        const sameLength = prev.length === normalized.length;
        const sameIds = sameLength && prev.every((p, i) => String(p.id) === String(normalized[i]?.id));
        if (sameIds) return prev;
        return normalized;
      });
    }
  }, [liveGroups]);

  useEffect(() => {
    if (liveOutbox) {
      setOutboxMap(liveOutbox);
    }
  }, [liveOutbox]);

  // با live hooks دیگر نیازی به refreshData نیست
  const refreshData = () => {};

  const handleContactSaved = () => {
    refreshData();
    closeContactForm();
  };
  
  const handleEdit = (contact: UIContact) => {
    setEditingContact(contact as any);
  };

  const handleDelete = async (id: string | number) => {
    const idStr = String(id);
    if (window.confirm("آیا از حذف این مخاطب مطمئن هستید؟")) {
      try {
        const res = await ContactService.deleteContact(idStr);
        if (!res.ok) {
          toast.error("حذف مخاطب با شکست مواجه شد.");
          console.error("Error deleting contact (Result):", res.error);
          return;
        }
        toast.success("مخاطب با موفقیت حذف شد!");
        // نیازی به refreshData نیست؛ liveContacts خودکار آپدیت می‌شود
      } catch (error) {
        toast.error("حذف مخاطب با شکست مواجه شد.");
        console.error("Error deleting contact:", error);
      }
    }
  };

  const handleStarContact = (contact: UIContact) => {
    setStarredContacts(prev => {
      const newSet = new Set(prev);
      if (contact.id) {
        if (newSet.has(contact.id)) {
          newSet.delete(contact.id);
          toast.success("ستاره مخاطب برداشته شد");
        } else {
          newSet.add(contact.id);
          toast.success("مخاطب ستاره‌دار شد");
        }
      }
      return newSet;
    });
  };

  const handlePinContact = (contact: UIContact) => {
    setPinnedContacts(prev => {
      const newSet = new Set(prev);
      if (contact.id) {
        if (newSet.has(contact.id)) {
          newSet.delete(contact.id);
          toast.success("پین مخاطب برداشته شد");
        } else {
          newSet.add(contact.id);
          toast.success("مخاطب پین شد");
        }
      }
      return newSet;
    });
  };

  const handleAddGroup = async (groupName: string) => {
    try {
      await ContactService.addGroup(groupName);
      toast.success("گروه با موفقیت اضافه شد!");
      // نیازی به fetchGroups نیست؛ liveGroups خودکار به‌روزرسانی می‌شود
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
              onShareContact={(contact) => {
                // Implement share functionality
                console.log('Share contact:', contact);
              }}
              onStarContact={handleStarContact}
              onPinContact={handlePinContact}
              outboxById={outboxMap}
              starredContacts={starredContacts}
              pinnedContacts={pinnedContacts}
              showStar={true}
              showPin={true}
              rowSize="md"
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
        onGroupsRefreshed={() => {}}
      />

    </div>
  );
}