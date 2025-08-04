import { db, type Contact, type Group } from '@/database/db';

export const ContactService = {
  async addContact(contact: Omit<Contact, 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    return db.contacts.add({ ...contact, createdAt: now, updatedAt: now });
  },

  async getContact(id: number): Promise<Contact | undefined> {
    return db.contacts.get(id);
  },

  async getAllContacts(): Promise<Contact[]> {
    return db.contacts.orderBy('name').toArray();
  },

  async updateContact(id: number, updates: Partial<Omit<Contact, 'createdAt'>>): Promise<number> {
    const now = new Date();
    return db.contacts.update(id, { ...updates, updatedAt: now });
  },

  async deleteContact(id: number): Promise<void> {
    return db.contacts.delete(id);
  },

  async searchContacts(query: string): Promise<Contact[]> {
    const lowerCaseQuery = query.toLowerCase();
    return db.contacts
      .filter(contact =>
        contact.name.toLowerCase().includes(lowerCaseQuery) ||
        contact.phoneNumbers.some(num => num.includes(lowerCaseQuery)) ||
        (contact.notes && contact.notes.toLowerCase().includes(lowerCaseQuery))
      )
      .toArray();
  },

  async exportContacts(): Promise<string> {
    const contacts = await db.contacts.toArray();
    return JSON.stringify(contacts, null, 2);
  },

  async importContacts(jsonString: string): Promise<void> {
    const contactsToImport: Contact[] = JSON.parse(jsonString);
    await db.transaction('rw', db.contacts, async () => {
      await db.contacts.clear(); // Clear existing contacts
      await db.contacts.bulkAdd(contactsToImport.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt), // Ensure dates are Date objects
        updatedAt: new Date(c.updatedAt),
      })));
    });
  },

  // Group operations (basic for now)
  async addGroup(name: string): Promise<number> {
    const now = new Date();
    return db.groups.add({ name, createdAt: now, updatedAt: now });
  },

  async getAllGroups(): Promise<Group[]> {
    return db.groups.orderBy('name').toArray();
  },

  async deleteGroup(id: number): Promise<void> {
    return db.groups.delete(id);
  },
};