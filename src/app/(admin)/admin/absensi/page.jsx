import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminAttendancePanel } from "@/features/attendance/admin-attendance-panel";
import { getAttendanceRecap } from "@/server/repositories/attendance-repository";

export default async function AttendanceAdminPage() {
  const rows = await getAttendanceRecap();

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Absensi</h1>
        <p className="mt-2 text-sm text-slate-500">
          Monitoring absensi karyawan dari data check-in dan check-out yang tersimpan.
        </p>
      </div>
      <AdminAttendancePanel data={rows} />
    </AdminShell>
  );
}
