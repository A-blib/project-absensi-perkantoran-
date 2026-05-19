"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { adminNav } from "@/lib/constants/navigation";

export function AdminMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
        aria-label="Buka menu admin"
      >
        <Menu size={20} />
      </button>

      {isOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                aria-label="Tutup menu admin"
              />

              <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col border-r border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
                  <Logo />
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Tutup menu admin"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="grid gap-1 px-3 py-4">
                  {adminNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <item.icon size={19} aria-hidden="true" />
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto border-t border-slate-100 p-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-bold text-slate-950">Admin HR</p>
                    <p className="mt-1 text-xs text-slate-500">hr@kantor.test</p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Pilih menu untuk berpindah halaman dashboard.
                    </p>
                  </div>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
