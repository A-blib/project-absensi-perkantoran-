import { createSupabaseServerClient } from "@/server/db/client";

const positionColumns = `
  id,
  division_id,
  name,
  code,
  description,
  status,
  created_at,
  updated_at,
  divisions (
    name,
    code
  )
`;

function toPosition(row) {
  if (!row) return null;

  return {
    id: row.id,
    divisionId: row.division_id,
    divisionName: row.divisions?.name || null,
    divisionCode: row.divisions?.code || null,
    name: row.name,
    code: row.code,
    description: row.description,
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

function isMissingTable(error) {
  return (
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  );
}

export async function listPositions({ activeOnly = false } = {}) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("positions")
    .select(positionColumns)
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (isMissingTable(error)) return [];

  if (error) {
    throw new Error(`Gagal mengambil daftar jabatan: ${error.message}`);
  }

  return data.map(toPosition);
}

export async function createPosition(input) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("positions")
    .insert({
      division_id: input.divisionId,
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status,
    })
    .select(positionColumns)
    .single();

  if (error) {
    throw new Error(`Gagal membuat jabatan: ${error.message}`);
  }

  return toPosition(data);
}

export async function updatePosition(id, input) {
  const payload = {
    updated_at: new Date().toISOString(),
  };

  if (input.divisionId !== undefined) payload.division_id = input.divisionId;
  if (input.name !== undefined) payload.name = input.name;
  if (input.code !== undefined) payload.code = input.code;
  if (input.description !== undefined) payload.description = input.description;
  if (input.status !== undefined) payload.status = input.status;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("positions")
    .update(payload)
    .eq("id", id)
    .select(positionColumns)
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui jabatan: ${error.message}`);
  }

  return toPosition(data);
}

export async function deletePosition(id) {
  const supabase = createSupabaseServerClient();
  const { data: position, error: positionError } = await supabase
    .from("positions")
    .select("name, divisions(name)")
    .eq("id", id)
    .maybeSingle();

  if (positionError) {
    throw new Error(`Gagal membaca jabatan: ${positionError.message}`);
  }

  if (!position) {
    throw new Error("Jabatan tidak ditemukan.");
  }

  const { count, error: usageError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("division", position.divisions?.name)
    .eq("position", position.name);

  if (usageError && !isMissingTable(usageError)) {
    throw new Error(`Gagal memeriksa penggunaan jabatan: ${usageError.message}`);
  }

  if (count > 0) {
    throw new Error(
      "Jabatan masih dipakai pegawai. Nonaktifkan jabatan atau pindahkan pegawai dulu.",
    );
  }

  const { error } = await supabase.from("positions").delete().eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus jabatan: ${error.message}`);
  }

  return true;
}
