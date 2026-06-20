"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readBrowserCache, writeBrowserCache } from "@/lib/browser/cache";

const POSITIONS_CACHE_KEY = "absen-admin-positions-cache";

const emptyForm = {
  divisionId: "",
  name: "",
  code: "",
  description: "",
  status: "active",
};

function statusLabel(status) {
  return status === "active" ? "Aktif" : "Nonaktif";
}

export function AdminPositionsPanel({ initialPositions, divisions }) {
  const [positions, setPositions] = useState(initialPositions);
  const [query, setQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const cachedPositions = readBrowserCache(POSITIONS_CACHE_KEY);

      if (cachedPositions?.length) {
        setPositions(cachedPositions);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    writeBrowserCache(POSITIONS_CACHE_KEY, positions);
  }, [positions]);

  const visiblePositions = useMemo(() => {
    const needle = query.toLowerCase();

    return positions.filter((position) => {
      const matchesDivision =
        divisionFilter === "all" || position.divisionId === divisionFilter;
      const matchesQuery = [
        position.name,
        position.code,
        position.description,
        position.divisionName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle));

      return matchesDivision && matchesQuery;
    });
  }, [divisionFilter, positions, query]);

  function openCreate() {
    setForm({
      ...emptyForm,
      divisionId: divisionFilter !== "all" ? divisionFilter : divisions[0]?.id || "",
    });
    setMessage("");
    setModal({ type: "create" });
  }

  function openEdit(position) {
    setForm({
      divisionId: position.divisionId || "",
      name: position.name || "",
      code: position.code || "",
      description: position.description || "",
      status: position.status || "active",
    });
    setMessage("");
    setModal({ type: "edit", position });
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
        ? "/api/admin/positions"
        : `/api/admin/positions/${activeModal.position.id}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Data jabatan gagal disimpan.");
      return;
    }

    setPositions((current) => {
      if (isCreate) {
        return [result.position, ...current];
      }

      return current.map((position) =>
        position.id === result.position.id ? result.position : position,
      );
    });
    setModal(null);
  }

  async function deleteSelectedPosition() {
    const activeModal = modal;

    if (!activeModal) return;

    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/positions/${activeModal.position.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Jabatan gagal dihapus.");
      return;
    }

    setPositions((current) =>
      current.filter((position) => position.id !== activeModal.position.id),
    );
    setModal(null);
  }

  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Master Data
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Jabatan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Kelola jabatan per divisi agar form pegawai tetap konsisten.
          </p>
        </div>
        <Button onClick={openCreate} disabled={divisions.length === 0} className="w-full sm:w-fit">
          <Plus size={18} />
          Tambah Jabatan
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-3 sm:p-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={18} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari jabatan, kode, divisi..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="grid gap-3 sm:flex sm:items-center sm:justify-end">
            <select
              value={divisionFilter}
              onChange={(event) => setDivisionFilter(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm sm:h-10 sm:w-auto"
              aria-label="Filter jabatan berdasarkan divisi"
            >
              <option value="all">Semua Divisi</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
            <p className="text-sm font-medium text-slate-500 sm:text-right">
              {visiblePositions.length} jabatan ditemukan
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
          {visiblePositions.length ? (
            visiblePositions.map((position) => (
              <PositionMobileCard
                key={position.id}
                position={position}
                onEdit={() => openEdit(position)}
                onDelete={() => {
                  setMessage("");
                  setModal({ type: "delete", position });
                }}
              />
            ))
          ) : (
            <EmptyPositionsState />
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Jabatan</th>
                <th className="px-5 py-3">Divisi</th>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Deskripsi</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visiblePositions.map((position) => (
                <tr key={position.id} className="bg-white">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                        <BriefcaseBusiness size={19} />
                      </div>
                      <p className="font-bold text-slate-950">{position.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {position.divisionName || "-"}
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {position.code || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={position.status === "active" ? "hadir" : "alpa"}>
                      {statusLabel(position.status)}
                    </Badge>
                  </td>
                  <td className="max-w-md px-5 py-4 text-slate-500">
                    {position.description || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(position)}>
                        <Pencil size={16} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMessage("");
                          setModal({ type: "delete", position });
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
          {visiblePositions.length === 0 ? <EmptyPositionsState /> : null}
        </div>
      </div>

      {modal?.type === "create" || modal?.type === "edit" ? (
        <PositionFormModal
          title={modal.type === "create" ? "Tambah Jabatan" : "Edit Jabatan"}
          form={form}
          setForm={setForm}
          divisions={divisions}
          message={message}
          isLoading={isLoading}
          onClose={() => setModal(null)}
          onSubmit={submitForm}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <DeletePositionModal
          position={modal.position}
          message={message}
          isLoading={isLoading}
          onClose={() => setModal(null)}
          onDelete={deleteSelectedPosition}
        />
      ) : null}
    </div>
  );
}

function PositionMobileCard({
  position,
  onEdit,
  onDelete,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <BriefcaseBusiness size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-950">
                {position.name}
              </h2>
              <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
                {position.divisionName || "Tanpa divisi"}
              </p>
            </div>
            <Badge status={position.status === "active" ? "hadir" : "alpa"}>
              {statusLabel(position.status)}
            </Badge>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Kode
              </dt>
              <dd className="mt-1 truncate font-bold text-slate-700">
                {position.code || "-"}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Divisi
              </dt>
              <dd className="mt-1 truncate font-bold text-slate-700">
                {position.divisionName || "-"}
              </dd>
            </div>
          </dl>

          <p className="mt-3 max-h-[4.5rem] overflow-hidden text-sm leading-6 text-slate-500">
            {position.description || "Belum ada deskripsi jabatan."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="w-full"
        >
          <Pencil size={16} />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={16} />
          Hapus
        </Button>
      </div>
    </article>
  );
}

function EmptyPositionsState() {
  return (
    <div className="grid place-items-center px-4 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
        <Search size={22} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700">
        Data jabatan tidak ditemukan
      </p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Coba ubah kata kunci, filter divisi, atau tambahkan jabatan baru.
      </p>
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

function PositionFormModal({
  title,
  form,
  setForm,
  divisions,
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
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Divisi
            <select
              value={form.divisionId}
              onChange={(event) => update("divisionId", event.target.value)}
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
              required
            >
              <option value="">Pilih divisi</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Nama Jabatan"
            value={form.name}
            onChange={(value) => update("name", value)}
            required
          />
          <Field
            label="Kode Jabatan"
            value={form.code}
            onChange={(value) => update("code", value)}
            placeholder="Contoh: FIN-STF"
          />
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
          <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
            Deskripsi
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              rows={4}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400"
              placeholder="Tuliskan fungsi singkat jabatan ini"
            />
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
            {isLoading ? "Menyimpan..." : "Simpan Jabatan"}
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

function DeletePositionModal({ position, message, isLoading, onClose, onDelete }) {
  return (
    <ModalShell title="Hapus Jabatan" onClose={onClose}>
      <div className="px-6 py-5">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-sm font-bold text-red-700">
            Yakin ingin menghapus jabatan ini?
          </p>
          <p className="mt-2 text-sm leading-6 text-red-700">
            Jabatan <strong>{position.name}</strong> akan dihapus dari master data.
            Jika masih dipakai pegawai, nonaktifkan saja atau pindahkan pegawai dulu.
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
          {isLoading ? "Menghapus..." : "Ya, hapus jabatan"}
        </Button>
      </div>
    </ModalShell>
  );
}
