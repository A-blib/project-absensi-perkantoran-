import { z } from "zod";

const nullableText = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => value || null);

const gmailEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email tidak valid")
  .max(160)
  .refine((value) => value.endsWith("@gmail.com"), {
    message: "Email harus menggunakan domain @gmail.com",
  });

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: gmailEmail,
  password: z.string().min(6).max(120),
  role: z.enum(["admin", "employee"]).default("employee"),
  division: nullableText,
  position: nullableText,
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => value || null),
  employeeCode: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((value) => value || null),
  status: z.enum(["active", "inactive"]).default("active"),
  mustChangePassword: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial()
  .extend({
    mustChangePassword: z.boolean().optional(),
  });

export const resetPasswordSchema = z.object({
  password: z.string().min(6).max(120),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6).max(120),
  newPassword: z.string().min(6).max(120),
});
