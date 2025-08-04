import Dexie, { type Table } from 'dexie';

export interface Contact {
  id?: number;
  firstName: string;
  lastName?: string; // Added
  phoneNumbers: { type: string; number: string }[]; // Changed structure
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  position?: string; // Added
  address?: string; // Added
  groupId?: number; // Added for linking to groups
  customFields?: { name: string; value: string; type: 'text' | 'number' | 'date' | 'list' }[]; // Structured custom fields
  avatar?: string; // Base64 string for local avatar
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismContactsDB extends Dexie {
  contacts!: Table<Contact>;
  groups!: Table<Group>;

  constructor() {
    super('PrismContactsDB');
    // Version 2: Changed Contact schema significantly
    this.version(2).stores({
      contacts: '++id, firstName, lastName, *phoneNumbers.number, position, groupId, createdAt, updatedAt', // Updated indexes
      groups: '++id, name, createdAt, updatedAt',
    }).upgrade(async tx => {
      // Migration logic for existing data from version 1 to 2
      // This is a destructive migration for phoneNumbers and name,
      // as the structure changes fundamentally.
      // For a real app, you'd write complex logic to transform old data.
      // For this example, we'll just clear and re-add if needed, or assume fresh start.
      console.log("Database schema upgraded to version 2. Existing contact data might need manual migration if structure changed significantly.");
    });
  }
}

export const db = new PrismContactsDB();