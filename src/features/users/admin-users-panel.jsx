"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  ChevronDown,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readBrowserCache, writeBrowserCache } from "@/lib/browser/cache";

const USERS_CACHE_KEY = "absen-admin-users-cache";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  division: "",
  position: "",
  phone: "",
  employeeCode: "",
  status: "active",
  mustChangePassword: true,
};

const sortOptions = [
  { value: "name", label: "Nama" },
  { value: "email", label: "Email" },
  { value: "employeeCode", label: "Kode" },
  { value: "division", label: "Divisi" },
  { value: "role", label: "Role" },
  { value: "status", label: "Status" },
];

function statusLabel(status) {
  return status === "active" ? "Aktif" : "Nonaktif";
}

function roleLabel(role) {
  return role === "admin" ? "Admin" : "Pegawai";
}

export function AdminUsersPanel({ initialUsers, divisions = [], positions = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const cachedUsers = readBrowserCache(USERS_CACHE_KEY);

      if (cachedUsers?.length) {
        setUsers(cachedUsers);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    writeBrowserCache(USERS_CACHE_KEY, users);
  }, [users]);

  const visibleUsers = useMemo(() => {
    const needle = query.toLowerCase();
    const filtered = users.filter((user) =>
      [user.name, user.email, user.division, user.position, user.employeeCode]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );

    return [...filtered].sort((first, second) => {
      const firstValue = String(first[sortBy] || "").toLowerCase();
      const secondValue = String(second[sortBy] || "").toLowerCase();
      const result = firstValue.localeCompare(secondValue, "id", {
        numeric: true,
        sensitivity: "base",
      });

      return sortDirection === "asc" ? result : -result;
    });
  }, [query, sortBy, sortDirection, users]);

  function openCreate() {
    setForm(emptyForm);
    setMessage("");
    setModal({ type: "create" });
  }

  function openEdit(user) {
    setOpenMenuId(null);
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "employee",
      division: user.division || "",
      position: user.position || "",
      phone: user.phone || "",
      employeeCode: user.employeeCode || "",
      status: user.status || "active",
      mustChangePassword: Boolean(user.mustChangePassword),
    });
    setMessage("");
    setModal({ type: "edit", user });
  }

  function openReset(user) {
    setOpenMenuId(null);
    setForm({ password: "", mustChangePassword: true });
    setMessage("");
    setModal({ type: "reset", user });
  }

  async function submitForm(event) {
    event.preventDefault();
    const activeModal = modal;

    if (!activeModal) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    const isCreate = activeModal.type === "create";
    const response = await fetch(
      isCreate ? "/api/admin/users" : `/api/admin/users/${activeModal.user.id}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Data gagal disimpan.");
      return;
    }

    setUsers((current) => {
      if (isCreate) {
        return [result.user, ...current];
      }

      return current.map((user) =>
        user.id === result.user.id ? result.user : user,
      );
    });
    setModal(null);
  }

  async function patchUser(user, payload) {
    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/users/${user.id}`, {
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

    setUsers((current) =>
      current.map((item) => (item.id === result.user.id ? result.user : item)),
    );
  }

  async function submitReset(event) {
    event.preventDefault();
    const activeModal = modal;

    if (!activeModal) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/users/${activeModal.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset-password",
        password: form.password,
      }),
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Password gagal direset.");
      return;
    }

    setUsers((current) =>
      current.map((item) => (item.id === result.user.id ? result.user : item)),
    );
    setModal(null);
  }

  async function deleteSelectedUser() {
    const activeModal = modal;

    if (!activeModal) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/users/${activeModal.user.id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "User gagal dihapus.");
      return;
    }

    setUsers((current) => current.filter((user) => user.id !== activeModal.user.id));
    setModal(null);
  }

  return (
    <div className="grid gap-4 sm:gap-6">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            User Management
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Pegawai</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Kelola akun, role, status aktif, dan reset password pegawai.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-fit">
          <Plus size={18} />
          Tambah Pegawai
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
              placeholder="Cari nama, email, divisi..."
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="grid gap-3 sm:flex sm:items-center sm:justify-end">
            <div className="flex min-w-0 items-center gap-2">
              <SortDropdown
                value={sortBy}
                isOpen={isSortOpen}
                onToggle={() => setIsSortOpen((current) => !current)}
                onChange={(value) => {
                  setSortBy(value);
                  setIsSortOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
                }
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-950 sm:size-8 sm:border-0"
                aria-label={
                  sortDirection === "asc"
                    ? "Ubah sortir menjadi menurun"
                    : "Ubah sortir menjadi menaik"
                }
              >
                {sortDirection === "asc" ? (
                  <ArrowUpAZ size={17} />
                ) : (
                  <ArrowDownAZ size={17} />
                )}
              </button>
            </div>
            <p className="text-sm font-medium text-slate-500 sm:text-right">
              {visibleUsers.length} akun ditemukan
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
          {visibleUsers.length ? (
            visibleUsers.map((user) => (
              <UserMobileCard
                key={user.id}
                user={user}
                isOpen={openMenuId === user.id}
                isLoading={isLoading}
                menuPosition={menuPosition}
                onToggle={(position) => {
                  setMenuPosition(position);
                  setOpenMenuId((current) => (current === user.id ? null : user.id));
                }}
                onDetail={() => {
                  setMenuPosition(null);
                  setOpenMenuId(null);
                  setModal({ type: "detail", user });
                }}
                onEdit={() => openEdit(user)}
                onToggleRole={() => {
                  setMenuPosition(null);
                  setOpenMenuId(null);
                  patchUser(user, {
                    role: user.role === "admin" ? "employee" : "admin",
                  });
                }}
                onToggleStatus={() => {
                  setMenuPosition(null);
                  setOpenMenuId(null);
                  patchUser(user, {
                    status: user.status === "active" ? "inactive" : "active",
                  });
                }}
                onReset={() => openReset(user)}
                onDelete={() => {
                  setMenuPosition(null);
                  setOpenMenuId(null);
                  setMessage("");
                  setModal({ type: "delete", user });
                }}
              />
            ))
          ) : (
            <EmptyUsersState />
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Pegawai</th>
                <th className="px-5 py-3">Kode</th>
                <th className="px-5 py-3">Divisi</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Password</th>
                <th className="px-5 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => (
                <tr key={user.id} className="bg-white">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-950">{user.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {user.employeeCode || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-700">{user.division || "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{user.position || "-"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={user.role === "admin" ? "hadir" : "default"}>
                      {roleLabel(user.role)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={user.status === "active" ? "hadir" : "alpa"}>
                      {statusLabel(user.status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    {user.mustChangePassword ? (
                      <Badge status="telat">Wajib ganti</Badge>
                    ) : (
                      <Badge status="default">Normal</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <UserActionMenu
                      user={user}
                      isOpen={openMenuId === user.id}
                      isLoading={isLoading}
                      menuPosition={menuPosition}
                      onToggle={(position) => {
                        setMenuPosition(position);
                        setOpenMenuId((current) => (current === user.id ? null : user.id));
                      }}
                      onDetail={() => {
                        setMenuPosition(null);
                        setOpenMenuId(null);
                        setModal({ type: "detail", user });
                      }}
                      onEdit={() => openEdit(user)}
                      onToggleRole={() => {
                        setMenuPosition(null);
                        setOpenMenuId(null);
                        patchUser(user, {
                          role: user.role === "admin" ? "employee" : "admin",
                        });
                      }}
                      onToggleStatus={() => {
                        setMenuPosition(null);
                        setOpenMenuId(null);
                        patchUser(user, {
                          status: user.status === "active" ? "inactive" : "active",
                        });
                      }}
                      onReset={() => openReset(user)}
                      onDelete={() => {
                        setMenuPosition(null);
                        setOpenMenuId(null);
                        setMessage("");
                        setModal({ type: "delete", user });
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleUsers.length === 0 ? <EmptyUsersState /> : null}
        </div>
      </div>

      {modal?.type === "create" || modal?.type === "edit" ? (
        <UserFormModal
          title={modal.type === "create" ? "Tambah Pegawai" : "Edit Pegawai"}
          form={form}
          setForm={setForm}
          message={message}
          isLoading={isLoading}
          isCreate={modal.type === "create"}
          divisions={divisions}
          positions={positions}
          onClose={() => setModal(null)}
          onSubmit={submitForm}
        />
      ) : null}

      {modal?.type === "detail" ? (
        <DetailModal user={modal.user} onClose={() => setModal(null)} />
      ) : null}

      {modal?.type === "reset" ? (
        <ResetPasswordModal
          user={modal.user}
          password={form.password}
          setPassword={(password) => setForm((current) => ({ ...current, password }))}
          message={message}
          isLoading={isLoading}
          onClose={() => setModal(null)}
          onSubmit={submitReset}
        />
      ) : null}

      {modal?.type === "delete" ? (
        <DeleteUserModal
          user={modal.user}
          message={message}
          isLoading={isLoading}
          onClose={() => setModal(null)}
          onDelete={deleteSelectedUser}
        />
      ) : null}
    </div>
  );
}

function UserMobileCard({
  user,
  isOpen,
  isLoading,
  menuPosition,
  onToggle,
  onDetail,
  onEdit,
  onToggleRole,
  onToggleStatus,
  onReset,
  onDelete,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <UserRound size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-950">
                {user.name}
              </h2>
              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {user.email}
              </p>
            </div>
            <UserActionMenu
              user={user}
              isOpen={isOpen}
              isLoading={isLoading}
              menuPosition={menuPosition}
              onToggle={onToggle}
              onDetail={onDetail}
              onEdit={onEdit}
              onToggleRole={onToggleRole}
              onToggleStatus={onToggleStatus}
              onReset={onReset}
              onDelete={onDelete}
              compact
            />
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Kode
          </dt>
          <dd className="mt-1 truncate font-bold text-slate-700">
            {user.employeeCode || "-"}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Divisi
          </dt>
          <dd className="mt-1 truncate font-bold text-slate-700">
            {user.division || "-"}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Jabatan
          </dt>
          <dd className="mt-1 truncate font-bold text-slate-700">
            {user.position || "-"}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Password
          </dt>
          <dd className="mt-1">
            {user.mustChangePassword ? (
              <Badge status="telat">Wajib ganti</Badge>
            ) : (
              <Badge status="default">Normal</Badge>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge status={user.role === "admin" ? "hadir" : "default"}>
          {roleLabel(user.role)}
        </Badge>
        <Badge status={user.status === "active" ? "hadir" : "alpa"}>
          {statusLabel(user.status)}
        </Badge>
      </div>
    </article>
  );
}

function EmptyUsersState() {
  return (
    <div className="grid place-items-center px-4 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
        <Search size={22} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700">
        Data pegawai tidak ditemukan
      </p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Coba ubah kata kunci pencarian atau sortir data.
      </p>
    </div>
  );
}

function SortDropdown({ value, isOpen, onToggle, onChange }) {
  const activeOption =
    sortOptions.find((option) => option.value === value) || sortOptions[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left shadow-sm hover:border-blue-200 hover:bg-blue-50 sm:min-w-36 sm:flex-none"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Sortir
          </span>
          <span className="ml-2 text-sm font-bold text-slate-950">{activeOption.label}</span>
        </span>
        <ChevronDown
          size={17}
          className={`text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/15"
          role="listbox"
        >
          {sortOptions.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={[
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left",
                  isActive ? "bg-blue-50" : "hover:bg-slate-50",
                ].join(" ")}
                role="option"
                aria-selected={isActive}
              >
                <span
                  className={[
                    "grid size-6 shrink-0 place-items-center rounded-md border",
                    isActive
                      ? "border-blue-200 bg-blue-100 text-blue-700"
                      : "border-slate-200 bg-white text-slate-400",
                  ].join(" ")}
                >
                  {isActive ? <Check size={16} /> : null}
                </span>
                <span className="text-sm font-bold text-slate-700">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function UserActionMenu({
  user,
  isOpen,
  isLoading,
  menuPosition,
  compact = false,
  onToggle,
  onDetail,
  onEdit,
  onToggleRole,
  onToggleStatus,
  onReset,
  onDelete,
}) {
  const buttonRef = useRef(null);

  function handleToggle() {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) {
      onToggle(null);
      return;
    }

    const menuHeight = 324;
    const viewportPadding = 16;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const preferredTop = shouldOpenUp
      ? rect.top - Math.min(menuHeight, spaceAbove) - gap
      : rect.bottom + gap;
    const top = Math.max(
      viewportPadding,
      Math.min(preferredTop, window.innerHeight - viewportPadding - menuHeight),
    );

    onToggle({
      position: "fixed",
      top,
      right: Math.max(16, window.innerWidth - rect.right),
      maxHeight: `calc(100vh - ${viewportPadding * 2}px)`,
    });
  }

  return (
    <div className="inline-flex justify-end">
      <Button
        ref={buttonRef}
        type="button"
        size="sm"
        variant="outline"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={compact ? "size-9 shrink-0 px-0" : ""}
        aria-label={compact ? "Buka aksi pegawai" : undefined}
      >
        <MoreHorizontal size={16} />
        {compact ? null : "Aksi"}
      </Button>

      {isOpen && menuPosition
        ? createPortal(
        <div
          className="z-50 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-2xl shadow-slate-950/20"
          role="menu"
          style={menuPosition}
        >
          <MenuItem icon={UserRound} label="Lihat Detail" onClick={onDetail} />
          <MenuItem icon={Pencil} label="Edit Data" onClick={onEdit} />
          <MenuItem
            icon={Shield}
            label={user.role === "admin" ? "Ubah Jadi Pegawai" : "Ubah Jadi Admin"}
            onClick={onToggleRole}
            disabled={isLoading}
          />
          <MenuItem
            label={user.status === "active" ? "Nonaktifkan Akun" : "Aktifkan Akun"}
            onClick={onToggleStatus}
            disabled={isLoading}
          />
          <MenuItem icon={KeyRound} label="Reset Password" onClick={onReset} />
          <div className="my-2 border-t border-slate-100" />
          <MenuItem
            icon={Trash2}
            label="Hapus Akun"
            onClick={onDelete}
            danger
          />
        </div>,
          document.body,
        )
        : null}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, disabled = false, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold disabled:pointer-events-none disabled:opacity-50",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-blue-50 hover:text-blue-700",
      ].join(" ")}
      role="menuitem"
    >
      {Icon ? <Icon size={16} /> : <span className="size-4" />}
      {label}
    </button>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
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

function UserFormModal({
  title,
  form,
  setForm,
  message,
  isLoading,
  isCreate,
  divisions,
  positions,
  onClose,
  onSubmit,
}) {
  const hasSelectedDivision = divisions.some(
    (division) => division.name === form.division,
  );
  const positionsForDivision = positions.filter(
    (position) => position.divisionName === form.division,
  );
  const hasSelectedPosition = positionsForDivision.some(
    (position) => position.name === form.position,
  );

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "division" ? { position: "" } : {}),
    }));
  }

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <Field label="Nama" value={form.name} onChange={(value) => update("name", value)} required />
          <Field
            label="Email Gmail"
            type="email"
            value={form.email}
            onChange={(value) => update("email", value)}
            placeholder="nama@gmail.com"
            hint="Hanya menerima email dengan domain @gmail.com"
            required
          />
          {isCreate ? (
            <Field label="Password Awal" type="password" value={form.password} onChange={(value) => update("password", value)} required />
          ) : null}
          <Field label="Kode Pegawai" value={form.employeeCode} onChange={(value) => update("employeeCode", value)} />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Divisi
            <select
              value={form.division}
              onChange={(event) => update("division", event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
              required
            >
              <option value="">Pilih divisi</option>
              {form.division && !hasSelectedDivision ? (
                <option value={form.division}>{form.division} (tersimpan)</option>
              ) : null}
              {divisions.map((division) => (
                <option key={division.id} value={division.name}>
                  {division.name}
                  {division.code ? ` (${division.code})` : ""}
                </option>
              ))}
            </select>
            {divisions.length === 0 ? (
              <span className="text-xs font-normal text-amber-600">
                Belum ada divisi aktif. Tambahkan di menu Divisi dulu.
              </span>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Jabatan
            <select
              value={form.position}
              onChange={(event) => update("position", event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
              required
              disabled={!form.division}
            >
              <option value="">
                {form.division ? "Pilih jabatan" : "Pilih divisi dulu"}
              </option>
              {form.position && !hasSelectedPosition ? (
                <option value={form.position}>{form.position} (tersimpan)</option>
              ) : null}
              {positionsForDivision.map((position) => (
                <option key={position.id} value={position.name}>
                  {position.name}
                  {position.code ? ` (${position.code})` : ""}
                </option>
              ))}
            </select>
            {form.division && positionsForDivision.length === 0 ? (
              <span className="text-xs font-normal text-amber-600">
                Belum ada jabatan aktif untuk divisi ini. Tambahkan di menu Jabatan.
              </span>
            ) : null}
          </label>
          <Field label="Nomor HP" value={form.phone} onChange={(value) => update("phone", value)} />
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Role
            <select
              value={form.role}
              onChange={(event) => update("role", event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
            >
              <option value="employee">Pegawai</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.mustChangePassword}
              onChange={(event) => update("mustChangePassword", event.target.checked)}
              className="size-4"
            />
            Wajib ganti password saat login berikutnya
          </label>
          {message ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">
              {message}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  hint = "",
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400"
      />
      {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

function DetailModal({ user, onClose }) {
  const rows = [
    ["Nama", user.name],
    ["Email", user.email],
    ["Kode Pegawai", user.employeeCode || "-"],
    ["Divisi", user.division || "-"],
    ["Jabatan", user.position || "-"],
    ["Nomor HP", user.phone || "-"],
    ["Role", roleLabel(user.role)],
    ["Status", statusLabel(user.status)],
    ["Wajib Ganti Password", user.mustChangePassword ? "Ya" : "Tidak"],
  ];

  return (
    <ModalShell title="Detail Pegawai" onClose={onClose}>
      <div className="grid gap-3 px-6 py-5">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-[180px_1fr]">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="text-sm font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
        <Button type="button" onClick={onClose}>Tutup</Button>
      </div>
    </ModalShell>
  );
}

function ResetPasswordModal({
  user,
  password,
  setPassword,
  message,
  isLoading,
  onClose,
  onSubmit,
}) {
  return (
    <ModalShell title="Reset Password" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-slate-500">
            Buat password awal baru untuk <strong className="text-slate-950">{user.name}</strong>.
            Setelah reset, user wajib mengganti password saat login.
          </p>
          <div className="mt-4">
            <Field
              label="Password Baru"
              type="password"
              value={password}
              onChange={setPassword}
              required
            />
          </div>
          {message ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {message}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Mereset..." : "Reset Password"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteUserModal({ user, message, isLoading, onClose, onDelete }) {
  return (
    <ModalShell title="Hapus Akun User" onClose={onClose}>
      <div className="px-6 py-5">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-sm font-bold text-red-700">
            Yakin ingin menghapus akun ini?
          </p>
          <p className="mt-2 text-sm leading-6 text-red-700">
            Akun <strong>{user.name}</strong> dengan email <strong>{user.email}</strong>
            akan dihapus dari database. Riwayat absensi yang terhubung juga bisa
            ikut terhapus karena relasi database memakai cascade.
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
          {isLoading ? "Menghapus..." : "Ya, hapus akun"}
        </Button>
      </div>
    </ModalShell>
  );
}
