import { NextResponse } from "next/server";
import { systemSettingsSchema } from "@/lib/validations/settings";
import { requireAdminSession } from "@/server/auth/guards";
import {
  getSystemSettings,
  saveSystemSettings,
} from "@/server/repositories/settings-repository";

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  try {
    const settings = await getSystemSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ message: "Akses admin dibutuhkan." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = systemSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Pengaturan tidak valid. Periksa kembali semua field." },
      { status: 422 },
    );
  }

  try {
    const settings = await saveSystemSettings(parsed.data);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
