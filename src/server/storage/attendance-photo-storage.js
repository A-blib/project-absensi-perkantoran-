import { validateImageUpload } from "@/lib/security/upload-guard";

export async function prepareAttendancePhotoUpload(file) {
  const validation = validateImageUpload(file);

  if (!validation.success) {
    return { ok: false, error: validation.error.flatten().fieldErrors };
  }

  return {
    ok: true,
    path: `attendance/${Date.now()}-${validation.data.fileName}`,
  };
}
