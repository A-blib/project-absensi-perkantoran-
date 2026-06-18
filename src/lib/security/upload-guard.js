import { attendanceUploadSchema } from "@/lib/validations/attendance";

export function validateImageUpload(file) {
  return attendanceUploadSchema.safeParse({
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type,
  });
}
