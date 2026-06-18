import { createSupabaseServerClient } from "@/server/db/client";

const divisionColumns = `
  id,
  name,
  code,
  description,
  status,
  created_at,
  updated_at
`;

function toDivision(row) {
  if (!row) return null;

  return {
    id: row.id,
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

export async function listDivisions({ activeOnly = false } = {}) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("divisions")
    .select(divisionColumns)
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (isMissingTable(error)) {
    return [];
  }

  if (error) {
    throw new Error(`Gagal mengambil daftar divisi: ${error.message}`);
  }

  return data.map(toDivision);
}

export async function createDivision(input) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("divisions")
    .insert({
      name: input.name,
      code: input.code,
      description: input.description,
      status: input.status,
    })
    .select(divisionColumns)
    .single();

  if (error) {
    throw new Error(`Gagal membuat divisi: ${error.message}`);
  }

  return toDivision(data);
}

export async function updateDivision(id, input) {
  const payload = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) payload.name = input.name;
  if (input.code !== undefined) payload.code = input.code;
  if (input.description !== undefined) payload.description = input.description;
  if (input.status !== undefined) payload.status = input.status;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("divisions")
    .update(payload)
    .eq("id", id)
    .select(divisionColumns)
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui divisi: ${error.message}`);
  }

  return toDivision(data);
}

export async function deleteDivision(id) {
  const supabase = createSupabaseServerClient();
  const { data: division, error: divisionError } = await supabase
    .from("divisions")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (divisionError) {
    throw new Error(`Gagal membaca divisi: ${divisionError.message}`);
  }

  if (!division) {
    throw new Error("Divisi tidak ditemukan.");
  }

  const { count, error: usageError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("division", division.name);

  if (usageError && !isMissingTable(usageError)) {
    throw new Error(`Gagal memeriksa penggunaan divisi: ${usageError.message}`);
  }

  if (count > 0) {
    throw new Error(
      "Divisi masih dipakai pegawai. Nonaktifkan divisi atau pindahkan pegawai dulu.",
    );
  }

  const { error } = await supabase.from("divisions").delete().eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus divisi: ${error.message}`);
  }

  return true;
}
