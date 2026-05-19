import { AdminShell } from "@/features/dashboard/admin-shell";
import { AttendanceCharts } from "@/components/charts/attendance-charts";

export default function GraphicPage() {
  return (
    <AdminShell>
      <h1 className="mb-6 text-3xl font-bold">Grafik Kehadiran</h1>
      <AttendanceCharts />
    </AdminShell>
  );
}
