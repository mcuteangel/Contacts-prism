// ===== IMPORTS & DEPENDENCIES =====
import Dexie, { type Table } from 'dexie';

// ===== TYPES & INTERFACES =====
export interface Contact {
  id?: number;
  firstName: string;
  lastName?: string;
  phoneNumbers: { type: string; number: string }[];
  searchablePhoneNumbers: string[]; // New field for efficient indexing
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  position?: string;
  address?: string;
  groupId?: number;
  customFields?: { name: string; value: string; type: 'text' | 'number' | 'date' | 'list' }[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== CORE BUSINESS LOGIC =====
export class PrismContactsDB extends Dexie {
  contacts!: Table<Contact>;
  groups!: Table<Group>;

  constructor() {
    super('PrismContactsDB');
    
    // Increment the version number due to schema change
    this.version(3).stores({
      contacts: '++id, firstName, lastName, *searchablePhoneNumbers, position, groupId, createdAt, updatedAt', // Corrected multi-entry index
      groups: '++id, name, createdAt, updatedAt',
    }).upgrade(async tx => {
        // Migration logic to add the new `searchablePhoneNumbers` field to existing contacts
        return tx.table('contacts').toCollection().modify(contact => {
            if (contact.phoneNumbers && !contact.searchablePhoneNumbers) {
                contact.searchablePhoneNumbers = contact.phoneNumbers.map(pn => pn.number);
            }
        });
    });

    // Previous versions for backward compatibility (if needed)
    this.version(2).stores({
      contacts: '++id, firstName, lastName, *phoneNumbers.number, position, groupId, createdAt, updatedAt',
      groups: '++id, name, createdAt, updatedAt',
    });
  }
}

// ===== INITIALIZATION & STARTUP =====
export const db = new PrismContactsDB();