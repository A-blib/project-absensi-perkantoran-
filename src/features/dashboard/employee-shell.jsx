"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/logout-button";
import { EmployeeSessionGuard } from "@/features/dashboard/employee-session-guard";
import { employeeNav } from "@/lib/constants/navigation";
import { useCurrentUser } from "@/lib/browser/use-current-user";
import {
  employeeNotificationEvent,
  getEmployeeUnreadNotificationCount,
} from "@/lib/browser/employee-notification-store";

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
};

function getEmployeeTitle(user) {
  return user?.position || user?.division || "Pegawai";
}

function SidebarContent({ pathname, onNavigate, user, unreadCount = 0 }) {
  const displayName = user?.name || "Pegawai";
  const displayTitle = getEmployeeTitle(user);
  const avatarAlt = `Foto profil ${displayName}`;

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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2C6D6]/60">
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
                  : "border-transparent text-[#C2C6D6] hover:bg-white/[0.05] hover:text-[#D4E4FA]",
              ].join(" ")}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
              {item.href === "/employee/notifikasi" && unreadCount > 0 ? (
                <span className="ml-auto min-w-5 rounded-full bg-[#3B82F6] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[#24344D]/50 px-6 pt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.05] p-3">
          <Image
            src="/avatar-rina.svg"
            alt={avatarAlt}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover ring-2 ring-[#3B82F6]/20"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#D4E4FA]">
              {displayName}
            </p>
            <p className="text-[11px] text-[#C2C6D6]">{displayTitle}</p>
          </div>
          <LogoutButton audience="employee" />
        </div>
      </div>
    </>
  );
}

export function EmployeeShell({ children, initialUser = null }) {
  const pathname = usePathname();
  const { user } = useCurrentUser(initialUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const title = pageTitles[pathname] || "Corporate EMS";
  const subtitle = pageSubtitles[pathname];
  const displayName = user?.name || "Pegawai";
  const displayTitle = getEmployeeTitle(user);
  const avatarAlt = `Foto profil ${displayName}`;

  useEffect(() => {
    function refreshUnreadCount() {
      setUnreadCount(getEmployeeUnreadNotificationCount(user?.id));
    }

    refreshUnreadCount();
    window.addEventListener(employeeNotificationEvent, refreshUnreadCount);
    window.addEventListener("storage", refreshUnreadCount);
    window.addEventListener("focus", refreshUnreadCount);

    return () => {
      window.removeEventListener(employeeNotificationEvent, refreshUnreadCount);
      window.removeEventListener("storage", refreshUnreadCount);
      window.removeEventListener("focus", refreshUnreadCount);
    };
  }, [user?.id]);

  return (
    <div className="employee-theme min-h-screen bg-[#0B1220] font-sans text-[#D4E4FA]">
      <EmployeeSessionGuard />
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup navigasi"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] flex-col border-r border-[#24344D] bg-[linear-gradient(180deg,#0F1B2E_0%,#0B1220_100%)] py-8 shadow-2xl">
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-xl border border-[#24344D] text-[#C2C6D6]"
            >
              <X size={18} />
            </button>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              user={user}
              unreadCount={unreadCount}
            />
          </aside>
        </div>
      ) : null}

      <aside className="fixed left-0 top-0 z-40 hidden h-full w-[280px] flex-col border-r border-[#24344D] bg-[linear-gradient(180deg,#0F1B2E_0%,#0B1220_100%)] py-8 lg:flex">
        <SidebarContent pathname={pathname} user={user} unreadCount={unreadCount} />
      </aside>

      <main className="min-h-screen bg-[#0B1220] lg:ml-[280px]">
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-[#24344D] bg-[#0B1220]/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setMobileOpen(true)}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#24344D] text-[#C2C6D6] lg:hidden"
            >
              <Menu size={21} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-[#D4E4FA]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 hidden truncate text-xs font-medium text-[#C2C6D6] sm:block">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/employee/notifikasi"
                className="relative grid size-10 place-items-center rounded-xl text-[#C2C6D6] transition-colors hover:text-[#3B82F6]"
                aria-label="Buka notifikasi"
              >
                <Bell size={24} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[#3B82F6] px-1 text-[10px] font-bold text-white ring-2 ring-[#0B1220]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl text-[#C2C6D6] transition-colors hover:text-[#3B82F6]"
                aria-label="Pengaturan"
              >
                <Settings size={24} />
              </button>
            </div>
            <div className="hidden h-8 w-px bg-[#24344D] sm:block" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-[#D4E4FA]">{displayName}</p>
                <p className="text-[11px] text-[#C2C6D6]">{displayTitle}</p>
              </div>
              <Image
                src="/avatar-rina.svg"
                alt={avatarAlt}
                width={40}
                height={40}
                className="size-10 rounded-full border-2 border-[#3B82F6]/20 object-cover"
              />
              <ChevronDown size={16} className="hidden text-[#C2C6D6] sm:block" />
              <div className="hidden sm:block">
                <LogoutButton audience="employee" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
