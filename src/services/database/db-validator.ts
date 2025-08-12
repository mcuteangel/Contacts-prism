/**
 * Database Validator - Data validation and integrity checks
 */

import { z } from 'zod';
import { db } from "@/database/db";
import { ErrorManager } from "@/lib/error-manager";
import type { ContactUI, GroupUI } from "@/domain/ui-types";

// Validation schemas
const ContactValidationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().optional(),
  firstName: z.string().min(1, 'نام الزامی است').max(100, 'نام خیلی طولانی است'),
  lastName: z.string().min(1, 'نام خانوادگی الزامی است').max(100, 'نام خانوادگی خیلی طولانی است'),
  gender: z.enum(['male', 'female', 'other', 'not_specified']).optional(),
  position: z.string().max(100, 'سمت خیلی طولانی است').optional(),
  company: z.string().max(200, 'نام شرکت خیلی طولانی است').optional().nullable(),
  address: z.string().max(500, 'آدرس خیلی طولانی است').optional().nullable(),
  notes: z.string().max(1000, 'یادداشت خیلی طولانی است').optional().nullable(),
  groupId: z.string().optional().nullable(),
  phoneNumbers: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().min(1, 'نوع شماره الزامی است'),
    number: z.string().min(1, 'شماره تلفن الزامی است').max(20, 'شماره تلفن خیلی طولانی است'),
  })).optional(),
  emails: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    type: z.string().min(1, 'نوع ایمیل الزامی است'),
    address: z.string().email('فرمت ایمیل نامعتبر است'),
  })).optional(),
  customFields: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(1, 'نام فیلد الزامی است'),
    value: z.string().min(1, 'مقدار فیلد الزامی است'),
    type: z.string().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().optional().nullable(),
  version: z.number().optional(),
  conflict: z.boolean().optional(),
});

const GroupValidationSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  userId: z.string().optional(),
  name: z.string().min(1, 'نام گروه الزامی است').max(100, 'نام گروه خیلی طولانی است'),
  color: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().optional().nullable(),
  version: z.number().optional(),
  membersCount: z.number().optional(),
});

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface DatabaseIntegrityResult {
  isValid: boolean;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    table: string;
    recordId?: string;
    message: string;
    suggestion?: string;
  }>;
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    warnings: number;
  };
}

export class DatabaseValidator {
  private static instance: DatabaseValidator;

  private constructor() {}

  public static getInstance(): DatabaseValidator {
    if (!DatabaseValidator.instance) {
      DatabaseValidator.instance = new DatabaseValidator();
    }
    return DatabaseValidator.instance;
  }

  /**
   * Validate a contact object
   */
  validateContact(contact: Partial<ContactUI>): ValidationResult {
    try {
      ContactValidationSchema.parse(contact);
      
      const warnings: Array<{ field: string; message: string; value?: any }> = [];
      
      // Additional business logic validations
      if (contact.phoneNumbers && contact.phoneNumbers.length === 0) {
        warnings.push({
          field: 'phoneNumbers',
          message: 'مخاطب بدون شماره تلفن',
          value: contact.phoneNumbers
        });
      }
      
      if (contact.emails && contact.emails.length === 0 && 
          (!contact.phoneNumbers || contact.phoneNumbers.length === 0)) {
        warnings.push({
          field: 'contact',
          message: 'مخاطب بدون شماره تلفن و ایمیل',
        });
      }

      // Check for duplicate phone numbers
      if (contact.phoneNumbers && contact.phoneNumbers.length > 1) {
        const numbers = contact.phoneNumbers.map(p => p.number);
        const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index);
        if (duplicates.length > 0) {
          warnings.push({
            field: 'phoneNumbers',
            message: 'شماره تلفن تکراری وجود دارد',
            value: duplicates
          });
        }
      }

      return {
        isValid: true,
        errors: [],
        warnings
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input
        }));

        return {
          isValid: false,
          errors,
          warnings: []
        };
      }

      return {
        isValid: false,
        errors: [{
          field: 'unknown',
          message: 'خطای نامشخص در اعتبارسنجی',
          value: error
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate a group object
   */
  validateGroup(group: Partial<GroupUI>): ValidationResult {
    try {
      GroupValidationSchema.parse(group);
      
      const warnings: Array<{ field: string; message: string; value?: any }> = [];
      
      // Check for reserved group names
      const reservedNames = ['همه', 'all', 'default', 'system'];
      if (group.name && reservedNames.includes(group.name.toLowerCase())) {
        warnings.push({
          field: 'name',
          message: 'نام گروه ممکن است با نام‌های سیستمی تداخل داشته باشد',
          value: group.name
        });
      }

      return {
        isValid: true,
        errors: [],
        warnings
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input
        }));

        return {
          isValid: false,
          errors,
          warnings: []
        };
      }

      return {
        isValid: false,
        errors: [{
          field: 'unknown',
          message: 'خطای نامشخص در اعتبارسنجی گروه',
          value: error
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate database integrity
   */
  async validateDatabaseIntegrity(): Promise<DatabaseIntegrityResult> {
    const issues: Array<{
      type: 'error' | 'warning' | 'info';
      table: string;
      recordId?: string;
      message: string;
      suggestion?: string;
    }> = [];

    let totalRecords = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let warnings = 0;

    try {
      // Validate contacts
      const contacts = await db.contacts.toArray();
      totalRecords += contacts.length;

      for (const contact of contacts) {
        const contactUI: ContactUI = {
          id: contact.id,
          userId: contact.user_id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          gender: contact.gender as any,
          position: (contact as any).position,
          company: contact.company,
          address: contact.address,
          notes: contact.notes,
          groupId: (contact as any).groupId,
          phoneNumbers: (contact as any).phoneNumbers || [],
          emails: (contact as any).emails || [],
          customFields: (contact as any).customFields || [],
          tags: (contact as any).tags || [],
          createdAt: contact.created_at,
          updatedAt: contact.updated_at,
          deletedAt: (contact as any)._deleted_at,
          version: (contact as any)._version,
          conflict: (contact as any)._conflict,
        };

        const validation = this.validateContact(contactUI);
        
        if (validation.isValid) {
          validRecords++;
        } else {
          invalidRecords++;
          validation.errors.forEach(error => {
            issues.push({
              type: 'error',
              table: 'contacts',
              recordId: contact.id,
              message: `${error.field}: ${error.message}`,
              suggestion: 'اصلاح داده‌های نامعتبر'
            });
          });
        }

        validation.warnings.forEach(warning => {
          warnings++;
          issues.push({
            type: 'warning',
            table: 'contacts',
            recordId: contact.id,
            message: `${warning.field}: ${warning.message}`,
            suggestion: 'بررسی و اصلاح در صورت نیاز'
          });
        });

        // Check for orphaned contacts (invalid groupId)
        if ((contact as any).groupId) {
          const groupExists = await db.groups.get((contact as any).groupId);
          if (!groupExists) {
            issues.push({
              type: 'error',
              table: 'contacts',
              recordId: contact.id,
              message: 'مخاطب به گروه نامعتبر اشاره می‌کند',
              suggestion: 'حذف یا اصلاح شناسه گروه'
            });
          }
        }
      }

      // Validate groups
      const groups = await db.groups.toArray();
      totalRecords += groups.length;

      for (const group of groups) {
        const groupUI: GroupUI = {
          id: group.id,
          userId: group.user_id,
          name: group.name,
          color: group.color,
          createdAt: group.created_at,
          updatedAt: group.updated_at,
          deletedAt: group.deleted_at,
          version: group.version,
        };

        const validation = this.validateGroup(groupUI);
        
        if (validation.isValid) {
          validRecords++;
        } else {
          invalidRecords++;
          validation.errors.forEach(error => {
            issues.push({
              type: 'error',
              table: 'groups',
              recordId: group.id,
              message: `${error.field}: ${error.message}`,
              suggestion: 'اصلاح داده‌های نامعتبر'
            });
          });
        }

        validation.warnings.forEach(warning => {
          warnings++;
          issues.push({
            type: 'warning',
            table: 'groups',
            recordId: group.id,
            message: `${warning.field}: ${warning.message}`,
            suggestion: 'بررسی نام گروه'
          });
        });

        // Check for duplicate group names
        const duplicateGroups = await db.groups
          .where('name')
          .equals(group.name)
          .and(g => g.id !== group.id && !g.deleted_at)
          .toArray();

        if (duplicateGroups.length > 0) {
          issues.push({
            type: 'warning',
            table: 'groups',
            recordId: group.id,
            message: 'نام گروه تکراری',
            suggestion: 'تغییر نام گروه برای جلوگیری از سردرگمی'
          });
        }
      }

      // Check outbox integrity
      const outboxItems = await db.outbox_queue.toArray();
      for (const item of outboxItems) {
        if (!item.entity || !item.entityId || !item.op) {
          issues.push({
            type: 'error',
            table: 'outbox_queue',
            recordId: String(item.id),
            message: 'آیتم outbox ناقص',
            suggestion: 'حذف آیتم نامعتبر'
          });
        }

        // Check for very old stuck items
        const itemDate = new Date(item.clientTime);
        const daysDiff = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 7 && (item.status === 'sending' || item.status === 'queued')) {
          issues.push({
            type: 'warning',
            table: 'outbox_queue',
            recordId: String(item.id),
            message: `آیتم outbox قدیمی (${Math.round(daysDiff)} روز)`,
            suggestion: 'بررسی و reset وضعیت'
          });
        }
      }

      return {
        isValid: invalidRecords === 0,
        issues,
        summary: {
          totalRecords,
          validRecords,
          invalidRecords,
          warnings,
        }
      };

    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'DatabaseValidator',
        action: 'validateDatabaseIntegrity'
      });

      return {
        isValid: false,
        issues: [{
          type: 'error',
          table: 'system',
          message: 'خطا در بررسی یکپارچگی پایگاه داده',
          suggestion: 'بررسی اتصال پایگاه داده'
        }],
        summary: {
          totalRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          warnings: 0,
        }
      };
    }
  }

  /**
   * Fix common data issues automatically
   */
  async autoFixIssues(): Promise<{
    success: boolean;
    fixedIssues: string[];
    errors: string[];
  }> {
    const fixedIssues: string[] = [];
    const errors: string[] = [];

    try {
      // Fix missing timestamps
      const contactsWithoutTimestamps = await db.contacts
        .filter(contact => !contact.created_at || !contact.updated_at)
        .toArray();

      if (contactsWithoutTimestamps.length > 0) {
        const now = new Date().toISOString();
        await db.transaction('rw', db.contacts, async () => {
          for (const contact of contactsWithoutTimestamps) {
            const updates: any = {};
            if (!contact.created_at) updates.created_at = now;
            if (!contact.updated_at) updates.updated_at = now;
            
            await db.contacts.update(contact.id, updates);
          }
        });
        fixedIssues.push(`Fixed timestamps for ${contactsWithoutTimestamps.length} contacts`);
      }

      // Fix invalid group references
      const contactsWithInvalidGroups = await db.contacts
        .filter(async contact => {
          if (!(contact as any).groupId) return false;
          const group = await db.groups.get((contact as any).groupId);
          return !group;
        })
        .toArray();

      if (contactsWithInvalidGroups.length > 0) {
        await db.transaction('rw', db.contacts, async () => {
          for (const contact of contactsWithInvalidGroups) {
            await db.contacts.update(contact.id, { groupId: null });
          }
        });
        fixedIssues.push(`Fixed invalid group references for ${contactsWithInvalidGroups.length} contacts`);
      }

      // Reset stuck outbox items
      const stuckOutboxItems = await db.outbox_queue
        .where('status')
        .equals('sending')
        .toArray();

      if (stuckOutboxItems.length > 0) {
        await db.transaction('rw', db.outbox_queue, async () => {
          for (const item of stuckOutboxItems) {
            await db.outbox_queue.update(item.id!, { status: 'queued' });
          }
        });
        fixedIssues.push(`Reset ${stuckOutboxItems.length} stuck outbox items`);
      }

      return {
        success: true,
        fixedIssues,
        errors,
      };

    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'DatabaseValidator',
        action: 'autoFixIssues'
      });

      errors.push(`Auto-fix failed: ${(error as Error).message}`);
      
      return {
        success: false,
        fixedIssues,
        errors,
      };
    }
  }
}

// Export singleton instance
export const dbValidator = DatabaseValidator.getInstance();