"use client";

import { useMemo, useState } from "react";
import { Clock3, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const emptyForm = {
  name: "",
  startTime: "08:00",
  endTime: "16:00",
  description: "",
  status: "active",
};

function statusLabel(status) {
  return status === "active" ? "Aktif" : "Nonaktif";
}

export function AdminShiftsPanel({ initialShifts }) {
  const [shifts, setShifts] = useState(initialShifts);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const visibleShifts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return shifts.filter((shift) =>
      `${shift.name} ${shift.startTime} ${shift.endTime} ${shift.description}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, shifts]);

  function openCreate() {
    setForm(emptyForm);
    setMessage("");
    setModal({ type: "create" });
  }

  function openEdit(shift) {
    setForm({
      name: shift.name || "",
      startTime: shift.startTime || "08:00",
      endTime: shift.endTime || "16:00",
      description: shift.description || "",
      status: shift.status || "active",
    });
    setMessage("");
    setModal({ type: "edit", shift });
  }

  async function submitForm(event) {
    event.preventDefault();
    const activeModal = modal;
    if (!activeModal) return;

    setIsLoading(true);
    setMessage("");

    const isCreate = activeModal.type === "create";
    const response = await fetch(
      isCreate ? "/api/admin/shifts" : `/api/admin/shifts/${activeModal.shift.id}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Shift gagal disimpan.");
      return;
    }

    setShifts((current) =>
      isCreate
        ? [result.shift, ...current]
        : current.map((shift) =>
            shift.id === result.shift.id ? result.shift : shift,
          ),
    );
    setModal(null);
  }

  async function deleteSelectedShift() {
    const activeModal = modal;
    if (!activeModal) return;

    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/shifts/${activeModal.shift.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Shift gagal dihapus.");
      return;
    }

    setShifts((current) =>
      current.filter((shift) => shift.id !== activeModal.shift.id),
    );
    setModal(null);
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Shift Karyawan
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Pengaturan Shift
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Buat jam kerja berbeda untuk karyawan. Shift dapat dipilih dari
            form Pegawai.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Tambah Shift
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
            <Search size={17} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama shift..."
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400 sm:w-72"
            />
          </label>
          <p className="text-sm font-medium text-slate-500">
            {visibleShifts.length} shift ditemukan
          </p>
        </div>

        <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
          {visibleShifts.map((shift) => (
            <article key={shift.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-slate-950">{shift.name}</h2>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                    {shift.startTime} - {shift.endTime}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{shift.description || "Tidak ada deskripsi."}</p>
                </div>
                <Badge status={shift.status === "active" ? "hadir" : "alpa"}>
                  {statusLabel(shift.status)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(shift)}>
                  <Pencil size={16} /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setMessage(""); setModal({ type: "delete", shift }); }} className="border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 size={16} /> Hapus
                </Button>
              </div>
            </article>
          ))}
          {!visibleShifts.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
              Belum ada shift yang cocok.
            </div>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nama Shift</th>
                <th className="px-5 py-3">Jam Masuk</th>
                <th className="px-5 py-3">Jam Pulang</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleShifts.map((shift) => (
                <tr key={shift.id} className="bg-white">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <Clock3 size={19} />
                      </div>
                      <p className="font-bold text-slate-950">{shift.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold text-slate-700">{shift.startTime}</td>
                  <td className="px-5 py-4 font-mono font-semibold text-slate-700">{shift.endTime}</td>
                  <td className="px-5 py-4">
                    <Badge status={shift.status === "active" ? "hadir" : "alpa"}>
                      {statusLabel(shift.status)}
                    </Badge>
                  </td>
                  <td className="max-w-xs px-5 py-4 text-slate-500">
                    {shift.description || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(shift)}>
                        <Pencil size={16} /> Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setMessage(""); setModal({ type: "delete", shift }); }} className="border-red-200 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} /> Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleShifts.length ? (
            <div className="grid place-items-center px-4 py-10 text-center">
              <p className="text-sm font-bold text-slate-700">Belum ada shift</p>
              <p className="mt-1 text-sm text-slate-500">Tambahkan shift baru untuk mulai mengatur jam kerja karyawan.</p>
            </div>
          ) : null}
        </div>
      </div>

      {modal?.type === "create" || modal?.type === "edit" ? (
        <ShiftFormModal
          title={modal.type === "create" ? "Tambah Shift" : "Edit Shift"}
          form={form}
          setForm={setForm}
          message={message}
          isLoading={isLoading}
          onClose={() => setModal(null)}
          onSubmit={submitForm}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <ModalShell title="Hapus Shift" onClose={() => setModal(null)}>
          <div className="px-6 py-5">
            <p className="text-sm leading-6 text-slate-600">
              Yakin ingin menghapus shift <strong>{modal.shift.name}</strong>?
            </p>
            {message ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {message}
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button variant="outline" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button
              onClick={deleteSelectedShift}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function ShiftFormModal({
  title,
  form,
  setForm,
  message,
  isLoading,
  onClose,
  onSubmit,
}) {
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Field
            label="Nama Shift"
            value={form.name}
            onChange={(value) => update("name", value)}
            required
          />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
          <ClockPickerField
            label="Jam Masuk"
            value={form.startTime}
            onChange={(value) => update("startTime", value)}
          />
          <ClockPickerField
            label="Jam Pulang"
            value={form.endTime}
            onChange={(value) => update("endTime", value)}
          />
          <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-3 text-sm"
            />
          </label>
          {message ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:col-span-2">
              {message}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Clock Picker ─────────────────────────────────────────────────────────────

function ClockPickerField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("hour"); // "hour" | "minute"

  const [h, m] = value.split(":").map(Number);
  const hour = isNaN(h) ? 0 : h;
  const minute = isNaN(m) ? 0 : m;

  function setHour(newHour) {
    onChange(`${String(newHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    setMode("minute");
  }

  function setMinute(newMinute) {
    onChange(`${String(hour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`);
    setOpen(false);
    setMode("hour");
  }

  // Posisi jarum
  const handAngle = mode === "hour"
    ? (hour % 12) * 30 - 90   // 12 angka × 30° per angka
    : minute * 6 - 90;         // 60 menit × 6° per menit

  const cx = 90; // center x/y dari SVG 180×180
  const handLen = mode === "hour" ? 52 : 62;
  const handX = cx + handLen * Math.cos((handAngle * Math.PI) / 180);
  const handY = cx + handLen * Math.sin((handAngle * Math.PI) / 180);

  const displayValue = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return (
    <div className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setMode("hour"); }}
        className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-mono font-bold text-slate-950 hover:border-blue-300 hover:bg-blue-50"
      >
        <span className="flex items-center gap-2">
          <Clock3 size={15} className="text-slate-400" />
          {displayValue}
        </span>
        <span className="text-xs font-normal text-slate-400">
          {open ? "Tutup" : "Pilih"}
        </span>
      </button>

      {open ? (
        <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          {/* Mode tabs */}
          <div className="mb-3 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setMode("hour")}
              className={[
                "rounded-lg px-3 py-1 text-lg font-extrabold font-mono transition",
                mode === "hour"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              {String(hour).padStart(2, "0")}
            </button>
            <span className="text-lg font-extrabold text-slate-300">:</span>
            <button
              type="button"
              onClick={() => setMode("minute")}
              className={[
                "rounded-lg px-3 py-1 text-lg font-extrabold font-mono transition",
                mode === "minute"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              {String(minute).padStart(2, "0")}
            </button>
          </div>

          {/* Clock face */}
          <div className="relative mx-auto size-[180px]">
            <svg viewBox="0 0 180 180" className="size-full">
              {/* Face */}
              <circle cx="90" cy="90" r="88" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
              {/* Hand */}
              <line
                x1="90" y1="90"
                x2={handX} y2={handY}
                stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"
              />
              {/* Center dot */}
              <circle cx="90" cy="90" r="4" fill="#3b82f6" />
              {/* Hand tip */}
              <circle cx={handX} cy={handY} r="6" fill="#3b82f6" />

              {/* Hour numbers */}
              {mode === "hour" && Array.from({ length: 24 }, (_, i) => {
                const displayNum = i;
                const ring = i < 12 ? 72 : 50; // angka 0-11 di luar, 12-23 di dalam
                const angle = ((i % 12) * 30 - 90) * (Math.PI / 180);
                const nx = 90 + ring * Math.cos(angle);
                const ny = 90 + ring * Math.sin(angle);
                const isActive = hour === i;
                return (
                  <g key={i} style={{ cursor: "pointer" }} onClick={() => setHour(i)}>
                    <circle cx={nx} cy={ny} r="13" fill={isActive ? "#3b82f6" : "transparent"} className="hover:fill-blue-100" />
                    <text
                      x={nx} y={ny + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={i >= 12 ? "9" : "11"}
                      fontWeight="600"
                      fill={isActive ? "white" : "#475569"}
                    >
                      {String(displayNum).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}

              {/* Minute numbers - tampilkan setiap 5 menit */}
              {mode === "minute" && Array.from({ length: 12 }, (_, i) => {
                const min = i * 5;
                const angle = (min * 6 - 90) * (Math.PI / 180);
                const nx = 90 + 68 * Math.cos(angle);
                const ny = 90 + 68 * Math.sin(angle);
                const isActive = minute === min;
                return (
                  <g key={i} style={{ cursor: "pointer" }} onClick={() => setMinute(min)}>
                    <circle cx={nx} cy={ny} r="13" fill={isActive ? "#3b82f6" : "transparent"} className="hover:fill-blue-100" />
                    <text
                      x={nx} y={ny + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="11" fontWeight="600"
                      fill={isActive ? "white" : "#475569"}
                    >
                      {String(min).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="mt-2 text-center text-xs text-slate-400">
            {mode === "hour" ? "Pilih jam" : "Pilih menit (klik angka atau atur manual)"}
          </p>

          {/* Manual minute input */}
          {mode === "minute" && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs text-slate-500">Menit tepat:</span>
              <input
                type="number"
                min="0" max="59"
                value={minute}
                onChange={(e) => {
                  const v = Math.min(59, Math.max(0, Number(e.target.value)));
                  onChange(`${String(hour).padStart(2, "0")}:${String(v).padStart(2, "0")}`);
                }}
                className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-center text-sm font-mono font-bold"
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, required = false }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
      />
    </label>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
