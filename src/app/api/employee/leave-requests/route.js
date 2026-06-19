import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/guards";
import { createSupabaseServerClient } from "@/server/db/client";
import { findUserByEmail } from "@/server/repositories/user-repository";

const ALLOWED_TYPES = ["Izin", "Sakit", "Cuti", "Dispensasi", "Keperluan pribadi"];
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function noStoreJson(payload, init = {}) {
  const response = NextResponse.json(payload, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate);
}

function normalizeStatus(value) {
  const status = String(value || "Menunggu").toLowerCase();
  if (status === "pending" || status === "menunggu") return "Menunggu";
  if (status === "approved" || status === "disetujui") return "Disetujui";
  if (status === "rejected" || status === "ditolak") return "Ditolak";
  return value || "Menunggu";
}

function normalizeType(value) {
  if (value === "Keperluan pribadi") return "Dispensasi";
  return value || "Izin";
}

function mapRow(row) {
  return {
    id: row.id,
    type: normalizeType(row.request_type || row.type),
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    attachmentName: row.attachment_name,
    attachmentUrl: row.attachment_url,
    status: normalizeStatus(row.status),
    createdAt: row.created_at || row.start_date,
    updatedAt: row.updated_at || null,
    adminNote: row.admin_note || row.note || row.rejection_reason || "",
  };
}

function buildSummary(rows) {
  return rows.reduce(
    (summary, row) => {
      summary.total += 1;
      if (row.status === "Disetujui") summary.approved += 1;
      if (row.status === "Menunggu") summary.pending += 1;
      if (row.status === "Ditolak") summary.rejected += 1;
      return summary;
    },
    { total: 0, approved: 0, pending: 0, rejected: 0 },
  );
}

function parsePositiveInt(value, fallback, max = 100) {
  const number = Number.parseInt(value || "", 10);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(number, max);
}

function filterRequests(rows, filters) {
  const search = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesStatus = filters.status === "Semua" || row.status === filters.status;
    const matchesType = filters.type === "Semua" || row.type === filters.type;
    const matchesStart = !filters.startDate || row.startDate >= filters.startDate;
    const matchesEnd = !filters.endDate || row.endDate <= filters.endDate;
    const haystack = [
      row.type,
      row.status,
      row.reason,
      row.attachmentName,
      row.startDate,
      row.endDate,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && matchesType && matchesStart && matchesEnd && (!search || haystack.includes(search));
  });
}

async function uploadAttachment(supabase, file, sessionId) {
  if (!file || file.size === 0) return { name: null, url: null };

  const extension =
    file.name?.split(".").pop()?.toLowerCase() ||
    (file.type === "application/pdf" ? "pdf" : "jpg");
  const bucket = process.env.SUPABASE_LEAVE_BUCKET || "leave-attachments";
  const path = `${sessionId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.log("[leave-request:attachment-upload-fallback]", {
      bucket,
      path,
      error: error.message,
    });
    return { name: file.name, url: null };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { name: file.name, url: data.publicUrl || null };
}

async function resolveEmployeeIds(session) {
  const ids = new Set();
  if (session.id && !session.id.startsWith("demo-")) ids.add(session.id);

  if (session.email) {
    try {
      const user = await findUserByEmail(session.email);
      if (user?.id) ids.add(user.id);
    } catch (error) {
      console.log("currentUser:", session);
      console.log("employeeId:", Array.from(ids));
      console.log("query error:", error.message);
    }
  }

  return Array.from(ids);
}

async function runLeaveQuery(supabase, selectColumns, employeeIds, { orderColumn }) {
  let query = supabase.from("leave_requests").select(selectColumns);

  if (employeeIds.length === 1) {
    query = query.eq("user_id", employeeIds[0]);
  } else if (employeeIds.length > 1) {
    query = query.in("user_id", employeeIds);
  }

  if (orderColumn) query = query.order(orderColumn, { ascending: false });
  return query;
}

async function runEmployeeIdLeaveQuery(supabase, selectColumns, employeeIds, { orderColumn }) {
  let query = supabase.from("leave_requests").select(selectColumns);

  if (employeeIds.length === 1) {
    query = query.eq("employee_id", employeeIds[0]);
  } else if (employeeIds.length > 1) {
    query = query.in("employee_id", employeeIds);
  }

  if (orderColumn) query = query.order(orderColumn, { ascending: false });
  return query;
}

async function getLeaveRequests(supabase, employeeIds) {
  const fullSelect =
    "id, type, start_date, end_date, reason, attachment_name, attachment_url, status, created_at";
  const legacySelect = "id, type, start_date, end_date, reason, attachment_name, status";

  const fullResult = await runLeaveQuery(supabase, fullSelect, employeeIds, {
    orderColumn: "created_at",
  });

  if (!fullResult.error) return fullResult;

  const canFallback =
    fullResult.error.message?.includes("created_at") ||
    fullResult.error.message?.includes("attachment_url") ||
    fullResult.error.message?.includes("does not exist");

  if (!canFallback) return fullResult;

  console.log("[leave-request:fallback-query]", {
    message: fullResult.error.message,
  });

  const legacyUserResult = await runLeaveQuery(supabase, legacySelect, employeeIds, {
    orderColumn: "start_date",
  });

  if (!legacyUserResult.error && legacyUserResult.data?.length) {
    return legacyUserResult;
  }

  const missingUserRelation =
    legacyUserResult.error?.message?.includes("user_id") ||
    legacyUserResult.error?.message?.includes("does not exist");

  const employeeIdResult = await runEmployeeIdLeaveQuery(
    supabase,
    legacySelect,
    employeeIds,
    { orderColumn: "start_date" },
  );

  if (!employeeIdResult.error) return employeeIdResult;

  const missingEmployeeRelation =
    employeeIdResult.error.message?.includes("employee_id") ||
    employeeIdResult.error.message?.includes("does not exist");

  if (missingEmployeeRelation && !legacyUserResult.error) {
    return legacyUserResult;
  }

  if (missingUserRelation && missingEmployeeRelation) {
    return supabase
      .from("leave_requests")
      .select(legacySelect)
      .order("start_date", { ascending: false });
  }

  return legacyUserResult.error ? legacyUserResult : employeeIdResult;
}

async function insertLeaveRequest(supabase, payload) {
  const fullPayload = {
    user_id: payload.userId,
    type: payload.requestType,
    start_date: payload.startDate,
    end_date: payload.endDate,
    reason: payload.reason,
    attachment_name: payload.attachmentName,
    attachment_url: payload.attachmentUrl,
    status: "Menunggu",
  };
  const fullSelect =
    "id, type, start_date, end_date, reason, attachment_name, attachment_url, status, created_at";

  const fullResult = await supabase
    .from("leave_requests")
    .insert(fullPayload)
    .select(fullSelect)
    .single();

  if (!fullResult.error) return fullResult;

  const canFallback =
    fullResult.error.message?.includes("attachment_url") ||
    fullResult.error.message?.includes("created_at") ||
    fullResult.error.message?.includes("does not exist");

  if (!canFallback) return fullResult;

  console.log("[leave-request:fallback-insert]", {
    message: fullResult.error.message,
  });

  return supabase
    .from("leave_requests")
    .insert({
      user_id: payload.userId,
      type: payload.requestType,
      start_date: payload.startDate,
      end_date: payload.endDate,
      reason: payload.reason,
      attachment_name: payload.attachmentName,
      status: "Menunggu",
    })
    .select("id, type, start_date, end_date, reason, attachment_name, status")
    .single();
}

export async function GET(request) {
  const session = await getCurrentSession();
  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1, 10000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 10, 50);
  const filters = {
    status: searchParams.get("status") || "Semua",
    type: searchParams.get("type") || "Semua",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    search: searchParams.get("search") || "",
  };

  if (!session || session.role !== "employee") {
    return noStoreJson({ message: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return noStoreJson({
      requests: [],
      summary: { total: 0, approved: 0, pending: 0, rejected: 0 },
      total: 0,
      page,
      pageSize,
    });
  }

  const supabase = createSupabaseServerClient();
  const employeeIds = await resolveEmployeeIds(session);
  console.log("currentUser:", session);
  console.log("employeeId:", employeeIds);

  if (!employeeIds.length) {
    console.log("query result:", []);
    console.log("query error:", null);
    return noStoreJson({
      requests: [],
      summary: { total: 0, approved: 0, pending: 0, rejected: 0 },
      total: 0,
      page,
      pageSize,
    });
  }

  const { data, error } = await getLeaveRequests(supabase, employeeIds);
  console.log("query result:", data || []);
  console.log("query error:", error || null);

  if (error) {
    return noStoreJson(
      { message: `Gagal mengambil pengajuan izin: ${error.message}` },
      { status: 500 },
    );
  }

  const allRequests = (data || []).map(mapRow);
  const filteredRequests = filterRequests(allRequests, filters);
  const from = (page - 1) * pageSize;
  const requests = filteredRequests.slice(from, from + pageSize);

  return noStoreJson({
    requests,
    summary: buildSummary(allRequests),
    filteredSummary: buildSummary(filteredRequests),
    total: filteredRequests.length,
    page,
    pageSize,
  });
}

export async function POST(request) {
  const session = await getCurrentSession();

  if (!session || session.role !== "employee") {
    return noStoreJson({ message: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const requestType = String(form.get("type") || "");
  const startDate = String(form.get("startDate") || "");
  const endDate = String(form.get("endDate") || "");
  const reason = String(form.get("reason") || "").trim();
  const attachment = form.get("attachment");
  const errors = {};

  if (!ALLOWED_TYPES.includes(requestType)) errors.type = "Jenis pengajuan wajib dipilih.";
  if (!startDate) errors.startDate = "Tanggal mulai wajib diisi.";
  if (!endDate) errors.endDate = "Tanggal selesai wajib diisi.";
  if (validateDateRange(startDate, endDate) && endDate < startDate) {
    errors.endDate = "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
  }
  if (reason.length < 10) errors.reason = "Alasan wajib diisi minimal 10 karakter.";

  if (attachment && attachment.size > 0) {
    if (!ALLOWED_FILE_TYPES.includes(attachment.type)) {
      errors.attachment = "Lampiran hanya boleh PDF, JPG, atau PNG.";
    } else if (attachment.size > MAX_FILE_SIZE) {
      errors.attachment = "Ukuran lampiran maksimal 2 MB.";
    }
  }

  if (Object.keys(errors).length) {
    return noStoreJson({ message: "Validasi gagal.", errors }, { status: 422 });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    session.id?.startsWith("demo-")
  ) {
    return noStoreJson(
      { message: "Supabase belum aktif untuk akun demo." },
      { status: 503 },
    );
  }

  const supabase = createSupabaseServerClient();
  const uploaded = await uploadAttachment(supabase, attachment, session.id);
  const storedRequestType = requestType === "Dispensasi" ? "Keperluan pribadi" : requestType;
  const { data, error } = await insertLeaveRequest(supabase, {
    userId: session.id,
    requestType: storedRequestType,
    startDate,
    endDate,
    reason,
    attachmentName: uploaded.name,
    attachmentUrl: uploaded.url,
  });

  if (error) {
    return noStoreJson(
      { message: `Gagal menyimpan pengajuan izin: ${error.message}` },
      { status: 500 },
    );
  }

  return noStoreJson({ request: mapRow(data) }, { status: 201 });
}
