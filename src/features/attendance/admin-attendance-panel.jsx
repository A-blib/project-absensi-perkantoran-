"use client";

import { useMemo, useState } from "react";
import { Edit3, Save, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusOptions = [
  { value: "hadir", label: "Hadir" },
  { value: "telat", label: "Telat" },
  { value: "izin", label: "Izin/Cuti" },
  { value: "alpa", label: "Alpa" },
];

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

export function AdminAttendancePanel({ data }) {
  const [rows, setRows] = useState(data);
  const [query, setQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) =>
      `${row.name} ${row.division} ${row.date} ${row.status} ${row.location} ${row.currentLocation} ${row.targetLocation}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, rows]);

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
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Data Absensi Karyawan</h2>
            <p className="mt-1 text-sm text-slate-500">
              {rows.length} data absensi tersimpan.
            </p>
          </div>
          <label className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 md:max-w-sm">
            <Search size={16} className="text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari pegawai, divisi, status"
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Pegawai</th>
                <th className="px-5 py-3 font-bold">Tanggal</th>
                <th className="px-5 py-3 font-bold">Masuk</th>
                <th className="px-5 py-3 font-bold">Pulang</th>
                <th className="px-5 py-3 font-bold">Lembur</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Telat</th>
                <th className="px-5 py-3 font-bold">Lokasi Saat Ini</th>
                <th className="px-5 py-3 font-bold">Lokasi Tujuan</th>
                <th className="px-5 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.division}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{row.date}</td>
                  <td className="px-5 py-4 font-mono text-slate-700">{row.checkIn}</td>
                  <td className="px-5 py-4 font-mono text-slate-700">{row.checkOut}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatMinutes(row.overtimeMinutes)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={row.status}>
                      {statusOptions.find((item) => item.value === row.status)?.label ||
                        row.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {row.lateMinutes ? `${row.lateMinutes} menit` : "-"}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-600">
                    {row.currentLocation || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-600">
                        {row.targetLocation || row.location || "-"}
                      </span>
                      {row.isGenerated ? (
                        <span className="text-[11px] font-semibold text-red-500">
                          Belum absen
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(row)}
                    >
                      <Edit3 size={15} />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredRows.length ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Tidak ada data absensi yang cocok.
            </div>
          ) : null}
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
