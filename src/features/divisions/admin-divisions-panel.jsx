"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readBrowserCache, writeBrowserCache } from "@/lib/browser/cache";

const DIVISIONS_CACHE_KEY = "absen-admin-divisions-cache";

const emptyForm = {
  name: "",
  code: "",
  description: "",
  status: "active",
};

function statusLabel(status) {
  return status === "active" ? "Aktif" : "Nonaktif";
}

export function AdminDivisionsPanel({ initialDivisions }) {
  const [divisions, setDivisions] = useState(initialDivisions);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const cachedDivisions = readBrowserCache(DIVISIONS_CACHE_KEY);

      if (cachedDivisions?.length) {
        setDivisions(cachedDivisions);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    writeBrowserCache(DIVISIONS_CACHE_KEY, divisions);
  }, [divisions]);

  const visibleDivisions = useMemo(() => {
    const needle = query.toLowerCase();

    return divisions.filter((division) =>
      [division.name, division.code, division.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [divisions, query]);

  function openCreate() {
    setForm(emptyForm);
    setMessage("");
    setModal({ type: "create" });
  }

  function openEdit(division) {
    setForm({
      name: division.name || "",
      code: division.code || "",
      description: division.description || "",
      status: division.status || "active",
    });
    setMessage("");
    setModal({ type: "edit", division });
  }

  async function submitForm(event) {
    event.preventDefault();
    const activeModal = modal;

    if (!activeModal) return;

    setIsLoading(true);
    setMessage("");

    const isCreate = activeModal.type === "create";
    const response = await fetch(
      isCreate
        ? "/api/admin/divisions"
        : `/api/admin/divisions/${activeModal.division.id}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Data divisi gagal disimpan.");
      return;
    }

    setDivisions((current) => {
      if (isCreate) {
        return [result.division, ...current];
      }

      return current.map((division) =>
        division.id === result.division.id ? result.division : division,
      );
    });
    setModal(null);
  }

  async function patchDivision(division, payload) {
    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/divisions/${division.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Aksi gagal diproses.");
      return;
    }

    setDivisions((current) =>
      current.map((item) =>
        item.id === result.division.id ? result.division : item,
      ),
    );
  }

  async function deleteSelectedDivision() {
    const activeModal = modal;

    if (!activeModal) return;

    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/divisions/${activeModal.division.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Divisi gagal dihapus.");
      return;
    }

    setDivisions((current) =>
      current.filter((division) => division.id !== activeModal.division.id),
    );
    setModal(null);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Master Data
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Divisi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Kelola daftar divisi resmi agar data pegawai dan laporan tetap rapi.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={18} />
          Tambah Divisi
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, kode, deskripsi..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-72"
            />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {visibleDivisions.length} divisi ditemukan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Divisi</th>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleDivisions.map((division) => (
                <tr key={division.id} className="bg-white">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <Building2 size={19} />
                      </div>
                      <p className="font-bold text-slate-950">{division.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {division.code || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={division.status === "active" ? "hadir" : "alpa"}>
                      {statusLabel(division.status)}
                    </Badge>
                  </td>
                  <td className="max-w-md px-5 py-4 text-slate-500">
                    {division.description || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(division)}
                      >
                        <Pencil size={16} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() =>
                          patchDivision(division, {
                            status:
                              division.status === "active" ? "inactive" : "active",
                          })
                        }
                      >
                        {division.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMessage("");
                          setModal({ type: "delete", division });
                        }}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === "create" || modal?.type === "edit" ? (
        <DivisionFormModal
          title={modal.type === "create" ? "Tambah Divisi" : "Edit Divisi"}
          form={form}
          setForm={setForm}
          message={message}
          isLoading={isLoading}
          onClose={() => setModal(null)}
          onSubmit={submitForm}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <DeleteDivisionModal
          division={modal.division}
          message={message}
          isLoading={isLoading}
          onClose={() => setModal(null)}
          onDelete={deleteSelectedDivision}
        />
      ) : null}
    </div>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DivisionFormModal({
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
            label="Nama Divisi"
            value={form.name}
            onChange={(value) => update("name", value)}
            required
          />
          <Field
            label="Kode Divisi"
            value={form.code}
            onChange={(value) => update("code", value)}
            placeholder="Contoh: HR, FIN, IT"
          />
          <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              rows={4}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400"
              placeholder="Tuliskan fungsi singkat divisi ini"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
          {message ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">
              {message}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan Divisi"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function Field({ label, value, onChange, placeholder = "", required = false }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400"
      />
    </label>
  );
}

function DeleteDivisionModal({ division, message, isLoading, onClose, onDelete }) {
  return (
    <ModalShell title="Hapus Divisi" onClose={onClose}>
      <div className="px-6 py-5">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-sm font-bold text-red-700">
            Yakin ingin menghapus divisi ini?
          </p>
          <p className="mt-2 text-sm leading-6 text-red-700">
            Divisi <strong>{division.name}</strong> akan dihapus dari master data.
            Jika masih dipakai pegawai, sebaiknya nonaktifkan saja agar histori
            data tetap mudah dibaca.
          </p>
        </div>
        {message ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Batal
        </Button>
        <Button
          type="button"
          onClick={onDelete}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          <Trash2 size={18} />
          {isLoading ? "Menghapus..." : "Ya, hapus divisi"}
        </Button>
      </div>
    </ModalShell>
  );
}
