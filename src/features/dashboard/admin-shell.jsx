import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { LogoutButton } from "@/features/auth/logout-button";
import { AdminMobileMenu } from "@/features/dashboard/admin-mobile-menu";
import { adminNav } from "@/lib/constants/navigation";

export function AdminShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <Logo />
        <nav className="mt-8 grid gap-1">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-5">
            <AdminMobileMenu />
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 lg:max-w-md">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder="Cari pegawai, status, tanggal..."
              />
            </div>
            <button className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600">
              <Bell size={18} />
            </button>
            <LogoutButton />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold">Admin HR</p>
                <p className="text-xs text-slate-500">hr@kantor.test</p>
              </div>
              <div className="size-10 rounded-full bg-blue-100" />
            </div>
          </div>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
