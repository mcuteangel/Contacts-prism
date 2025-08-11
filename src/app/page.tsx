"use client";

// ===== IMPORTS & DEPENDENCIES =====
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContactService } from "@/services/contact-service";
import type { ContactUI as UIContact, GroupUI as UIGroup } from "@/domain/ui-types";
import { useLiveContacts, useLiveGroups, useLiveOutboxMap } from "@/hooks/use-live-data";
import { useContacts, useGroups, useCreateContact, useUpdateContact, useDeleteContact } from "@/services/contact-service-with-query";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { ContactList } from "@/components/contact-list";
import { AdvancedFilters, type FilterValues } from "@/components/advanced-filters";
import { EnhancedFilters } from "@/components/enhanced-filters";
import { AdvancedSearchInput } from "@/components/advanced-search-input";
import { NestedGroupsManagement } from "@/components/nested-groups-management";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useOfflineCapabilities, useOfflineStatus } from "@/hooks/use-offline-capabilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, AlertCircle, UserPlus } from "lucide-react";

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
  const router = useRouter();
  const [contacts, setContacts] = useState<UIContact[]>([]);
  const [groups, setGroups] = useState<UIGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [starredContacts, setStarredContacts] = useState<Set<string | number>>(new Set());
  const [pinnedContacts, setPinnedContacts] = useState<Set<string | number>>(new Set());
  const [filters, setFilters] = useState<FilterValues>({
    groups: [],
    tags: [],
    dateRange: {
      from: undefined,
      to: undefined,
    },
  });

  // قابلیت‌های آفلاین
  const {
    isOnline,
    isOffline,
    isSyncing,
    lastSyncTime,
    syncError,
    syncNow,
    clearSyncError,
    pendingChanges,
    hasPendingChanges,
  } = useOfflineCapabilities();

  const offlineStatus = useOfflineStatus();
  
  // Simple filters for ContactList component
  const [contactFilters, setContactFilters] = useState({
    text: '',
    group: '',
    starred: undefined as boolean | undefined,
    pinned: undefined as boolean | undefined,
    dateFilters: {
      createdAt: undefined as Date | undefined,
      updatedAt: undefined as Date | undefined,
    },
    tags: [] as string[],
  });
  
  // Enhanced filters state
  const [enhancedFilters, setEnhancedFilters] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    groups: [] as string[],
    tags: [] as string[],
    isStarred: false,
    isPinned: false,
    customFields: [] as Array<{
      name: string;
      value: string;
      operator?: 'equals' | 'contains' | 'starts_with' | 'ends_with';
    }>,
  });
  
  // Enhanced filters popover state
  const [isEnhancedFiltersOpen, setIsEnhancedFiltersOpen] = useState(false);
  
  // مدیریت جستجو
  const handleSearchSubmit = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // مدیریت تغییرات جستجو
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // فیلتر کردن مخاطبین بر اساس فیلترهای اعمال شده
  const filteredContacts = React.useMemo(() => {
    return contacts.filter(contact => {
      // Text search filter
      if (contactFilters.text && contactFilters.text.trim()) {
        const searchText = contactFilters.text.toLowerCase();
        const searchableText = [
          contact.firstName,
          contact.lastName,
          contact.emails?.[0]?.address,
          contact.phoneNumbers?.[0]?.number,
          contact.company,
          contact.position,
          contact.address
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchText)) {
          return false;
        }
      }

      // Group filter
      if (contactFilters.group) {
        const contactGroups = contact.groupId ? [contact.groupId] : [];
        if (!contactGroups.some((groupId: string | number) => groupId === contactFilters.group)) {
          return false;
        }
      }

      // Starred filter
      if (contactFilters.starred !== undefined) {
        const isStarred = starredContacts.has(contact.id!);
        if (isStarred !== contactFilters.starred) {
          return false;
        }
      }

      // Pinned filter
      if (contactFilters.pinned !== undefined) {
        const isPinned = pinnedContacts.has(contact.id!);
        if (isPinned !== contactFilters.pinned) {
          return false;
        }
      }

      // Date filters
      if (contactFilters.dateFilters) {
        const { createdAt, updatedAt } = contactFilters.dateFilters;
        
        if (createdAt) {
          const contactDate = new Date(contact.createdAt || 0);
          const filterDate = new Date(createdAt);
          if (contactDate < filterDate) {
            return false;
          }
        }

        if (updatedAt) {
          const contactDate = new Date(contact.updatedAt || 0);
          const filterDate = new Date(updatedAt);
          if (contactDate < filterDate) {
            return false;
          }
        }
      }

      // Tag filters
      if (contactFilters.tags && contactFilters.tags.length > 0) {
        const contactTags = contact.tags || [];
        const hasMatchingTag = contactFilters.tags.some((tag: string) =>
          contactTags.some(contactTag =>
            contactTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, contactFilters, starredContacts, pinnedContacts]);

  // Live data (Dexie liveQuery) - kept for real-time updates
  const liveContacts = useLiveContacts(searchTerm);
  const liveGroups = useLiveGroups();
  const liveOutbox = useLiveOutboxMap("contacts");
  
  const isMobile = useIsMobile();

  // Debounce the search term to avoid excessive database queries while typing
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // React Query hooks for data fetching and caching
  const { data: contactsData, isLoading: isContactsLoading, error: contactsError } = useContacts(debouncedSearchTerm);
  const { data: groupsData, isLoading: isGroupsLoading, error: groupsError } = useGroups();
  const { mutate: deleteContact } = useDeleteContact();
  const queryClient = useQueryClient();

  // بهینه‌سازی: جلوگیری از setStateهای تکراری با memo
  const normalizedSearch = React.useMemo(() => debouncedSearchTerm.trim().toLowerCase(), [debouncedSearchTerm]);

  // Outbox map for contacts (queued/sending/error/done)
  const [outboxMap, setOutboxMap] = useState<Record<string, { status: string; tryCount: number }>>({});

  // Sync React Query data with component state
  useEffect(() => {
    if (contactsData) {
      if (Array.isArray(contactsData)) {
        setContacts(contactsData);
      } else {
        setContacts(contactsData.data);
      }
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [contactsData]);

  useEffect(() => {
    if (groupsData) {
      const normalized = groupsData.map((g) => ({ ...g, id: String(g.id ?? "") }));
      setGroups(normalized);
    }
  }, [groupsData]);

  useEffect(() => {
    if (liveOutbox) {
      setOutboxMap(liveOutbox);
    }
  }, [liveOutbox]);
  
  const handleEdit = (contact: UIContact) => {
    router.push(`/contacts/${contact.id}/edit`);
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مخاطبین من</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    مدیریت و سازماندهی مخاطبین شما
                    {isOffline && (
                      <span className="text-orange-600 dark:text-orange-400 ml-2">
                        (حالت آفلاین فعال)
                      </span>
                    )}
                  </p>
                </div>
                
              </div>
              <div className="w-full">
                <AdvancedSearchInput
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onSearch={handleSearchSubmit}
                  className="w-full"
                  enableSmartSuggestions={true}
                  enableRecentSearches={true}
                  maxSuggestions={5}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <AdvancedFilters
                  groups={groups}
                  filters={filters}
                  onFilterChange={setFilters}
                  className="mb-4"
                />
                <EnhancedFilters
                  filters={enhancedFilters}
                  onFiltersChange={setEnhancedFilters}
                  onClearFilters={() => setEnhancedFilters({
                    name: '',
                    email: '',
                    phone: '',
                    company: '',
                    position: '',
                    address: '',
                    dateFrom: undefined,
                    dateTo: undefined,
                    groups: [],
                    tags: [],
                    isStarred: false,
                    isPinned: false,
                    customFields: [],
                  })}
                  isOpen={isEnhancedFiltersOpen}
                  onOpenChange={setIsEnhancedFiltersOpen}
                />
              </div>
              
              <ContactList
                contacts={filteredContacts}
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
                filters={contactFilters}
                onFiltersChange={setContactFilters}
                onReorderContacts={(fromIndex, toIndex) => {
                  console.log('Reordering contacts from', fromIndex, 'to', toIndex);
                  // TODO: Implement contact reordering logic
                  toast.success('مخاطب با موفقیت مرتب‌سازی شد');
                }}
                onMoveContactToGroup={(contactId, groupId) => {
                  console.log('Moving contact', contactId, 'to group', groupId);
                  // TODO: Implement move to group logic
                  toast.success('مخاطب با موفقیت به گروه منتقل شد');
                }}
                enableDragDrop={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
