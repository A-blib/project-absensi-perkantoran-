import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/guards";
import { createSupabaseServerClient } from "@/server/db/client";

function getJakartaIsoDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce((values, part) => {
      values[part.type] = part.value;
      return values;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function normalizeTime(value) {
  const match = value?.match(/(\d{2})[.:](\d{2})(?:[.:](\d{2}))?/);
  if (!match) return null;
  return `${match[1]}:${match[2]}:${match[3] || "00"}`;
}

function toJakartaTimestamp(dateValue, timeValue) {
  const time = normalizeTime(timeValue);
  if (!dateValue || !time) return null;
  return `${dateValue}T${time}+07:00`;
}

function mapStatus(status) {
  if (status === "Terlambat") return "telat";
  if (status === "Tidak Hadir") return "alpa";
  if (status === "Izin" || status === "Sakit") return "izin";
  return "hadir";
}

function parseDataUrl(dataUrl) {
  const match = dataUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return null;
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
    extension: match[1].split("/")[1].replace("jpeg", "jpg"),
  };
}

async function uploadAttendancePhoto(supabase, dataUrl, { userId, dateValue, type }) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return dataUrl || null;

  const bucket = process.env.SUPABASE_ATTENDANCE_BUCKET || "attendance-photos";
  const path = `${userId}/${dateValue}/${type}-${Date.now()}.${parsed.extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, parsed.buffer, {
    contentType: parsed.contentType,
    upsert: true,
  });

  if (error) {
    console.log("[attendance:photo-upload:fallback]", {
      bucket,
      path,
      error: error.message,
    });
    return dataUrl;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl || dataUrl;
}

async function getExistingAttendance(supabase, sessionId, dateValue) {
  const extendedSelect =
    "id, check_in_at, check_out_at, photo_url, photo_out_url, status, latitude, longitude, location_label, latitude_out, longitude_out, location_out_label, face_signature, face_out_signature";
  const baseSelect = "id, check_in_at, check_out_at, photo_url, status";

  const extended = await supabase
    .from("attendances")
    .select(extendedSelect)
    .eq("user_id", sessionId)
    .eq("attendance_date", dateValue)
    .maybeSingle();

  if (!extended.error) return { ...extended, hasExtendedColumns: true };

  const missingExtendedColumn =
    extended.error.message?.includes("photo_out_url") ||
    extended.error.message?.includes("does not exist");

  if (!missingExtendedColumn) return { ...extended, hasExtendedColumns: true };

  console.log("[attendance:save:fallback-existing-query]", {
    reason: "extended attendance columns missing",
    message: extended.error.message,
  });

  const base = await supabase
    .from("attendances")
    .select(baseSelect)
    .eq("user_id", sessionId)
    .eq("attendance_date", dateValue)
    .maybeSingle();

  return { ...base, hasExtendedColumns: false };
}

function signatureDistance(left, right) {
  if (!left || !right || left.length !== right.length) return null;
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance / left.length;
}

export async function POST(request) {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    session.id?.startsWith("demo-")
  ) {
    console.log("[attendance:save:skip]", {
      reason: "supabase-unavailable-or-demo-user",
      userId: session.id,
    });
    return NextResponse.json({
      skipped: true,
      message: "Supabase belum aktif untuk akun demo.",
    });
  }

  const body = await request.json();
  const dateValue = body.dateValue || getJakartaIsoDate();
  const clockInAt = toJakartaTimestamp(dateValue, body.clockIn);
  const clockOutAt = toJakartaTimestamp(dateValue, body.clockOut);

  console.log("[attendance:save:input]", {
    userId: session.id,
    dateValue,
    type: body.type,
    clockIn: body.clockIn,
    clockOut: body.clockOut,
    status: body.status,
  });

  const supabase = createSupabaseServerClient();
  const {
    data: existing,
    error: existingError,
    hasExtendedColumns,
  } = await getExistingAttendance(supabase, session.id, dateValue);

  if (existingError) {
    return NextResponse.json(
      { message: `Gagal membaca absensi hari ini: ${existingError.message}` },
      { status: 500 },
    );
  }

  if (body.type === "keluar") {
    if (!existing?.check_in_at) {
      return NextResponse.json(
        { message: "Lakukan absensi masuk terlebih dahulu." },
        { status: 422 },
      );
    }

    const distance = signatureDistance(existing.face_signature, body.faceSignature);
    if (distance !== null && distance > 0.6) {
      return NextResponse.json(
        {
          message:
            "Wajah tidak teridentifikasi. Wajah absen pulang tidak sesuai dengan wajah absen masuk.",
        },
        { status: 422 },
      );
    }
  }

  const uploadedPhotoUrl = body.photo
    ? await uploadAttendancePhoto(supabase, body.photo, {
        userId: session.id,
        dateValue,
        type: body.type === "keluar" ? "keluar" : "masuk",
      })
    : null;

  const payload = {
    user_id: session.id,
    attendance_date: dateValue,
    check_in_at: clockInAt || existing?.check_in_at || null,
    check_out_at: body.type === "keluar" ? clockOutAt : existing?.check_out_at || null,
    status: mapStatus(body.status),
    late_minutes: body.status === "Terlambat" ? 1 : 0,
    photo_url:
      body.type === "keluar" ? existing?.photo_url || null : uploadedPhotoUrl || existing?.photo_url || null,
    latitude: body.type === "keluar" ? existing?.latitude || null : body.latitude || null,
    longitude: body.type === "keluar" ? existing?.longitude || null : body.longitude || null,
    location_label: existing?.location_label || body.location || "Area Sudirman Pekanbaru",
  };

  if (hasExtendedColumns) {
    payload.photo_out_url =
      body.type === "keluar"
        ? uploadedPhotoUrl || existing?.photo_out_url || null
        : existing?.photo_out_url || null;
    payload.latitude_out = body.type === "keluar" ? body.latitude || null : existing?.latitude_out || null;
    payload.longitude_out = body.type === "keluar" ? body.longitude || null : existing?.longitude_out || null;
    payload.location_out_label =
      body.type === "keluar"
        ? body.location || "Area Sudirman Pekanbaru"
        : existing?.location_out_label || null;
    payload.face_signature =
      body.type === "keluar" ? existing?.face_signature || null : body.faceSignature || null;
    payload.face_out_signature =
      body.type === "keluar" ? body.faceSignature || null : existing?.face_out_signature || null;
  }

  const selectColumns = hasExtendedColumns
    ? "id, user_id, attendance_date, check_in_at, check_out_at, status, photo_url, photo_out_url, location_label, location_out_label"
    : "id, user_id, attendance_date, check_in_at, check_out_at, status, photo_url, location_label";

  const { data, error } = await supabase
    .from("attendances")
    .upsert(payload, { onConflict: "user_id,attendance_date" })
    .select(selectColumns)
    .single();

  if (error) {
    return NextResponse.json(
      { message: `Gagal menyimpan absensi: ${error.message}` },
      { status: 500 },
    );
  }

  console.log("[attendance:save:success]", data);
  return NextResponse.json({ attendance: data });
}

export async function DELETE() {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    session.id?.startsWith("demo-")
  ) {
    return NextResponse.json({
      skipped: true,
      message: "Supabase belum aktif untuk akun demo.",
    });
  }

  const dateValue = getJakartaIsoDate();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("attendances")
    .delete()
    .eq("user_id", session.id)
    .eq("attendance_date", dateValue);

  if (error) {
    return NextResponse.json(
      { message: `Gagal mereset absensi hari ini: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true, dateValue });
}
