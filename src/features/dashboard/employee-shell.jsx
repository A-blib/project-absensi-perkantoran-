"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/logout-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { employeeNav } from "@/lib/constants/navigation";

const pageTitles = {
  "/employee": "Dashboard Overview",
  "/employee/absensi": "Panel Absensi",
  "/employee/riwayat": "Data Kehadiran",
  "/employee/izin": "Permohonan Izin",
  "/employee/jadwal": "Kalender Kerja",
  "/employee/profile": "Profil Karyawan",
  "/employee/notifikasi": "Pusat Notifikasi",
};

const pageSubtitles = {
  "/employee": "Employee Attendance & Activity Center",
  "/employee/absensi": "Validasi wajah, GPS, dan aktivitas hari ini",
};

function SidebarContent({ pathname, onNavigate, employee }) {
  return (
    <>
      <div className="px-6 pb-10">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#3B82F6] text-white">
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold tracking-tight text-[#3B82F6]">
              Corporate EMS
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9AA8BD]/70">
              Management Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-3" aria-label="Navigasi pegawai">
        {employeeNav.map((item) => {
          const isActive =
            item.href === "/employee"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={[
                "group flex min-h-12 items-center gap-4 rounded-r-xl border-l-4 px-5 text-sm transition-all duration-300",
                isActive
                  ? "border-[#3B82F6] bg-[linear-gradient(90deg,rgba(59,130,246,0.1)_0%,rgba(59,130,246,0)_100%)] font-bold text-[#3B82F6]"
                  : "border-transparent text-[#9AA8BD] hover:bg-white/[0.05] hover:text-[#E5EEFF]",
              ].join(" ")}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#2C5B9A]/45 px-6 pt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.05] p-3">
          <Image
            src="/avatar-rina.svg"
            alt={`Foto profil ${employee.name}`}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover ring-2 ring-[#3B82F6]/20"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#E5EEFF]">
              {employee.name}
            </p>
            <p className="text-[11px] text-[#9AA8BD]">{employee.position}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function EmployeeShell({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [employee, setEmployee] = useState({
    name: "Karyawan",
    email: "",
    position: "Employee",
  });
  const title = pageTitles[pathname] || "Corporate EMS";
  const subtitle = pageSubtitles[pathname];
  const currentNav = employeeNav.find((item) =>
    item.href === "/employee" ? pathname === item.href : pathname.startsWith(item.href),
  );
  const CurrentIcon = currentNav?.icon || Building2;
  const isAttendancePage = pathname === "/employee/absensi";

  useEffect(() => {
    let isMounted = true;

    async function loadEmployeeProfile() {
      try {
        const response = await fetch("/api/employee/profile", { cache: "no-store" });
        const payload = await response.json();
        if (isMounted && response.ok && payload.employee) {
          setEmployee(payload.employee);
        }
      } catch {
        // Keep the fallback profile if the session endpoint is not reachable.
      }
    }

    loadEmployeeProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] font-sans text-[#F1F5F9]">
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup navigasi"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="employee-shell-sidebar relative flex h-full w-[280px] flex-col border-r border-[#334155] bg-[#14141E] py-8 shadow-2xl">
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-xl border border-[#2C5B9A]/45 text-[#9AA8BD]"
            >
              <X size={18} />
            </button>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              employee={employee}
            />
          </aside>
        </div>
      ) : null}

      <aside className="employee-shell-sidebar fixed left-0 top-0 z-40 hidden h-full w-[280px] flex-col border-r border-[#334155] bg-[#14141E] py-8 lg:flex">
        <SidebarContent pathname={pathname} employee={employee} />
      </aside>

      <main className="min-h-screen bg-[#0B1120] lg:ml-[280px]">
        <header
          className={[
            "employee-command-header sticky top-0 z-30 flex min-h-[76px] w-full items-center justify-between border-b px-4 backdrop-blur-xl sm:px-6",
            isAttendancePage
              ? "employee-command-header-attendance border-[#2DD4BF]/18 bg-[radial-gradient(circle_at_26%_0%,rgba(45,212,191,.12),transparent_24rem),linear-gradient(180deg,rgba(17,27,43,.96),rgba(11,17,32,.9))] shadow-[0_18px_42px_rgba(0,0,0,.3)]"
              : "border-[#334155] bg-[#0B1120]/90",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#2C5B9A]/45 text-[#9AA8BD] lg:hidden"
            >
              <Menu size={21} />
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={[
                  "hidden size-11 shrink-0 place-items-center rounded-2xl border sm:grid",
                  isAttendancePage
                    ? "border-[#2DD4BF]/26 bg-[#2DD4BF]/10 text-[#5EEAD4] shadow-[0_10px_24px_rgba(45,212,191,.12)]"
                    : "border-[#334155] bg-[#132238] text-[#9AA8BD]",
                ].join(" ")}
              >
                <CurrentIcon size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="truncate text-xl font-extrabold tracking-tight text-[#E5EEFF]">
                    {title}
                  </h1>
                  {isAttendancePage ? (
                    <span className="hidden shrink-0 rounded-full border border-[#34D399]/24 bg-[#34D399]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#86EFAC] md:inline-flex">
                      Online
                    </span>
                  ) : null}
                </div>
                {subtitle ? (
                  <p className="mt-0.5 hidden truncate text-xs font-medium text-[#9AA8BD] sm:block">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/employee/notifikasi"
                className="relative grid size-10 place-items-center rounded-xl text-[#9AA8BD] transition-colors hover:text-[#3B82F6]"
                aria-label="Buka notifikasi"
              >
                <Bell size={24} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#3B82F6] ring-2 ring-[#081322]" />
              </Link>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl text-[#9AA8BD] transition-colors hover:text-[#3B82F6]"
                aria-label="Pengaturan"
              >
                <Settings size={24} />
              </button>
              <ThemeToggle placement="inline" />
            </div>
            <div className="hidden h-8 w-px bg-[#2C5B9A]/45 sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-[#E5EEFF]">{employee.name}</p>
                <p className="text-[11px] text-[#9AA8BD]">{employee.position}</p>
              </div>
              <Image
                src="/avatar-rina.svg"
                alt={`Foto profil ${employee.name}`}
                width={40}
                height={40}
                className="size-10 rounded-full border-2 border-[#3B82F6]/20 object-cover"
              />
              <ChevronDown size={16} className="hidden text-[#9AA8BD] sm:block" />
              <div className="hidden sm:block">
                <LogoutButton audience="employee" />
              </div>
            </div>
          </div>
        </header>

        <div className={pathname === "/employee/absensi" ? "p-4 sm:p-5" : "p-4 sm:p-6"}>
          {children}
        </div>
      </main>
    </div>
  );
}
