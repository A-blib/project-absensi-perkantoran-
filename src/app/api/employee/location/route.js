import { NextResponse } from "next/server";
import { requireEmployeeSession } from "@/server/auth/guards";
import { createSupabaseServerClient } from "@/server/db/client";

export async function POST(request) {
  const session = await requireEmployeeSession();

  if (!session) {
    return NextResponse.json({ message: "Login dibutuhkan." }, { status: 401 });
  }

  const body = await request.json();
  const { latitude, longitude } = body;

  if (!latitude || !longitude) {
    return NextResponse.json({ message: "Koordinat tidak valid." }, { status: 422 });
  }

  try {
    const supabase = createSupabaseServerClient();
    await supabase.from("app_settings").upsert(
      {
        key: `live_location_${session.id}`,
        value: {
          userId: session.id,
          name: session.name,
          division: session.division,
          latitude: String(latitude),
          longitude: String(longitude),
          updatedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function DELETE() {
  const session = await requireEmployeeSession();
  if (!session) return NextResponse.json({ ok: true });

  try {
    const supabase = createSupabaseServerClient();
    await supabase
      .from("app_settings")
      .delete()
      .eq("key", `live_location_${session.id}`);
  } catch {
    // best-effort cleanup
  }

  return NextResponse.json({ ok: true });
}
