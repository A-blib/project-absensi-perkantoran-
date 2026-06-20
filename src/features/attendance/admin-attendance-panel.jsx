"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Edit3,
  MapPin,
  Radio,
  Save,
  Search,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusOptions = [
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "izin", label: "Izin/Cuti" },
  { value: "alpa", label: "Alpa" },
];

const statusFilters = [{ value: "all", label: "Semua" }, ...statusOptions];

const statusSummaryMeta = {
  hadir: {
    label: "Hadir",
    icon: UserCheck,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  telat: {
    label: "Telat",
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  izin: {
    label: "Izin/Cuti",
    icon: AlertTriangle,
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
  alpa: {
    label: "Alpa",
    icon: UserX,
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

function toTimeInput(value) {
  if (!value || value === "-") return "";
  return value.slice(0, 5);
}

function buildForm(row) {
  return {
    dateKey: row.dateKey || "",
    checkIn: toTimeInput(row.checkIn),
    checkOut: toTimeInput(row.checkOut),
    status: row.status || "hadir",
    lateMinutes: row.lateMinutes || 0,
    location: row.location === "-" ? "" : row.location || "",
  };
}

function formatMinutes(value) {
  const minutes = Number(value) || 0;
  if (minutes <= 0) return "-";

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!hours) return `${rest} menit`;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

function getStatusLabel(status) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

function AttendanceSummaryCard({ status, count, total }) {
  const meta = statusSummaryMeta[status];
  const Icon = meta.icon;
  const percent = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${meta.className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">
            {meta.label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">{count}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-xl bg-white/70">
          <Icon size={22} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-current"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-bold tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

function AttendanceMobileCard({ row, onEdit }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-slate-950">
            {row.name}
          </h2>
          <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
            {row.division || "-"}
          </p>
        </div>
        <Badge status={row.status}>{getStatusLabel(row.status)}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <CalendarDays size={14} />
            Tanggal
          </div>
          <p className="mt-1 font-bold text-slate-700">{row.date}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Clock3 size={14} />
            Telat
          </div>
          <p className="mt-1 font-bold text-slate-700">
            {row.lateMinutes ? `${row.lateMinutes} menit` : "-"}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Masuk
          </p>
          <p className="mt-1 font-mono font-bold text-slate-700">{row.checkIn}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Pulang
          </p>
          <p className="mt-1 font-mono font-bold text-slate-700">{row.checkOut}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="font-semibold text-slate-500">Lokasi saat ini</p>
          <p className="mt-1 break-words text-xs leading-5 text-slate-600">
            {row.currentLocation || "-"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2">
          <p className="font-semibold text-slate-500">Lokasi tujuan</p>
          <p className="mt-1 break-words text-xs leading-5 text-slate-600">
            {row.targetLocation || row.location || "-"}
          </p>
          {row.isGenerated ? (
            <p className="mt-2 text-xs font-bold text-red-500">Belum absen</p>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="mt-4 w-full"
      >
        <Edit3 size={15} />
        Edit Absensi
      </Button>
    </article>
  );
}

function EmptyAttendanceState() {
  return (
    <div className="grid place-items-center px-4 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
        <Search size={22} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700">
        Data absensi tidak ditemukan
      </p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Coba ubah kata kunci pencarian atau filter status.
      </p>
    </div>
  );
}

export function AdminAttendancePanel({ data }) {
  const [rows, setRows] = useState(data);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [liveLocations, setLiveLocations] = useState([]);

  // Fetch live locations karyawan yang belum absen
  useEffect(() => {
    let active = true;

    async function fetchLiveLocations() {
      try {
        const res = await fetch("/api/admin/live-locations", { cache: "no-store" });
        if (!active || !res.ok) return;
        const payload = await res.json();
        setLiveLocations(Array.isArray(payload.locations) ? payload.locations : []);
      } catch {
        // silent fail
      }
    }

    fetchLiveLocations();
    const interval = setInterval(fetchLiveLocations, 60000);
    window.addEventListener("focus", fetchLiveLocations);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", fetchLiveLocations);
    };
  }, []);

  const summary = useMemo(
    () =>
      rows.reduce(
        (counts, row) => ({
          ...counts,
          [row.status]: (counts[row.status] || 0) + 1,
        }),
        { hadir: 0, telat: 0, izin: 0, alpa: 0 },
      ),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        `${row.name} ${row.division} ${row.date} ${row.status} ${row.location} ${row.currentLocation} ${row.targetLocation}`
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [query, rows, statusFilter]);

  function openEdit(row) {
    setEditingRow(row);
    setForm(buildForm(row));
    setMessage("");
  }

  function closeEdit() {
    setEditingRow(null);
    setForm(null);
    setSaving(false);
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editingRow || !form) return;

    setSaving(true);
    setMessage("");

    try {
      const isGeneratedRow = Boolean(editingRow.isGenerated);
      const response = await fetch(
        isGeneratedRow
          ? "/api/admin/attendances"
          : `/api/admin/attendances/${editingRow.id}`,
        {
          method: isGeneratedRow ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            userId: editingRow.userId,
            lateMinutes: Number(form.lateMinutes) || 0,
          }),
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal menyimpan absensi.");
      }

      setRows((current) =>
        current.map((row) =>
          row.id === editingRow.id
            ? { ...row, ...payload.attendance, isGenerated: false }
            : row,
        ),
      );
      closeEdit();
    } catch (error) {
      setMessage(error.message);
      setSaving(false);
    }
  }

  return (
    <>
      <section className="grid gap-4 sm:gap-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statusOptions.map((status) => (
            <AttendanceSummaryCard
              key={status.value}
              status={status.value}
              count={summary[status.value] || 0}
              total={rows.length}
            />
          ))}
        </div>

        {/* Live Location Widget */}
        {liveLocations.length > 0 ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Radio size={16} className="text-blue-600" />
              <h3 className="text-sm font-bold text-blue-800">
                Lokasi Live Karyawan
              </h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {liveLocations.length} aktif
              </span>
              <span className="text-xs text-blue-500">· belum absen hari ini</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {liveLocations.map((loc) => (
                <div
                  key={loc.userId}
                  className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-3 py-2.5"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{loc.name}</p>
                    <p className="text-xs text-slate-500">{loc.division || "-"}</p>
                    <a
                      href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block truncate font-mono text-xs text-blue-600 hover:underline"
                    >
                      {Number(loc.latitude).toFixed(5)}, {Number(loc.longitude).toFixed(5)}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-5">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Data Absensi Karyawan
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {filteredRows.length} dari {rows.length} data ditampilkan.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] lg:min-w-[560px]">
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                <Search size={16} className="text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari pegawai, divisi, lokasi"
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm"
                aria-label="Filter status absensi"
              >
                {statusFilters.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <AttendanceMobileCard
                  key={row.id}
                  row={row}
                  onEdit={() => openEdit(row)}
                />
              ))
            ) : (
              <EmptyAttendanceState />
            )}
          </div>

          <div className="hidden lg:block">
            <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[20%] px-3 py-3 font-bold xl:px-4">Pegawai</th>
                <th className="w-[13%] px-3 py-3 font-bold xl:px-4">Tanggal</th>
                <th className="w-[15%] px-3 py-3 font-bold xl:px-4">Jam</th>
                <th className="w-[13%] px-3 py-3 font-bold xl:px-4">Status</th>
                <th className="w-[29%] px-3 py-3 font-bold xl:px-4">Lokasi</th>
                <th className="w-[10%] px-3 py-3 text-right font-bold xl:px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="bg-white hover:bg-slate-50">
                  <td className="px-3 py-4 xl:px-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                        {row.name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {row.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {row.division}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 xl:px-4">
                    <p className="font-semibold text-slate-700">{row.date}</p>
                    {row.isGenerated ? (
                      <p className="mt-1 text-xs font-semibold text-red-500">
                        Belum absen
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 xl:px-4">
                    <div className="grid gap-1 font-mono text-xs text-slate-700">
                      <span>Masuk {row.checkIn}</span>
                      <span>Pulang {row.checkOut}</span>
                      <span className="font-sans text-slate-500">
                        Lembur {formatMinutes(row.overtimeMinutes)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 xl:px-4">
                    <div className="grid gap-2">
                      <Badge status={row.status}>
                        {statusOptions.find((item) => item.value === row.status)?.label ||
                          row.status}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Telat {row.lateMinutes ? `${row.lateMinutes} menit` : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 xl:px-4">
                    <div className="grid gap-2 text-xs leading-5 text-slate-600">
                      <div className="flex min-w-0 items-start gap-2">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700">Saat ini</p>
                          <p className="max-h-10 overflow-hidden break-words">
                            {row.currentLocation || "-"}
                          </p>
                        </div>
                      </div>
                      <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-1.5">
                        <p className="font-bold text-slate-700">Tujuan</p>
                        <p className="max-h-10 overflow-hidden break-words">
                          {row.targetLocation || row.location || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 xl:px-4">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(row)}
                        className="px-2 xl:px-3"
                      >
                        <Edit3 size={15} />
                        <span className="hidden xl:inline">Edit</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredRows.length ? (
            <EmptyAttendanceState />
          ) : null}
          </div>
        </div>
      </section>

      {editingRow && form ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm text-slate-500">Koreksi absensi</p>
                <h3 className="text-lg font-bold text-slate-950">{editingRow.name}</h3>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Tanggal
                <input
                  type="date"
                  value={form.dateKey}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dateKey: event.target.value }))
                  }
                  className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                  className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Jam Masuk
                <input
                  type="time"
                  value={form.checkIn}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, checkIn: event.target.value }))
                  }
                  className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Jam Pulang
                <input
                  type="time"
                  value={form.checkOut}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, checkOut: event.target.value }))
                  }
                  className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Telat Menit
                <input
                  type="number"
                  min="0"
                  value={form.lateMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lateMinutes: event.target.value,
                    }))
                  }
                  className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
                Lokasi Tujuan
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, location: event.target.value }))
                  }
                  className="h-11 rounded-lg border border-slate-200 px-3 font-normal outline-none focus:border-blue-400"
                />
              </label>
            </div>

            {message ? (
              <div className="mx-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {message}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <Button type="button" variant="outline" onClick={closeEdit}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                <Save size={16} />
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
