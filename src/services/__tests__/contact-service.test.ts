import { ContactService, toUI } from '../contact-service';
import { db } from '@/database/db';
import type { ContactUI } from '@/domain/ui-types';
import type { Contact } from '@/database/db';

// Mock the database with more complete implementation
jest.mock('@/database/db', () => {
  const originalModule = jest.requireActual('@/database/db');
  return {
    ...originalModule,
    db: {
      contacts: {
        toArray: jest.fn(),
        where: jest.fn().mockReturnThis(),
        toCollection: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        and: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        toArray: jest.fn(),
      },
      outbox: {
        add: jest.fn(),
        update: jest.fn(),
        toArray: jest.fn().mockResolvedValue([]),
      },
    },
  };
});

describe('ContactService', () => {  
  // Mock data - ContactUI format for assertions
  const mockContactsUI: ContactUI[] = [
    {
      id: '1',
      firstName: 'علی',
      lastName: 'محمدی',
      company: 'شرکت نمونه',
      position: 'برنامه نویس',
      phoneNumbers: [{ id: '1', number: '09123456789', type: 'mobile' }],
      emails: [{ id: '1', address: 'ali@example.com', type: 'work' }],
      address: 'تهران، خیابان نمونه',
      notes: 'تست یادداشت',
      customFields: [
        { id: '1', name: 'department', value: 'فناوری اطلاعات' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      firstName: 'رضا',
      lastName: 'احمدی',
      company: 'شرکت دیگر',
      position: 'طراح رابط کاربری',
      phoneNumbers: [{ id: '2', number: '09129876543', type: 'mobile' }],
      emails: [{ id: '2', address: 'reza@example.com', type: 'personal' }],
      address: 'اصفهان، خیابان اصلی',
      notes: 'مخاطب مهم',
      customFields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as ContactUI[];
  
  // Convert to ContactDB format for the mock
  const mockContactsDB = mockContactsUI.map(contact => ({
    id: contact.id,
    user_id: 'user-1',
    first_name: contact.firstName,
    last_name: contact.lastName,
    role: contact.position,
    company: contact.company,
    address: contact.address,
    notes: contact.notes,
    gender: 'not_specified',
    created_at: contact.createdAt,
    updated_at: contact.updatedAt,
    _deleted_at: null,
    _version: 1,
    _conflict: false,
    phoneNumbers: contact.phoneNumbers,
    position: contact.position,
    groupId: ''
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    (db.contacts.toArray as jest.Mock).mockResolvedValue(mockContactsDB);
    (db.contacts.where as jest.Mock).mockImplementation(() => ({
      toArray: () => Promise.resolve(mockContactsDB),
    }));
  });

  describe('searchContacts', () => {
    it('should return all contacts when query is empty', async () => {
      // Mock the database response with all contacts
      (db.contacts.toArray as jest.Mock).mockResolvedValueOnce([...mockContactsDB]);
      
      console.log('Running test: should return all contacts when query is empty');
      console.log('Mock contactsDB:', JSON.stringify(mockContactsDB, null, 2));
      
      const result = await ContactService.searchContacts('');
      console.log('Search result:', JSON.stringify(result, null, 2));
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        console.log('Result data:', result.data);
        expect(Array.isArray(result.data.data)).toBe(true);
        expect(result.data.data).toHaveLength(2);
      } else {
        console.error('Search failed with error:', result.error);
      }
    });

    it('should filter contacts by name', async () => {
      // Mock the database response with all contacts
      (db.contacts.toArray as jest.Mock).mockResolvedValueOnce([...mockContactsDB]);
      
      console.log('Running test: should filter contacts by name');
      console.log('Searching for name:علی');
      
      const result = await ContactService.searchContacts('name:علی');
      console.log('Search result:', JSON.stringify(result, null, 2));
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        console.log('Found contacts:', result.data.data);
        expect(Array.isArray(result.data.data)).toBe(true);
        // Should find the contact with first name 'علی'
        const aliContact = result.data.data.find(c => c.firstName === 'علی');
        console.log('Found contact with name علی:', aliContact);
        expect(aliContact).toBeDefined();
      } else {
        console.error('Search failed with error:', result.error);
      }
    });

    it('should filter contacts by company', async () => {
      // Mock the database response with all contacts
      (db.contacts.toArray as jest.Mock).mockResolvedValueOnce(mockContactsDB);
      
      const result = await ContactService.searchContacts('company:نمونه');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data.data)).toBe(true);
        // Should find the contact with company 'شرکت نمونه'
        const companyContact = result.data.data.find(c => c.company === 'شرکت نمونه');
        expect(companyContact).toBeDefined();
      }
    });

    it('should filter contacts by email', async () => {
      // Mock the database response with all contacts
      (db.contacts.toArray as jest.Mock).mockResolvedValueOnce(mockContactsDB);
      
      const result = await ContactService.searchContacts('email:example.com');
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Array.isArray(result.data.data)).toBe(true);
        // Should find contacts with example.com in their emails
        const hasExampleEmails = result.data.data.every(contact => 
          contact.emails?.some(email => email.address.includes('example.com'))
        );
        expect(hasExampleEmails).toBe(true);
      }
    });

    describe('error handling', () => {
      it('should handle database errors', async () => {
        // Mock a database error
        (db.contacts.toArray as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
        
        const result = await ContactService.searchContacts('test');
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain('خطا در جستجوی مخاطبین');
        }
      });
    });
  });
});
