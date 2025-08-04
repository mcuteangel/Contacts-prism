import Dexie, { type Table } from 'dexie';

export interface Contact {
  id?: number;
  name: string;
  phoneNumbers: string[];
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  customFields?: Record<string, string | number | Date | string[]>; // For custom fields
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
    this.version(1).stores({
      contacts: '++id, name, *phoneNumbers, createdAt, updatedAt', // Indexed by id, name, and phoneNumbers for search
      groups: '++id, name, createdAt, updatedAt',
    });
  }
}

export const db = new PrismContactsDB();