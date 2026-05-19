"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const dialogCopy = {
  admin: {
    subtitle: "Sesi admin akan ditutup dari perangkat ini.",
    body: "Jika yakin, kamu akan diarahkan kembali ke landing page dan perlu login lagi untuk membuka dashboard admin.",
    cancel: "Tidak, tetap di dashboard",
  },
  employee: {
    subtitle: "Sesi pegawai akan ditutup dari perangkat ini.",
    body: "Jika yakin, kamu akan diarahkan kembali ke landing page dan perlu login lagi untuk membuka dashboard pegawai.",
    cancel: "Tidak, tetap di dashboard",
  },
};

export function LogoutButton({ audience = "admin", variant = "icon" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const copy = dialogCopy[audience] || dialogCopy.admin;

  async function handleLogout() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await response.json();

      if (!response.ok) {
        setMessage("Logout gagal. Coba ulangi sebentar lagi.");
        setIsLoading(false);
        return;
      }

      window.location.href = result.redirectTo || "/";
    } catch {
      setMessage("Koneksi bermasalah. Coba ulangi sebentar lagi.");
      setIsLoading(false);
    }
  }

  const trigger =
    variant === "bottom-nav" ? (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
        aria-label="Logout"
      >
        <LogOut size={20} />
        Logout
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="grid size-10 place-items-center rounded-lg border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100"
        aria-label="Logout"
      >
        <LogOut size={18} />
      </button>
    );

  return (
    <>
      {trigger}

      {isOpen
        ? createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-950">
                    Keluar dari dashboard?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {copy.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup popup logout"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {copy.body}
              </div>

              {message ? (
                <p className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700">
                  {message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                {copy.cancel}
              </Button>
              <Button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut size={18} />
                {isLoading ? "Keluar..." : "Ya, logout"}
              </Button>
            </div>
          </div>
        </div>,
          document.body,
        )
        : null}
    </>
  );
}
