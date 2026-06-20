import { createSupabaseServerClient } from "@/server/db/client";

const shiftColumns = `
  id,
  name,
  start_time,
  end_time,
  description,
  status,
  created_at,
  updated_at
`;

function isMissingTable(error) {
  return (
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  );
}

function toShift(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    description: row.description || "",
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export async function listShifts({ activeOnly = false } = {}) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from("shifts").select(shiftColumns).order("start_time");

  if (activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (isMissingTable(error)) return [];

  if (error) {
    throw new Error(`Gagal mengambil daftar shift: ${error.message}`);
  }

  return data.map(toShift);
}

export async function findShiftById(id) {
  if (!id) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shifts")
    .select(shiftColumns)
    .eq("id", id)
    .maybeSingle();

  if (isMissingTable(error)) return null;

  if (error) {
    throw new Error(`Gagal mengambil shift: ${error.message}`);
  }

  return toShift(data);
}

export async function createShift(input) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shifts")
    .insert({
      name: input.name,
      start_time: input.startTime,
      end_time: input.endTime,
      description: input.description,
      status: input.status,
    })
    .select(shiftColumns)
    .single();

  if (error) {
    throw new Error(`Gagal membuat shift: ${error.message}`);
  }

  return toShift(data);
}

export async function updateShift(id, input) {
  const payload = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) payload.name = input.name;
  if (input.startTime !== undefined) payload.start_time = input.startTime;
  if (input.endTime !== undefined) payload.end_time = input.endTime;
  if (input.description !== undefined) payload.description = input.description;
  if (input.status !== undefined) payload.status = input.status;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("shifts")
    .update(payload)
    .eq("id", id)
    .select(shiftColumns)
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui shift: ${error.message}`);
  }

  return toShift(data);
}

export async function deleteShift(id) {
  const supabase = createSupabaseServerClient();
  const { count, error: usageError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("shift_id", id);

  if (usageError && !isMissingTable(usageError)) {
    throw new Error(`Gagal memeriksa penggunaan shift: ${usageError.message}`);
  }

  if (count > 0) {
    throw new Error("Shift masih dipakai pegawai. Pindahkan pegawai dulu.");
  }

  const { error } = await supabase.from("shifts").delete().eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus shift: ${error.message}`);
  }

  return true;
}
