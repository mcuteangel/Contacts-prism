// ===== IMPORTS & DEPENDENCIES =====
import { db, type Contact, type Group, Outbox, type CustomFieldTemplate } from '@/database/db';

// ===== Result Type (migration step 1) =====
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

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
  async addContact(contact: Omit<Contact, 'createdAt' | 'updatedAt' | 'id' | 'searchablePhoneNumbers'>): Promise<Result<number>> {
    try {
      const now = new Date();
      const searchablePhoneNumbers = contact.phoneNumbers.map(pn => pn.number);
      const localId = await db.contacts.add({ ...contact, searchablePhoneNumbers, createdAt: now, updatedAt: now });
      await Outbox.enqueueCreateContact({
        localId,
        data: { ...contact, searchablePhoneNumbers, createdAt: now.toISOString(), updatedAt: now.toISOString() }
      });
      return { ok: true, data: localId };
    } catch (e: any) {
      console.error('addContact error:', e);
      return { ok: false, error: e?.message ?? 'addContact failed' };
    }
  },

  async getContact(id: number): Promise<Result<Contact | undefined>> {
    try {
      const item = await db.contacts.get(id);
      return { ok: true, data: item };
    } catch (e: any) {
      console.error('getContact error:', e);
      return { ok: false, error: e?.message ?? 'getContact failed' };
    }
  },

  async getAllContacts(options?: PaginationOptions): Promise<Result<{ data: Contact[]; total: number }>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'firstName',
      sortDirection = 'asc'
    } = options || {};

    try {
      const offset = (page - 1) * pageSize;
      const total = await db.contacts.count();
      let contacts = await db.contacts.toArray();
      contacts.sort((a, b) => {
        const aValue = a[sortBy as keyof Contact];
        const bValue = b[sortBy as keyof Contact];
        if (aValue === bValue) return 0;
        if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      const data = contacts.slice(offset, offset + pageSize);
      return { ok: true, data: { data, total } };
    } catch (e: any) {
      console.error('getAllContacts error:', e);
      return { ok: false, error: e?.message ?? 'getAllContacts failed' };
    }
  },

  async updateContact(id: number, updates: Partial<Omit<Contact, 'createdAt' | 'updatedAt' | 'searchablePhoneNumbers'>>): Promise<Result<number>> {
    try {
      const now = new Date();
      const finalUpdates: any = { ...updates, updatedAt: now };
      if (updates.phoneNumbers) {
        finalUpdates.searchablePhoneNumbers = updates.phoneNumbers.map(pn => pn.number);
      }
      const updated = await db.contacts.update(id, finalUpdates);
      if (updated) {
        await Outbox.enqueueUpdateContact({
          localId: id,
          changes: {
            ...updates,
            searchablePhoneNumbers: finalUpdates.searchablePhoneNumbers,
            updatedAt: now.toISOString()
          }
        });
      }
      return { ok: true, data: updated };
    } catch (e: any) {
      console.error('updateContact error:', e);
      return { ok: false, error: e?.message ?? 'updateContact failed' };
    }
  },

  async deleteContact(id: number): Promise<Result<null>> {
    try {
      await db.contacts.delete(id);
      await Outbox.enqueueDeleteContact({ localId: id });
      return { ok: true, data: null };
    } catch (e: any) {
      console.error('deleteContact error:', e);
      return { ok: false, error: e?.message ?? 'deleteContact failed' };
    }
  },

  // ===== BULK OPERATIONS =====
  async bulkDeleteContacts(ids: number[]): Promise<Result<null>> {
    try {
      await db.transaction('rw', db.contacts, async () => {
        await db.contacts.bulkDelete(ids);
      });
      for (const id of ids) {
        await Outbox.enqueueDeleteContact({ localId: id });
      }
      return { ok: true, data: null };
    } catch (e: any) {
      console.error('bulkDeleteContacts error:', e);
      return { ok: false, error: e?.message ?? 'bulkDeleteContacts failed' };
    }
  },

  async bulkUpdateContacts(ids: number[], updates: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'searchablePhoneNumbers'>>): Promise<Result<number>> {
    try {
      const now = new Date();
      const finalUpdates: any = { ...updates, updatedAt: now };
      if (updates.phoneNumbers) {
        finalUpdates.searchablePhoneNumbers = updates.phoneNumbers.map(pn => pn.number);
      }
      const count = await db.transaction('rw', db.contacts, async () => {
        let c = 0;
        for (const id of ids) {
          const updated = await db.contacts.update(id, finalUpdates);
          if (updated) c++;
        }
        return c;
      });
      for (const id of ids) {
        await Outbox.enqueueUpdateContact({
          localId: id,
          changes: {
            ...updates,
            searchablePhoneNumbers: finalUpdates.searchablePhoneNumbers,
            updatedAt: now.toISOString()
          }
        });
      }
      return { ok: true, data: count };
    } catch (e: any) {
      console.error('bulkUpdateContacts error:', e);
      return { ok: false, error: e?.message ?? 'bulkUpdateContacts failed' };
    }
  },

  async bulkAddToGroup(contactIds: number[], groupId: number | undefined): Promise<Result<number>> {
    try {
      const now = new Date();
      const count = await db.transaction('rw', db.contacts, async () => {
        let c = 0;
        for (const id of contactIds) {
          const updated = await db.contacts.update(id, {
            groupId,
            updatedAt: now
          });
          if (updated) c++;
        }
        return c;
      });
      for (const id of contactIds) {
        await Outbox.enqueueUpdateContact({
          localId: id,
          changes: { groupId, updatedAt: now.toISOString() }
        });
      }
      return { ok: true, data: count };
    } catch (e: any) {
      console.error('bulkAddToGroup error:', e);
      return { ok: false, error: e?.message ?? 'bulkAddToGroup failed' };
    }
  },

  // ===== IMPORT/EXPORT =====
  async exportToVCF(): Promise<Result<string>> {
    try {
      const contacts = await db.contacts.toArray();
      const groupsRes = await this.getAllGroups();
      if (!groupsRes.ok) {
        return { ok: false, error: groupsRes.error || 'Failed to load groups for VCF export' };
      }
      const groupMap = new Map(groupsRes.data.map((g: Group) => [g.id, g.name]));
      
      const vcfLines: string[] = [];
      
      for (const contact of contacts) {
        const vcard = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${`${contact.firstName || ''} ${contact.lastName || ''}`.trim()}`,
          `N:${contact.lastName || ''};${contact.firstName || ''};;;`
        ];
        
        // Add phone numbers
        contact.phoneNumbers.forEach(phone => {
          const type = phone.type?.toUpperCase?.() === 'MOBILE' ? 'CELL' : (phone.type?.toUpperCase?.() || 'VOICE');
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
      
      return { ok: true, data: vcfLines.join('\n') };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'VCF export failed' };
    }
  },
  
  async exportToCSV(): Promise<Result<string>> {
    try {
      const contacts = await db.contacts.toArray();
      const groupsRes = await this.getAllGroups();
      if (!groupsRes.ok) {
        return { ok: false, error: groupsRes.error || 'Failed to load groups for CSV export' };
      }
      const groupMap = new Map(groupsRes.data.map((g: Group) => [g.id, g.name]));
      
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
          `"${groupName.replace(/"/g, '""')}"`,
          `"${(contact.createdAt instanceof Date ? contact.createdAt : new Date(contact.createdAt)).toISOString()}"`,
          `"${(contact.updatedAt instanceof Date ? contact.updatedAt : new Date(contact.updatedAt)).toISOString()}"`
        ].join(',');
      });
      
      return { ok: true, data: [headers.join(','), ...rows].join('\n') };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'CSV export failed' };
    }
  },
  
  // ===== DEDUPLICATION =====
  async findDuplicateContacts(): Promise<Result<{ pairs: Array<{ a: Contact; b: Contact; reason: string }> }>> {
    try {
      const contacts = await db.contacts.toArray();
      const pairs: Array<{ a: Contact; b: Contact; reason: string }> = [];
      
      // Simple duplicate logic: same first+last or same phone number
      for (let i = 0; i < contacts.length; i++) {
        for (let j = i + 1; j < contacts.length; j++) {
          const a = contacts[i];
          const b = contacts[j];
          
          const sameName = (a.firstName || '').toLowerCase() === (b.firstName || '').toLowerCase()
            && (a.lastName || '').toLowerCase() === (b.lastName || '').toLowerCase();
          const intersectPhone = a.phoneNumbers.some(pa => b.phoneNumbers.some(pb => pa.number === pb.number));
          
          if (sameName) pairs.push({ a, b, reason: 'same_name' });
          else if (intersectPhone) pairs.push({ a, b, reason: 'same_phone' });
        }
      }
      
      return { ok: true, data: { pairs } };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to find duplicate contacts' };
    }
  },
  
  async mergeContacts(contactIds: number[], primaryContactId: number): Promise<Result<Contact>> {
    try {
      const result = await db.transaction('rw', db.contacts, async () => {
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

        // Enqueue update for primary
        await Outbox.enqueueUpdateContact({
          localId: primaryContactId,
          changes: {
            updatedAt: (updateData.updatedAt as Date).toISOString(),
            phoneNumbers: mergedContact.phoneNumbers,
            searchablePhoneNumbers: mergedContact.searchablePhoneNumbers,
            lastName: mergedContact.lastName,
            position: mergedContact.position,
            address: mergedContact.address,
            avatar: mergedContact.avatar,
            gender: mergedContact.gender,
            customFields: mergedContact.customFields
          }
        });

        // Enqueue deletes for merged-away contacts
        for (const id of otherContactIds) {
          await Outbox.enqueueDeleteContact({ localId: id });
        }
        
        return mergedContact;
      });

      return { ok: true, data: result };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to merge contacts' };
    }
  },
  
  // ===== SEARCH & DATA MANAGEMENT =====
 async searchContacts(
   query: string,
   options: PaginationOptions = {}
 ): Promise<Result<{ data: Contact[]; total: number }>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'firstName',
      sortDirection = 'asc'
    } = options;

    const offset = (page - 1) * pageSize;
    
   if (!query.trim()) {
     const allRes = await this.getAllContacts(options);
     // در صورت خطا همان را پاس می‌دهیم
     if (!allRes.ok) return allRes;
     return { ok: true, data: allRes.data };
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
    
   return { ok: true, data: { data, total } };
 },
  
  async getContactStats(): Promise<{
    total: number;
    withAvatar: number;
    withCustomFields: number;
    byGender: Record<string, number>;
    byGroup: Array<{ groupId: number | undefined; name: string; count: number }>;
  }> {
    const allContacts = await db.contacts.toArray();
    const groupsRes = await this.getAllGroups();
    const groups = groupsRes.ok ? groupsRes.data : [];
    
    const stats = {
      total: allContacts.length,
      withAvatar: allContacts.filter(c => !!c.avatar).length,
      withCustomFields: allContacts.filter(c => c.customFields && c.customFields.length > 0).length,
      byGender: allContacts.reduce((acc, contact) => {
        const gender = contact.gender || 'unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byGroup: groups.map((group: Group) => ({
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

  async advancedSearch(options: AdvancedSearchOptions = {}): Promise<Result<{ data: Contact[]; total: number }>> {
    try {
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
      
      return { ok: true, data: { data, total } };
    } catch (e: any) {
      console.error('advancedSearch error:', e);
      return { ok: false, error: e?.message ?? 'advancedSearch failed' };
    }
  },

  async exportContacts(): Promise<Result<string>> {
    try {
      const contacts = await db.contacts.toArray();
      return { ok: true, data: JSON.stringify(contacts, null, 2) };
    } catch (e: any) {
      console.error('exportContacts error:', e);
      return { ok: false, error: e?.message ?? 'exportContacts failed' };
    }
  },

  async importContacts(jsonString: string): Promise<Result<null>> {
    try {
      const contactsToImport: Contact[] = JSON.parse(jsonString);
      await db.transaction('rw', db.contacts, async () => {
        await db.contacts.clear();
        await db.contacts.bulkAdd(contactsToImport.map(c => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          phoneNumbers: c.phoneNumbers || [],
          searchablePhoneNumbers: (c.phoneNumbers || []).map(pn => pn.number),
          customFields: c.customFields || [],
        })));
      });
      return { ok: true, data: null };
    } catch (e: any) {
      console.error('importContacts error:', e);
      return { ok: false, error: e?.message ?? 'importContacts failed' };
    }
  },

  // ===== GROUPS CRUD (Result<T>) =====
  async addGroup(name: string): Promise<Result<number>> {
    try {
      const now = new Date();
      const id = await db.groups.add({ name, createdAt: now, updatedAt: now });
      // enqueue (اختیاری: اگر نیاز به سینک گروه‌ها با سرور دارید)
      // await Outbox.enqueueCreateGroup({ localId: id, data: { name, createdAt: now.toISOString(), updatedAt: now.toISOString() }});
      return { ok: true, data: id };
    } catch (e: any) {
      console.error('addGroup error:', e);
      return { ok: false, error: e?.message ?? 'addGroup failed' };
    }
  },

  async getAllGroups(): Promise<Result<Group[]>> {
    try {
      const list = await db.groups.orderBy('name').toArray();
      return { ok: true, data: list };
    } catch (e: any) {
      console.error('getAllGroups error:', e);
      return { ok: false, error: e?.message ?? 'getAllGroups failed' };
    }
  },

  async deleteGroup(id: number): Promise<Result<null>> {
    try {
      await db.transaction('rw', db.contacts, db.groups, async () => {
        await db.contacts.where({ groupId: id }).modify({ groupId: undefined });
        await db.groups.delete(id);
      });
      // enqueue delete گروه در صورت نیاز به سینک سرور
      // await Outbox.enqueueDeleteGroup({ localId: id });
      return { ok: true, data: null };
    } catch (e: any) {
      console.error('deleteGroup error:', e);
      return { ok: false, error: e?.message ?? 'deleteGroup failed' };
    }
  },

  // ===== CUSTOM FIELD TEMPLATES (Dexie - Phase 1) =====
  async addCustomFieldTemplate(input: Omit<CustomFieldTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<number>> {
    try {
      const now = new Date();
      const id = await db.customFieldTemplates.add({ ...input, createdAt: now, updatedAt: now });
      return { ok: true, data: id };
    } catch (e: any) {
      console.error('addCustomFieldTemplate error:', e);
      return { ok: false, error: e?.message ?? 'addCustomFieldTemplate failed' };
    }
  },

  async updateCustomFieldTemplate(id: number, changes: Partial<Omit<CustomFieldTemplate, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Result<number>> {
    try {
      const now = new Date();
      const updated = await db.customFieldTemplates.update(id, { ...changes, updatedAt: now });
      return { ok: true, data: updated };
    } catch (e: any) {
      console.error('updateCustomFieldTemplate error:', e);
      return { ok: false, error: e?.message ?? 'updateCustomFieldTemplate failed' };
    }
  },

  async deleteCustomFieldTemplate(id: number): Promise<Result<null>> {
    try {
      await db.customFieldTemplates.delete(id);
      return { ok: true, data: null };
    } catch (e: any) {
      console.error('deleteCustomFieldTemplate error:', e);
      return { ok: false, error: e?.message ?? 'deleteCustomFieldTemplate failed' };
    }
  },

  async getAllCustomFieldTemplates(): Promise<Result<CustomFieldTemplate[]>> {
    try {
      const list = await db.customFieldTemplates.orderBy('name').toArray();
      return { ok: true, data: list };
    } catch (e: any) {
      console.error('getAllCustomFieldTemplates error:', e);
      return { ok: false, error: e?.message ?? 'getAllCustomFieldTemplates failed' };
    }
  },
};