"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Sparkles } from "lucide-react";
import { LogoutButton } from "@/features/auth/logout-button";
import { employeeNav } from "@/lib/constants/navigation";

export function EmployeeShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="employee-futuristic relative min-h-screen overflow-hidden bg-[#0A0F2C] text-slate-100">
      <div className="employee-grid-bg" />
      <div className="employee-glow employee-glow-cyan" />
      <div className="employee-glow employee-glow-violet" />

      <aside className="fixed left-5 top-5 z-30 hidden h-[calc(100vh-40px)] w-72 flex-col rounded-[28px] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#6C3CE8] text-[#0A0F2C] shadow-lg shadow-cyan-400/20">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-wide text-white">
              HR FUTURISTIC
            </p>
            <p className="text-xs text-slate-400">Employee Portal</p>
          </div>
        </div>

        <nav className="mt-8 grid gap-2">
          {employeeNav.map((item) => {
            const isActive =
              item.href === "/employee"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",
                  "border border-transparent text-slate-300 hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-white hover:shadow-lg hover:shadow-cyan-400/10",
                  isActive
                    ? "border-cyan-300/40 bg-cyan-300/12 text-white shadow-lg shadow-cyan-400/10"
                    : "",
                ].join(" ")}
              >
                <item.icon
                  size={20}
                  className={isActive ? "text-[#00F0FF]" : "text-slate-400 group-hover:text-[#00F0FF]"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-[#0A0F2C]/45 p-4 shadow-inner shadow-white/5">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Radius Kantor
          </p>
          <p className="mt-2 text-sm font-semibold text-white">
            Dalam 100 meter
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-emerald-400 to-[#00F0FF] shadow-lg shadow-cyan-300/30" />
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-screen flex-col lg:pl-[20.5rem]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0F2C]/70 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#00F0FF] to-[#6C3CE8] text-[#0A0F2C]">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  HR FUTURISTIC
                </p>
                <p className="text-[11px] text-slate-400">Employee Portal</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-slate-400">Selamat datang kembali</p>
              <h1 className="text-xl font-semibold text-white">
                Dashboard Pegawai
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/employee/notifikasi"
                className="relative grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] text-slate-200 hover:border-cyan-300/40 hover:text-[#00F0FF] hover:shadow-lg hover:shadow-cyan-400/10"
                aria-label="Buka notifikasi"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 size-2.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.95)]" />
              </Link>
              <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] py-1.5 pl-2 pr-3 sm:flex">
                <Image
                  src="/avatar-rina.svg"
                  alt="Foto profil Rina Pratiwi"
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">
                    Rina Pratiwi
                  </p>
                  <p className="text-xs text-slate-400">Finance Officer</p>
                </div>
                <ChevronDown size={16} className="text-slate-500" />
              </div>
              <div className="hidden sm:block">
                <LogoutButton audience="employee" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-5 border-t border-white/10 bg-[#0A0F2C]/85 px-2 pb-3 pt-2 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl lg:hidden">
        {employeeNav.slice(0, 4).map((item) => {
          const isActive =
            item.href === "/employee"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold",
                isActive
                  ? "bg-cyan-300/12 text-[#00F0FF]"
                  : "text-slate-400 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <item.icon size={19} />
              <span className="max-w-full truncate">{item.label.replace(" Absensi", "")}</span>
            </Link>
          );
        })}
        <LogoutButton audience="employee" variant="bottom-nav" />
      </nav>
    </div>
  );
}
