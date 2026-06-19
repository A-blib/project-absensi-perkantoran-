"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/logout-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  employeeLeaveSubNav,
  employeeNav,
  employeeProfileSubNav,
  employeeScheduleSubNav,
} from "@/lib/constants/navigation";

const pageTitles = {
  "/employee": "Dashboard Overview",
  "/employee/absensi": "Panel Absensi",
  "/employee/riwayat": "Data Kehadiran",
  "/employee/izin": "Permohonan Izin",
  "/employee/riwayat-izin": "Riwayat Izin",
  "/employee/jadwal": "Kalender Kerja",
  "/employee/upcoming-activities": "Upcoming Activities",
  "/employee/profile": "Profil Karyawan",
  "/employee/dokumen": "Dokumen Kepegawaian",
  "/employee/notifikasi": "Pusat Notifikasi",
};

const pageSubtitles = {
  "/employee": "Employee Attendance & Activity Center",
  "/employee/absensi": "Validasi wajah, GPS, dan aktivitas hari ini",
  "/employee/jadwal": "Sinkronisasi kalender, shift, dan agenda kerja",
  "/employee/riwayat-izin": "Arsip pengajuan cuti, izin, sakit, dan dispensasi",
  "/employee/upcoming-activities": "Agenda kerja mendatang dari jadwal bulan aktif",
  "/employee/dokumen": "Arsip resmi dokumen karyawan",
};

function isActiveNavItem(pathname, href) {
  if (href === "/employee") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const employeeSubNavGroups = {
  "/employee/izin": employeeLeaveSubNav,
  "/employee/jadwal": employeeScheduleSubNav,
  "/employee/profile": employeeProfileSubNav,
};

function SidebarContent({ pathname, onNavigate, employee, openDropdowns, onToggleDropdown }) {
  return (
    <>
      <div className="shrink-0 px-6 pb-6">
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

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3 pr-3" aria-label="Navigasi pegawai">
        {employeeNav.map((item) => {
          const subNavItems = employeeSubNavGroups[item.href] || [];
          const hasSubNav = subNavItems.length > 0;
          const hasActiveChild =
            hasSubNav && subNavItems.some((child) => isActiveNavItem(pathname, child.href));
          const isActive = isActiveNavItem(pathname, item.href) || hasActiveChild;
          const isOpen = Boolean(openDropdowns[item.href]);

          return (
            <div key={item.href}>
              {hasSubNav ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => onToggleDropdown(item.href)}
                  className={[
                    "group flex min-h-12 w-full items-center gap-4 rounded-full border px-4 text-left text-sm transition-all duration-300",
                    isActive
                      ? "border-[#3B82F6]/45 bg-[radial-gradient(circle_at_88%_50%,rgba(56,189,248,.16),transparent_8rem),linear-gradient(90deg,rgba(37,99,235,.30),rgba(56,189,248,.10))] font-bold text-[#60A5FA] shadow-[0_10px_24px_rgba(0,0,0,.16),inset_0_1px_0_rgba(255,255,255,.06)]"
                      : "border-transparent text-[#9AA8BD] hover:border-[#38BDF8]/20 hover:bg-white/[0.05] hover:text-[#E5EEFF]",
                  ].join(" ")}
                >
                  <item.icon size={22} />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <ChevronRight
                    size={16}
                    className={[
                      "transition-transform duration-200",
                      isOpen ? "rotate-90" : "",
                    ].join(" ")}
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onNavigate}
                  className={[
                    "group flex min-h-12 items-center gap-4 rounded-full border px-4 text-sm transition-all duration-300",
                    isActive
                      ? "border-[#3B82F6]/45 bg-[radial-gradient(circle_at_88%_50%,rgba(56,189,248,.16),transparent_8rem),linear-gradient(90deg,rgba(37,99,235,.30),rgba(56,189,248,.10))] font-bold text-[#60A5FA] shadow-[0_10px_24px_rgba(0,0,0,.16),inset_0_1px_0_rgba(255,255,255,.06)]"
                      : "border-transparent text-[#9AA8BD] hover:border-[#38BDF8]/20 hover:bg-white/[0.05] hover:text-[#E5EEFF]",
                  ].join(" ")}
                >
                  <item.icon size={22} />
                  <span>{item.label}</span>
                </Link>
              )}

              {hasSubNav && isOpen ? (
                <div className="ml-7 mt-2 space-y-1.5 border-l border-[#2C5B9A]/35 pl-3">
                  {subNavItems.map((child) => {
                    const childActive = isActiveNavItem(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={childActive ? "page" : undefined}
                        onClick={onNavigate}
                        className={[
                          "flex min-h-10 items-center gap-3 rounded-full border px-3 text-sm transition-all duration-300",
                          childActive
                            ? "border-[#38BDF8]/30 bg-[#0B3B66]/70 font-bold text-[#7DD3FC]"
                            : "border-transparent text-[#9AA8BD] hover:border-[#38BDF8]/20 hover:bg-white/[0.05] hover:text-[#E5EEFF]",
                        ].join(" ")}
                      >
                        <child.icon size={18} />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-[#2C5B9A]/35 px-5 pt-4">
        <div className="flex items-center gap-3 rounded-[24px] border border-[#38BDF8]/12 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,.12),transparent_8rem),rgba(255,255,255,.05)] p-3 shadow-[0_12px_26px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.06)]">
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
  const [manualDropdowns, setManualDropdowns] = useState({});
  const [employee, setEmployee] = useState({
    name: "Karyawan",
    email: "",
    position: "Employee",
  });
  const title = pageTitles[pathname] || "Corporate EMS";
  const subtitle = pageSubtitles[pathname];
  const allEmployeeSubNav = [
    ...employeeLeaveSubNav,
    ...employeeScheduleSubNav,
    ...employeeProfileSubNav,
  ];
  const currentSubNav = allEmployeeSubNav.find((item) => isActiveNavItem(pathname, item.href));
  const currentNav = employeeNav.find((item) => isActiveNavItem(pathname, item.href));
  const CurrentIcon = currentSubNav?.icon || currentNav?.icon || Building2;
  const openDropdowns = Object.fromEntries(
    Object.entries(employeeSubNavGroups).map(([href, items]) => {
      const routeActive = items.some((item) => isActiveNavItem(pathname, item.href));
      return [href, manualDropdowns[href] ?? routeActive];
    })
  );
  const toggleDropdown = (href) => {
    const routeActive = employeeSubNavGroups[href]?.some((item) =>
      isActiveNavItem(pathname, item.href)
    );
    setManualDropdowns((value) => {
      const nextOpen = value[href] === undefined ? !routeActive : !value[href];
      return Object.fromEntries(
        Object.keys(employeeSubNavGroups).map((groupHref) => [
          groupHref,
          groupHref === href ? nextOpen : false,
        ])
      );
    });
  };

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
    <div className="employee-app-shell min-h-screen bg-[#0B1120] font-sans text-[#F1F5F9]">
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup navigasi"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="employee-shell-sidebar relative flex h-full w-[280px] flex-col border-r border-[#334155] bg-[#14141E] pb-5 pt-8 shadow-2xl">
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
              openDropdowns={openDropdowns}
              onToggleDropdown={toggleDropdown}
            />
          </aside>
        </div>
      ) : null}

      <aside className="employee-shell-sidebar fixed left-0 top-0 z-40 hidden h-full w-[280px] flex-col border-r border-[#334155] bg-[#14141E] pb-5 pt-8 lg:flex">
        <SidebarContent
          pathname={pathname}
          employee={employee}
          openDropdowns={openDropdowns}
          onToggleDropdown={toggleDropdown}
        />
      </aside>

      <main className="min-h-screen bg-[#0B1120] lg:ml-[280px]">
        <header
          className={[
            "employee-command-header z-30 mx-3 mt-3 flex min-h-[76px] items-center justify-between rounded-3xl border border-[#38BDF8]/24 bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,.16),transparent_22rem),radial-gradient(circle_at_70%_0%,rgba(34,197,94,.10),transparent_18rem),linear-gradient(180deg,rgba(20,33,54,.98),rgba(11,17,32,.92))] px-4 shadow-[0_18px_42px_rgba(0,0,0,.34),inset_0_-1px_0_rgba(56,189,248,.10)] backdrop-blur-xl sm:px-6",
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
                  "border-[#38BDF8]/35 bg-[#38BDF8]/12 text-[#BAE6FD] shadow-[0_12px_28px_rgba(56,189,248,.16)]",
                ].join(" ")}
              >
                <CurrentIcon size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="truncate text-xl font-extrabold tracking-tight text-[#E5EEFF]">
                    {title}
                  </h1>
                  <span className="hidden shrink-0 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#BAE6FD] md:inline-flex">
                    Synced
                  </span>
                </div>
                {subtitle ? (
                  <p className="mt-0.5 hidden truncate text-xs font-medium text-[#9AA8BD] sm:block">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/employee/notifikasi"
                className={[
                  "relative grid size-10 place-items-center rounded-xl transition-colors",
                  "border border-[#2D4568]/70 bg-[#0D1728]/70 text-[#B6C8E3] hover:border-[#38BDF8]/50 hover:text-[#38BDF8]",
                ].join(" ")}
                aria-label="Buka notifikasi"
              >
                <Bell size={24} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[#3B82F6] ring-2 ring-[#081322]" />
              </Link>
              <button
                type="button"
                className={[
                  "grid size-10 place-items-center rounded-xl transition-colors",
                  "border border-[#2D4568]/70 bg-[#0D1728]/70 text-[#B6C8E3] hover:border-[#38BDF8]/50 hover:text-[#38BDF8]",
                ].join(" ")}
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
