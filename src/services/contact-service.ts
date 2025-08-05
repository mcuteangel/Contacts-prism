// ===== IMPORTS & DEPENDENCIES =====
import { db, type Contact, type Group } from '@/database/db';

// ===== TYPES & INTERFACES =====
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: keyof Omit<Contact, 'phoneNumbers' | 'searchablePhoneNumbers' | 'customFields'>;
  sortDirection?: 'asc' | 'desc';
}

export interface AdvancedSearchOptions extends PaginationOptions {
  query?: string;
  groupId?: number;
  gender?: Contact['gender'];
  minCreatedDate?: Date;
  maxCreatedDate?: Date;
  hasCustomFields?: boolean;
  hasAvatar?: boolean;
}

// ===== CORE BUSINESS LOGIC =====
export const ContactService = {
  // ===== CONTACTS CRUD =====
  async addContact(contact: Omit<Contact, 'createdAt' | 'updatedAt' | 'id' | 'searchablePhoneNumbers'>): Promise<number> {
    const now = new Date();
    const searchablePhoneNumbers = contact.phoneNumbers.map(pn => pn.number);
    return db.contacts.add({ ...contact, searchablePhoneNumbers, createdAt: now, updatedAt: now });
  },

  async getContact(id: number): Promise<Contact | undefined> {
    return db.contacts.get(id);
  },

  async getAllContacts(options?: PaginationOptions): Promise<{ data: Contact[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'firstName',
      sortDirection = 'asc'
    } = options || {};

    const offset = (page - 1) * pageSize;
    
    // Get total count for pagination
    const total = await db.contacts.count();
    
    // Get all contacts and apply sorting in memory
    let contacts = await db.contacts.toArray();
    
    // Apply sorting
    contacts.sort((a, b) => {
      const aValue = a[sortBy as keyof Contact];
      const bValue = b[sortBy as keyof Contact];
      
      // Handle undefined/null values
      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
      
      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Apply pagination
    const data = contacts.slice(offset, offset + pageSize);
    
    return { data, total };
  },

  async updateContact(id: number, updates: Partial<Omit<Contact, 'createdAt' | 'updatedAt' | 'searchablePhoneNumbers'>>): Promise<number> {
    const now = new Date();
    
    const finalUpdates: any = { ...updates, updatedAt: now };

    // If phoneNumbers are being updated, also update the searchablePhoneNumbers
    if (updates.phoneNumbers) {
      finalUpdates.searchablePhoneNumbers = updates.phoneNumbers.map(pn => pn.number);
    }

    return db.contacts.update(id, finalUpdates);
  },

  async deleteContact(id: number): Promise<void> {
    return db.contacts.delete(id);
  },

  // ===== BULK OPERATIONS =====
  async bulkDeleteContacts(ids: number[]): Promise<void> {
    await db.transaction('rw', db.contacts, async () => {
      await db.contacts.bulkDelete(ids);
    });
  },

  async bulkUpdateContacts(ids: number[], updates: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'searchablePhoneNumbers'>>): Promise<number> {
    const now = new Date();
    const finalUpdates: any = { ...updates, updatedAt: now };

    // If phoneNumbers are being updated, also update the searchablePhoneNumbers
    if (updates.phoneNumbers) {
      finalUpdates.searchablePhoneNumbers = updates.phoneNumbers.map(pn => pn.number);
    }

    return db.transaction('rw', db.contacts, async () => {
      let count = 0;
      for (const id of ids) {
        const updated = await db.contacts.update(id, finalUpdates);
        if (updated) count++;
      }
      return count;
    });
  },

  async bulkAddToGroup(contactIds: number[], groupId: number | undefined): Promise<number> {
    return db.transaction('rw', db.contacts, async () => {
      let count = 0;
      for (const id of contactIds) {
        const updated = await db.contacts.update(id, { 
          groupId,
          updatedAt: new Date() 
        });
        if (updated) count++;
      }
      return count;
    });
  },

  // ===== IMPORT/EXPORT =====
  async exportToVCF(): Promise<string> {
    const contacts = await db.contacts.toArray();
    const groups = await this.getAllGroups();
    const groupMap = new Map(groups.map(g => [g.id, g.name]));
    
    const vcfLines: string[] = [];
    
    for (const contact of contacts) {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${contact.firstName} ${contact.lastName || ''}`.trim(),
        `N:${contact.lastName || ''};${contact.firstName};;;`
      ];
      
      // Add phone numbers
      contact.phoneNumbers.forEach(phone => {
        const type = phone.type.toUpperCase() === 'MOBILE' ? 'CELL' : phone.type.toUpperCase();
        vcard.push(`TEL;TYPE=${type}:${phone.number}`);
      });
      
      // Add other fields
      if (contact.position) vcard.push(`TITLE:${contact.position}`);
      if (contact.address) vcard.push(`ADR:;;${contact.address};;;;`);
      if (contact.groupId && groupMap.has(contact.groupId)) {
        vcard.push(`CATEGORIES:${groupMap.get(contact.groupId)}`);
      }
      if (contact.notes) vcard.push(`NOTE:${contact.notes}`);
      
      vcard.push('END:VCARD');
      vcfLines.push(vcard.join('\n'));
    }
    
    return vcfLines.join('\n');
  },
  
  async exportToCSV(): Promise<string> {
    const contacts = await db.contacts.toArray();
    const groups = await this.getAllGroups();
    const groupMap = new Map(groups.map(g => [g.id, g.name]));
    
    // Define CSV headers
    const headers = [
      'First Name',
      'Last Name',
      'Phone Numbers',
      'Gender',
      'Position',
      'Address',
      'Group',
      'Created At',
      'Updated At'
    ];
    
    // Convert contacts to CSV rows
    const rows = contacts.map(contact => {
      const groupName = contact.groupId ? groupMap.get(contact.groupId) || '' : '';
      return [
        `"${(contact.firstName || '').replace(/"/g, '""')}"`,
        `"${(contact.lastName || '').replace(/"/g, '""')}"`,
        `"${contact.phoneNumbers.map(pn => `${pn.type}: ${pn.number}`).join('; ')}"`,
        `"${contact.gender || ''}"`,
        `"${(contact.position || '').replace(/"/g, '""')}"`,
        `"${(contact.address || '').replace(/"/g, '""')}"`,
        `"${groupName}"`,
        `"${contact.createdAt.toISOString()}"`,
        `"${contact.updatedAt.toISOString()}"`
      ].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  },
  
  // ===== DEDUPLICATION =====
  async findDuplicateContacts(): Promise<Array<{field: string; value: string; contacts: Contact[]}>> {
    // Convert to array immediately to work with array methods
    const contacts = await db.contacts.toArray();
    const duplicates: Array<{field: string; value: string; contacts: Contact[]}> = [];
    
    // Helper to find duplicates by a specific field
    const findDuplicatesByField = (field: keyof Contact) => {
      const seen = new Map<string, Contact[]>();
      
      // Ensure we're working with an array
      if (!Array.isArray(contacts)) {
        console.error('Expected contacts to be an array, got:', typeof contacts);
        return;
      }
      
      contacts.forEach(contact => {
        const value = contact[field];
        if (!value) return;
        
        let key: string;
        if (field === 'phoneNumbers' && Array.isArray(value)) {
          // Type guard to ensure we're working with phone numbers
          if (value.every(item => item && typeof item === 'object' && 'number' in item)) {
            key = value.map((v: any) => v.number).sort().join(';');
          } else {
            key = JSON.stringify(value);
          }
        } else {
          key = String(value);
        }
          
        if (!seen.has(key)) {
          seen.set(key, []);
        }
        seen.get(key)?.push(contact);
      });
      
      // Add groups with more than one contact
      seen.forEach((contactList, value) => {
        if (contactList.length > 1) {
          duplicates.push({
            field: field as string,
            value,
            contacts: contactList
          });
        }
      });
    };
    
    try {
      // Check for duplicates by name and phone numbers
      findDuplicatesByField('firstName');
      findDuplicatesByField('phoneNumbers');
    } catch (error) {
      console.error('Error in findDuplicateContacts:', error);
      throw error; // Re-throw to handle in the UI
    }
    
    return duplicates;
  },
  
  async mergeContacts(contactIds: number[], primaryContactId: number): Promise<Contact> {
    return db.transaction('rw', db.contacts, async () => {
      const contacts = await db.contacts.bulkGet(contactIds);
      const primaryContact = contacts.find(c => c?.id === primaryContactId);
      
      if (!primaryContact) {
        throw new Error('Primary contact not found');
      }
      
      // Merge contact data
      const mergedContact: Contact = { ...primaryContact };
      
      contacts.forEach(contact => {
        if (!contact || contact.id === primaryContactId) return;
        
        // Merge phone numbers (avoid duplicates)
        const existingNumbers = new Set(mergedContact.phoneNumbers.map(pn => pn.number));
        contact.phoneNumbers.forEach(pn => {
          if (!existingNumbers.has(pn.number)) {
            mergedContact.phoneNumbers.push(pn);
            existingNumbers.add(pn.number);
          }
        });
        
        // Merge other fields if empty in primary
        if (!mergedContact.lastName && contact.lastName) mergedContact.lastName = contact.lastName;
        if (!mergedContact.position && contact.position) mergedContact.position = contact.position;
        if (!mergedContact.address && contact.address) mergedContact.address = contact.address;
        if (!mergedContact.avatar && contact.avatar) mergedContact.avatar = contact.avatar;
        if (!mergedContact.gender && contact.gender) mergedContact.gender = contact.gender;
        
        // Merge custom fields
        if (contact.customFields?.length) {
          const existingFields = new Set(mergedContact.customFields?.map(cf => cf.name) || []);
          contact.customFields.forEach(cf => {
            if (!existingFields.has(cf.name)) {
              mergedContact.customFields = [...(mergedContact.customFields || []), cf];
              existingFields.add(cf.name);
            }
          });
        }
      });
      
      // Update searchable phone numbers
      mergedContact.searchablePhoneNumbers = mergedContact.phoneNumbers.map(pn => pn.number);
      
      // Update the primary contact with merged data
      // Create an update object with only the fields that can be updated
      const updateData: Partial<Contact> = {
        ...mergedContact,
        id: undefined, // Don't update the ID
        createdAt: primaryContact.createdAt, // Keep original creation date
        updatedAt: new Date() // Update the last modified date
      };
      
      await db.contacts.update(primaryContactId, updateData);
      
      // Delete the other contacts
      const otherContactIds = contactIds.filter(id => id !== primaryContactId);
      if (otherContactIds.length > 0) {
        await db.contacts.bulkDelete(otherContactIds);
      }
      
      return mergedContact;
    });
  },
  
  // ===== SEARCH & DATA MANAGEMENT =====
  async searchContacts(
    query: string, 
    options: PaginationOptions = {}
  ): Promise<{ data: Contact[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'firstName',
      sortDirection = 'asc'
    } = options;

    const offset = (page - 1) * pageSize;
    
    if (!query.trim()) {
      return this.getAllContacts(options);
    }
    
    const lowerCaseQuery = query.toLowerCase();
    
    // Get all contacts and filter in memory for complex conditions
    const allContacts = await db.contacts.toArray();
    
    // Apply search filters
    const filteredContacts = allContacts.filter(contact => {
      return (
        contact.firstName.toLowerCase().startsWith(lowerCaseQuery) ||
        (contact.lastName?.toLowerCase().startsWith(lowerCaseQuery) ?? false) ||
        contact.searchablePhoneNumbers.some(num => num.startsWith(lowerCaseQuery)) ||
        (contact.position?.toLowerCase().startsWith(lowerCaseQuery) ?? false)
      );
    });
    
    const total = filteredContacts.length;
    
    // Apply sorting
    const sortedContacts = [...filteredContacts].sort((a, b) => {
      const aValue = a[sortBy as keyof Contact];
      const bValue = b[sortBy as keyof Contact];
      
      // Handle undefined/null values
      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
      
      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Apply pagination
    const data = sortedContacts.slice(offset, offset + pageSize);
    
    return { data, total };
  },
  
  async getContactStats(): Promise<{
    total: number;
    withAvatar: number;
    withCustomFields: number;
    byGender: Record<string, number>;
    byGroup: Array<{ groupId: number | undefined; name: string; count: number }>;
  }> {
    const allContacts = await db.contacts.toArray();
    const groups = await this.getAllGroups();
    
    const stats = {
      total: allContacts.length,
      withAvatar: allContacts.filter(c => !!c.avatar).length,
      withCustomFields: allContacts.filter(c => c.customFields && c.customFields.length > 0).length,
      byGender: allContacts.reduce((acc, contact) => {
        const gender = contact.gender || 'unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byGroup: groups.map(group => ({
        groupId: group.id,
        name: group.name,
        count: allContacts.filter(c => c.groupId === group.id).length
      })).concat([{
        groupId: undefined,
        name: 'بدون گروه',
        count: allContacts.filter(c => c.groupId === undefined).length
      }])
    };
    
    return stats;
  },

  async advancedSearch(options: AdvancedSearchOptions = {}): Promise<{ data: Contact[]; total: number }> {
    const {
      query = '',
      groupId,
      gender,
      minCreatedDate,
      maxCreatedDate,
      hasCustomFields,
      hasAvatar,
      page = 1,
      pageSize = 20,
      sortBy = 'firstName',
      sortDirection = 'asc'
    } = options;
    
    const offset = (page - 1) * pageSize;
    
    // Start with all contacts
    let collection = db.contacts.toCollection();
    
    // Apply filters
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      collection = collection
        .filter(contact => 
          contact.firstName.toLowerCase().includes(lowerCaseQuery) ||
          (contact.lastName?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          contact.searchablePhoneNumbers.some(num => num.includes(lowerCaseQuery)) ||
          (contact.position?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          (contact.notes?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          (contact.address?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          (contact.customFields?.some(cf => 
            cf.value.toLowerCase().includes(lowerCaseQuery)
          ) ?? false)
        );
    }
    
    if (groupId !== undefined) {
      collection = collection.and(contact => contact.groupId === groupId);
    }
    
    if (gender) {
      collection = collection.and(contact => contact.gender === gender);
    }
    
    if (minCreatedDate) {
      collection = collection.and(contact => contact.createdAt >= minCreatedDate);
    }
    
    if (maxCreatedDate) {
      collection = collection.and(contact => contact.createdAt <= maxCreatedDate);
    }
    
    if (hasCustomFields) {
      collection = collection.and(contact => 
        !!contact.customFields && contact.customFields.length > 0
      );
    }
    
    if (hasAvatar) {
      collection = collection.and(contact => !!contact.avatar);
    }
    
    // Get total count
    const total = await collection.count();
    
    // Apply sorting
    let contacts = await collection.toArray();
    if (sortBy) {
      contacts.sort((a, b) => {
        const aValue = a[sortBy as keyof Contact];
        const bValue = b[sortBy as keyof Contact];
        
        // Handle undefined/null values
        if (aValue === bValue) return 0;
        if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
        
        // Compare values
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply pagination
    const data = contacts.slice(offset, offset + pageSize);
    
    return { data, total };
  },

  async exportContacts(): Promise<string> {
    const contacts = await db.contacts.toArray();
    return JSON.stringify(contacts, null, 2);
  },

  async importContacts(jsonString: string): Promise<void> {
    const contactsToImport: Contact[] = JSON.parse(jsonString);
    await db.transaction('rw', db.contacts, async () => {
      await db.contacts.clear();
      await db.contacts.bulkAdd(contactsToImport.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        phoneNumbers: c.phoneNumbers || [],
        searchablePhoneNumbers: (c.phoneNumbers || []).map(pn => pn.number), // Ensure new field is populated on import
        customFields: c.customFields || [],
      })));
    });
  },

  // ===== GROUPS CRUD =====
  async addGroup(name: string): Promise<number> {
    const now = new Date();
    return db.groups.add({ name, createdAt: now, updatedAt: now });
  },

  async getAllGroups(): Promise<Group[]> {
    return db.groups.orderBy('name').toArray();
  },

  async deleteGroup(id: number): Promise<void> {
    // Also remove groupId from contacts associated with this group
    await db.transaction('rw', db.contacts, db.groups, async () => {
      await db.contacts.where({ groupId: id }).modify({ groupId: undefined });
      await db.groups.delete(id);
    });
  },
};