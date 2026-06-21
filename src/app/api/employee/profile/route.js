import { NextResponse } from "next/server";
import { requireEmployeeSession } from "@/server/auth/guards";
import { createSupabaseServerClient } from "@/server/db/client";
import { updateUser } from "@/server/repositories/user-repository";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request) {
  const session = await requireEmployeeSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("photo");

  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "File tidak ditemukan." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ message: "Format harus JPEG, PNG, atau WebP." }, { status: 422 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ message: "Ukuran foto maksimal 2MB." }, { status: 422 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const ext = file.type.split("/")[1];
    const path = `${session.id}/avatar-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await updateUser(session.id, { photo_url: publicUrl });

    return NextResponse.json({ photoUrl: publicUrl });
  } catch (err) {
    return NextResponse.json({ message: err.message || "Gagal upload foto." }, { status: 500 });
  }
}
