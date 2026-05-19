import { createSupabaseServerClient } from "@/server/db/client";
import { hashPassword } from "@/server/services/password-service";

const userColumns = `
  id,
  name,
  email,
  password_hash,
  role,
  division,
  position,
  phone,
  employee_code,
  status,
  must_change_password,
  photo_url,
  created_at,
  updated_at
`;

const legacyUserColumns = `
  id,
  name,
  email,
  password_hash,
  role,
  division,
  photo_url,
  created_at
`;

function toUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    password_hash: row.password_hash,
    role: row.role,
    division: row.division,
    position: row.position || null,
    phone: row.phone || null,
    employeeCode: row.employee_code || null,
    status: row.status || "active",
    mustChangePassword: Boolean(row.must_change_password),
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

async function selectUsersWithFallback(queryBuilder) {
  const fullResult = await queryBuilder(userColumns);

  if (!fullResult.error) {
    return fullResult;
  }

  const missingNewColumns =
    fullResult.error.message.includes("does not exist") ||
    fullResult.error.message.includes("schema cache");

  if (!missingNewColumns) {
    return fullResult;
  }

  return queryBuilder(legacyUserColumns);
}

export async function findUserByEmail(email) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await selectUsersWithFallback((columns) =>
    supabase.from("users").select(columns).eq("email", email).maybeSingle(),
  );

  if (error) {
    throw new Error(`Gagal mengambil user: ${error.message}`);
  }

  return toUser(data);
}

export async function findUserById(id) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await selectUsersWithFallback((columns) =>
    supabase.from("users").select(columns).eq("id", id).maybeSingle(),
  );

  if (error) {
    throw new Error(`Gagal mengambil user: ${error.message}`);
  }

  return toUser(data);
}

export async function listUsers() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await selectUsersWithFallback((columns) =>
    supabase.from("users").select(columns).order("created_at", { ascending: false }),
  );

  if (error) {
    throw new Error(`Gagal mengambil daftar user: ${error.message}`);
  }

  return data.map(toUser);
}

export async function countActiveAdmins({ excludeUserId } = {}) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("status", "active");

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Gagal menghitung admin aktif: ${error.message}`);
  }

  return count || 0;
}

export async function createUser(input) {
  const supabase = createSupabaseServerClient();
  const passwordHash = await hashPassword(input.password);
  const { data, error } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email: input.email,
      password_hash: passwordHash,
      role: input.role,
      division: input.division,
      position: input.position,
      phone: input.phone,
      employee_code: input.employeeCode,
      status: input.status,
      must_change_password: input.mustChangePassword,
    })
    .select(userColumns)
    .single();

  if (error) {
    throw new Error(`Gagal membuat user: ${error.message}`);
  }

  return toUser(data);
}

export async function updateUser(id, input) {
  const supabase = createSupabaseServerClient();
  const payload = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) payload.name = input.name;
  if (input.email !== undefined) payload.email = input.email;
  if (input.role !== undefined) payload.role = input.role;
  if (input.division !== undefined) payload.division = input.division;
  if (input.position !== undefined) payload.position = input.position;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.employeeCode !== undefined) payload.employee_code = input.employeeCode;
  if (input.status !== undefined) payload.status = input.status;
  if (input.mustChangePassword !== undefined) {
    payload.must_change_password = input.mustChangePassword;
  }

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", id)
    .select(userColumns)
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui user: ${error.message}`);
  }

  return toUser(data);
}

export async function resetUserPassword(id, password, mustChangePassword = true) {
  const passwordHash = await hashPassword(password);

  return updatePasswordHash(id, passwordHash, mustChangePassword);
}

export async function updatePasswordHash(id, passwordHash, mustChangePassword) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      must_change_password: mustChangePassword,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(userColumns)
    .single();

  if (error) {
    throw new Error(`Gagal memperbarui password: ${error.message}`);
  }

  return toUser(data);
}

export async function deleteUser(id) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus user: ${error.message}`);
  }

  return true;
}
