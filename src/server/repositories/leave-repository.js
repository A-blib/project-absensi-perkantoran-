import { createSupabaseServerClient } from "@/server/db/client";

const leaveColumns = `
  id,
  user_id,
  type,
  start_date,
  end_date,
  reason,
  attachment_name,
  attachment_type,
  attachment_data,
  status,
  admin_note,
  submitted_at,
  decided_at,
  decided_by,
  users!leave_requests_user_id_fkey (
    name,
    email,
    phone,
    division,
    position,
    employee_code
  )
`;

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getDateRange(row) {
  const start = formatDate(row.start_date);
  const end = formatDate(row.end_date);
  return start === end ? start : `${start} - ${end}`;
}

function isMissingTable(error) {
  return (
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  );
}

function toLeaveRequest(row) {
  return {
    id: row.id,
    userId: row.user_id,
    employeeName: row.users?.name || "-",
    employeeEmail: row.users?.email || "-",
    employeePhone: row.users?.phone || "-",
    employeeCode: row.users?.employee_code || "-",
    division: row.users?.division || "-",
    position: row.users?.position || "-",
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    dateRange: getDateRange(row),
    reason: row.reason,
    attachmentName: row.attachment_name || "",
    attachmentType: row.attachment_type || "",
    attachmentData: row.attachment_data || "",
    status: row.status,
    adminNote: row.admin_note || "",
    submittedAt: row.submitted_at,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
  };
}

function isActiveLeaveRequest(row) {
  const now = Date.now();

  if (row.status === "Menunggu") {
    const submittedAt = new Date(row.submitted_at).getTime();
    return !Number.isFinite(submittedAt) || now - submittedAt < 7 * 24 * 60 * 60 * 1000;
  }

  const decidedAt = new Date(row.decided_at || row.submitted_at).getTime();
  return !Number.isFinite(decidedAt) || now - decidedAt < 24 * 60 * 60 * 1000;
}

export async function listLeaveRequests({ userId } = {}) {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("leave_requests")
    .select(leaveColumns)
    .order("submitted_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (isMissingTable(error)) return [];

  if (error) {
    throw new Error(`Gagal mengambil pengajuan izin: ${error.message}`);
  }

  return data.filter(isActiveLeaveRequest).map(toLeaveRequest);
}

export async function createLeaveRequest(userId, input) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      user_id: userId,
      type: input.type,
      start_date: input.startDate,
      end_date: input.endDate,
      reason: input.reason,
      attachment_name: input.attachmentName || null,
      attachment_type: input.attachmentData ? input.attachmentType : null,
      attachment_data: input.attachmentData || null,
      status: "Menunggu",
    })
    .select(leaveColumns)
    .single();

  if (error) {
    throw new Error(`Gagal membuat pengajuan izin: ${error.message}`);
  }

  return toLeaveRequest(data);
}

export async function decideLeaveRequest(id, input, adminId) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status: input.status,
      admin_note: input.adminNote || null,
      decided_by: adminId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "Menunggu")
    .select(leaveColumns)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memperbarui pengajuan izin: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "Pengajuan tidak ditemukan atau sudah diproses oleh admin lain.",
    );
  }

  return toLeaveRequest(data);
}
