import { z } from "zod";

/**
 * Phone Number schema (دامِین)
 * - هم‌راستا با Contact["phoneNumbers"][number]
 */
export const phoneNumberSchema = z.object({
  type: z.enum(["mobile", "home", "work", "other"]),
  number: z
    .string()
    .min(5, "شماره تماس باید حداقل ۵ کاراکتر باشد")
    .regex(/^[0-9+()\-\s]+$/, "فرمت شماره تماس نامعتبر است"),
});

/**
 * Custom Field schema (دامِین)
 * - نوع فیلد از بین text/number/date/list
 * - options فقط برای list معتبر است
 * - مقدار value به‌صورت رشته ذخیره می‌شود (UI می‌تواند نمایش/کنترل نوع را مدیریت کند)
 */
export const customFieldTypeSchema = z.enum(["text", "number", "date", "list"]);

export const customFieldSchema = z.object({
  name: z.string().min(1, "نام فیلد الزامی است"),
  value: z.string().min(1, "مقدار فیلد الزامی است"),
  type: customFieldTypeSchema.default("text").optional(), // برای سازگاری با داده‌های فعلی
  options: z.array(z.string().min(1)).optional(), // فقط اگر type = list
}).refine(
  (data) => {
    if (data.type === "list") {
      return Array.isArray(data.options) && data.options.length > 0;
    }
    return true;
  },
  { message: "برای نوع لیست، حداقل یک گزینه لازم است", path: ["options"] }
);

/**
 * Base Contact schema (create/update payloads در مرز UI/Service)
 */
export const baseContactSchema = z.object({
  firstName: z.string().min(1, "نام الزامی است"),
  lastName: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  groupId: z.number().int().positive().optional(),
  avatar: z.any().optional(),
  phoneNumbers: z.array(phoneNumberSchema).min(1, "حداقل یک شماره تماس لازم است"),
  customFields: z.array(customFieldSchema).optional().default([]),
});

/**
 * Types
 */
export type PhoneNumberInput = z.infer<typeof phoneNumberSchema>;
export type CustomFieldType = z.infer<typeof customFieldTypeSchema>;
export type CustomFieldInput = z.infer<typeof customFieldSchema>;
export type BaseContactInput = z.infer<typeof baseContactSchema>;