import { z } from "zod";

const timeValue = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const shiftSchema = z.object({
  name: z.string().trim().min(2).max(120),
  startTime: timeValue,
  endTime: timeValue,
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value || null),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateShiftSchema = shiftSchema.partial();
