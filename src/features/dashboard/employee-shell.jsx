"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleDot,
  Search,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/logout-button";
import { employeeNav } from "@/lib/constants/navigation";

const navSections = [
  {
    label: "Utama",
    items: employeeNav.slice(0, 1),
  },
  {
    label: "Absensi",
    items: employeeNav.slice(1, 5),
  },
  {
    label: "Akun",
    items: employeeNav.slice(5),
  },
];

export function EmployeeShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="employee-futuristic relative min-h-screen overflow-hidden bg-[#F5F7FC] text-slate-950 dark:bg-[#050816] dark:text-slate-100">
      <div className="employee-grid-bg" />
      <div className="employee-glow employee-glow-cyan" />
      <div className="employee-glow employee-glow-violet" />

      <aside className="employee-sidebar fixed left-5 top-5 z-30 hidden h-[calc(100vh-40px)] w-72 flex-col rounded-[28px] p-4 backdrop-blur-2xl lg:flex">
        <div className="employee-brand-card flex items-center gap-3 rounded-3xl border border-white/15 bg-white/10 px-3 py-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#38BDF8] via-[#2563EB] to-[#A855F7] text-white shadow-lg shadow-blue-500/30 dark:from-[#22D3EE] dark:via-[#7C3AED] dark:to-[#EC4899]">
            <Sparkles size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-wide text-white">
              HR FUTURISTIC
            </p>
            <p className="text-xs text-blue-100/78 dark:text-slate-400">
              Employee Portal
            </p>
          </div>
        </div>

        <nav className="mt-6 grid gap-5" aria-label="Navigasi pegawai">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/55 dark:text-slate-500">
                {section.label}
              </p>
              <div className="mt-2 grid gap-1.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/employee"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={[
                        "group relative flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold",
                        "border border-transparent text-blue-100/78 hover:border-[#60A5FA]/50 hover:bg-white/12 hover:text-white hover:shadow-lg hover:shadow-blue-500/20",
                        "dark:text-slate-300 dark:hover:border-[#EC4899]/45 dark:hover:bg-white/[0.08] dark:hover:text-white",
                        isActive
                          ? "border-[#93C5FD]/55 bg-gradient-to-r from-white/18 to-[#2563EB]/22 text-white shadow-lg shadow-blue-500/25 dark:border-[#EC4899]/50 dark:from-[#7C3AED]/26 dark:to-[#22D3EE]/12 dark:shadow-fuchsia-500/20"
                          : "",
                      ].join(" ")}
                    >
                      {isActive ? (
                        <span className="absolute left-1 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-[#22D3EE] shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
                      ) : null}
                      <item.icon
                        size={20}
                        className={
                          isActive
                            ? "text-white dark:text-[#22D3EE]"
                            : "text-blue-100/62 group-hover:text-white dark:group-hover:text-[#EC4899]"
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/15 bg-white/10 p-4 shadow-inner shadow-white/10 dark:border-white/10 dark:bg-[#0A0F2C]/55 dark:shadow-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-blue-100/58 dark:text-slate-500">
                Radius Kantor
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                Dalam 100 meter
              </p>
            </div>
            <ShieldCheck
              size={24}
              className="text-emerald-300"
            />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/12">
            <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-[#2563EB] via-[#22D3EE] to-[#A855F7] shadow-lg shadow-cyan-300/40" />
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-200">
            <CircleDot size={13} />
            GPS validation online
          </p>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-screen flex-col lg:pl-[20.5rem]">
        <header className="sticky top-0 z-20 border-b border-white/40 bg-white/55 px-4 py-2 shadow-sm shadow-blue-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-[#050816]/58 dark:shadow-none sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#22D3EE] to-[#A855F7] text-[#071227]">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                  HR FUTURISTIC
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Employee Portal
                </p>
              </div>
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selamat datang kembali
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-[#061A58] dark:text-white">
                    Dashboard Pegawai
                  </h1>
                  <span className="mt-1.5 block h-1 w-24 rounded-full bg-gradient-to-r from-[#2563EB] via-[#22D3EE] to-transparent dark:from-[#A855F7] dark:via-[#22D3EE]" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200">
                  <Wifi size={13} />
                  Sistem online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/employee/absensi"
                className="hidden min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#22D3EE] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-500/22 hover:-translate-y-0.5 dark:from-[#22D3EE] dark:to-[#A855F7] dark:text-[#050816] dark:shadow-cyan-400/20 md:flex"
              >
                <ShieldCheck size={17} />
                Absensi
              </Link>
              <Link
                href="/employee/riwayat"
                className="employee-header-action hidden size-11 place-items-center rounded-2xl border border-white/65 bg-white/66 text-[#061A58] hover:border-[#60A5FA]/60 hover:text-[#2563EB] dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-300 dark:hover:text-[#22D3EE] sm:grid"
                aria-label="Cari riwayat absensi"
              >
                <Search size={18} />
              </Link>
              <Link
                href="/employee/notifikasi"
                className="employee-header-action relative grid size-11 place-items-center rounded-2xl border border-white/65 bg-white/66 text-[#061A58] hover:border-[#60A5FA]/60 hover:text-[#2563EB] dark:border-white/10 dark:bg-white/[0.07] dark:text-slate-200 dark:hover:text-[#22D3EE]"
                aria-label="Buka notifikasi"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 size-2.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.95)]" />
              </Link>
              <div className="employee-profile-pill hidden items-center gap-3 rounded-2xl border border-white/65 bg-white/66 py-1 pl-2 pr-3 dark:border-white/10 dark:bg-white/[0.07] sm:flex">
                <Image
                  src="/avatar-rina.svg"
                  alt="Foto profil Rina Pratiwi"
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Rina Pratiwi
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Finance Officer
                  </p>
                </div>
                <ChevronDown size={16} className="text-slate-500" />
              </div>
              <div className="hidden sm:block">
                <LogoutButton audience="employee" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-3 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <div className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/88 px-2 pb-3 pt-2 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-[#050816]/88 dark:shadow-cyan-950/50 lg:hidden">
        <div className="mb-1 flex items-center gap-2 overflow-x-auto pb-1 sm:hidden">
          {employeeNav.slice(4).map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold",
                  isActive
                    ? "border-[#22D3EE]/45 bg-[#22D3EE]/12 text-[#0891B2] dark:text-[#22D3EE]"
                    : "border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400",
                ].join(" ")}
              >
                <item.icon size={13} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <nav className="grid grid-cols-5" aria-label="Navigasi bawah pegawai">
        {employeeNav.slice(0, 4).map((item) => {
          const isActive =
            item.href === "/employee"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold",
                isActive
                  ? "bg-[#22D3EE]/12 text-[#0891B2] dark:text-[#22D3EE]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white",
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
    </div>
  );
}
