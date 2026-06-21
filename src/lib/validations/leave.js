import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    type: z.enum(["Izin", "Sakit", "Cuti"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().trim().min(5).max(240),
    attachmentName: z.string().trim().min(1).max(180),
    attachmentType: z
      .enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
    attachmentData: z.string().min(1).max(10_000_000),
  })
  .superRefine((value, context) => {
    const expectedPrefix = `data:${value.attachmentType};base64,`;

    if (!value.attachmentData.startsWith(expectedPrefix)) {
      context.addIssue({
        code: "custom",
        message: "Isi lampiran tidak sesuai dengan tipe file.",
        path: ["attachmentData"],
      });
    }
  })
  .refine((value) => new Date(value.endDate) >= new Date(value.startDate), {
    message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
    path: ["endDate"],
  });

export const leaveDecisionSchema = z.object({
  status: z.enum(["Disetujui", "Ditolak"]),
  adminNote: z.string().trim().max(240).optional().default(""),
});
