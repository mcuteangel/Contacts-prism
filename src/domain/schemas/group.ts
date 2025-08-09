import { z } from "zod";

/**
 * Domain Schema: Group
 * - اسکیمای مرکزی گروه‌ها برای استفاده در فرم‌ها و سرویس‌ها
 * - نوع‌ها: ورودی ساخت/ویرایش و مدل کامل
 */

// Base constraints
export const groupNameSchema = z
  .string()
  .min(1, "نام گروه الزامی است")
  .max(100, "نام گروه حداکثر ۱۰۰ کاراکتر باشد");

// Create/Update inputs
export const createGroupSchema = z.object({
  name: groupNameSchema,
  parentId: z.number().int().positive().optional(),
});

export const updateGroupSchema = z.object({
  id: z.number().int().positive("شناسه نامعتبر است"),
  name: groupNameSchema,
});

// Full model (لوکال Dexie)
export const groupModelSchema = z.object({
  id: z.number().int().positive().optional(),
  name: groupNameSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type GroupModel = z.infer<typeof groupModelSchema>;