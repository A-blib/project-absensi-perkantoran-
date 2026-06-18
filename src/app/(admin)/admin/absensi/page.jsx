import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminAttendancePanel } from "@/features/attendance/admin-attendance-panel";
import { getAttendanceRecap } from "@/server/repositories/attendance-repository";

export default async function AttendanceAdminPage() {
  const rows = await getAttendanceRecap();

  return (
    <AdminShell>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          Monitoring
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
          Absensi
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Pantau check-in, check-out, status kehadiran, dan lokasi absensi
          karyawan dari satu tampilan.
        </p>
      </div>
      <AdminAttendancePanel data={rows} />
    </AdminShell>
  );
}
