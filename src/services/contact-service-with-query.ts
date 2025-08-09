import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContactService } from "./contact-service";
import type { ContactUI, GroupUI } from "@/domain/ui-types";

// Custom hook for fetching contacts
export function useContacts(searchQuery?: string) {
  return useQuery({
    queryKey: ["contacts", searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        // If there's a search query, filter contacts on the client side
        // In a real app, you might want to implement server-side search
        const allContacts = await ContactService.getAllContacts();
        if (!allContacts?.ok) {
          throw new Error(allContacts?.error || "Failed to fetch contacts");
        }
        
        // Simple search implementation - can be enhanced
        const filtered = allContacts.data.data.filter((contact: ContactUI) =>
          contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumbers?.some((phone: any) =>
            phone.number.includes(searchQuery)
          )
        );
        
        return filtered;
      }
      
      // If no search query, fetch all contacts
      const result = await ContactService.getAllContacts();
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to fetch contacts");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Custom hook for fetching groups
export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const result = await ContactService.getAllGroups();
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to fetch groups");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Custom hook for creating a contact
export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contactData: any) => {
      const result = await ContactService.createContact(contactData);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to create contact");
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// Custom hook for updating a contact
export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, contactData }: { id: string; contactData: any }) => {
      const result = await ContactService.updateContact(id, contactData);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to update contact");
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// Custom hook for deleting a contact
export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await ContactService.deleteContact(id);
      if (!result?.ok) {
        throw new Error(result?.error || "Failed to delete contact");
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// Custom hook for fetching search suggestions
export function useSearchSuggestions(query: string, limit: number = 5) {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return [];
      }
      
      // Get all contacts and filter them
      const contactsResult = await ContactService.getAllContacts();
      if (!contactsResult?.ok) {
        return [];
      }
      
      const suggestions = contactsResult.data.data
        .filter((contact: ContactUI) =>
          contact.firstName.toLowerCase().includes(query.toLowerCase()) ||
          contact.lastName.toLowerCase().includes(query.toLowerCase()) ||
          contact.phoneNumbers?.some((phone: any) =>
            phone.number.includes(query)
          )
        )
        .slice(0, limit)
        .map((contact: ContactUI) => ({
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`,
          phone: contact.phoneNumbers?.[0]?.number || "",
        }));
      
      return suggestions;
    },
    enabled: query.length >= 2, // Only run query when query has at least 2 characters
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}