import { NextResponse } from "next/server";
import { requireEmployeeSession } from "@/server/auth/guards";
import { reverseGeocodeLocation } from "@/lib/maps/reverse-geocode";

export async function GET(request) {
  const session = await requireEmployeeSession();

  if (!session) {
    return NextResponse.json({ message: "Akses pegawai dibutuhkan." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lng");

  if (
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude))
  ) {
    return NextResponse.json({ message: "Koordinat tidak valid." }, { status: 422 });
  }

  const address = await reverseGeocodeLocation(latitude, longitude);

  return NextResponse.json({ address });
}
