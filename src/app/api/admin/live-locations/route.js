import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth/guards";
import { createSupabaseServerClient } from "@/server/db/client";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value, updated_at")
      .like("key", "live_location_%");

    if (error) throw error;

    // Hapus lokasi yang sudah lebih dari 10 menit (sudah tidak aktif)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const locations = (data || [])
      .map((row) => row.value)
      .filter((loc) => loc?.latitude && loc?.longitude)
      .filter((loc) => new Date(loc.updatedAt).getTime() > tenMinutesAgo);

    return NextResponse.json({ locations });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
