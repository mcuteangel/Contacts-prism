import { z } from "zod";

/**
 * Zod schema for Global Custom Field Templates (دامنه)
 * هم‌راستا با اینترفیس CustomFieldTemplate در لایه دیتابیس:
 *   name: string
 *   type: 'text' | 'number' | 'date' | 'list'
 *   options?: string[]  (فقط برای list)
 *   description?: string
 *   required: boolean
 */
export const customFieldTemplateTypeSchema = z.enum(["text", "number", "date", "list"]);

export const customFieldTemplateSchema = z
  .object({
    name: z.string().min(1, "نام قالب الزامی است"),
    type: customFieldTemplateTypeSchema,
    options: z.array(z.string().min(1)).optional(),
    description: z.string().optional(),
    required: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.type === "list") {
        return Array.isArray(data.options) && data.options.length > 0;
      }
      return true;
    },
    { message: "برای نوع لیست، حداقل یک گزینه لازم است", path: ["options"] }
  );

// برای ویرایش، همان قوانین ایجاد اعمال می‌شود؛ اما تمام فیلدها اختیاری می‌شوند
export const updateCustomFieldTemplateSchema = z
  .object({
    name: z.string().min(1, "نام قالب الزامی است").optional(),
    type: customFieldTemplateTypeSchema.optional(),
    options: z.array(z.string().min(1)).optional(),
    description: z.string().optional(),
    required: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "list") {
        // اگر type به list تغییر کند، حداقل یک options لازم است
        return Array.isArray(data.options) && data.options.length > 0;
      }
      return true;
    },
    { message: "برای نوع لیست، حداقل یک گزینه لازم است", path: ["options"] }
  );

export type CustomFieldTemplateType = z.infer<typeof customFieldTemplateTypeSchema>;
export type CreateCustomFieldTemplateInput = z.infer<typeof customFieldTemplateSchema>;
export type UpdateCustomFieldTemplateInput = z.infer<typeof updateCustomFieldTemplateSchema>;