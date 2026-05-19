import Link from "next/link";
import { LogoutButton } from "@/features/auth/logout-button";
import { employeeNav } from "@/lib/constants/navigation";

export function EmployeeShell({ children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-50 text-slate-950">
      <main className="flex-1 px-4 pb-28 pt-5">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-slate-200 bg-white px-2 pb-3 pt-2">
        {employeeNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-500 hover:bg-blue-50 hover:text-blue-700"
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
        <LogoutButton audience="employee" variant="bottom-nav" />
      </nav>
    </div>
  );
}
