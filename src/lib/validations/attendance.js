import { z } from "zod";

export const attendanceFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["hadir", "telat", "izin", "alpa", "all"]).default("all"),
  keyword: z.string().trim().max(120).optional(),
});

export const attendanceUploadSchema = z.object({
  fileName: z.string().max(180),
  fileSize: z.number().max(2 * 1024 * 1024, "Ukuran foto maksimal 2MB"),
  fileType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});
