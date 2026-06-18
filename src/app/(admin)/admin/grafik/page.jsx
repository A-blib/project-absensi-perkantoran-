import { AdminShell } from "@/features/dashboard/admin-shell";
import { AttendanceCharts } from "@/components/charts/attendance-charts";
import { getAdminAttendanceDashboard } from "@/server/repositories/attendance-repository";

export default async function GraphicPage() {
  const dashboard = await getAdminAttendanceDashboard();

  return (
    <AdminShell>
      <h1 className="mb-6 text-3xl font-bold">Grafik Kehadiran</h1>
      <AttendanceCharts
        statusCounts={dashboard.counts}
        weeklyData={dashboard.weeklyData}
      />
    </AdminShell>
  );
}
