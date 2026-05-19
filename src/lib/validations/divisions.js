import { z } from "zod";

export const divisionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((value) => value || null),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || null),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateDivisionSchema = divisionSchema.partial();
