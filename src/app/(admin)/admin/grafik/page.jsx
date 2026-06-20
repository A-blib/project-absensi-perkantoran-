import { AdminShell } from "@/features/dashboard/admin-shell";
import { AttendanceAnalyticsCharts } from "@/components/charts/attendance-analytics-charts";
import { getAttendanceAnalyticsData } from "@/server/repositories/attendance-repository";

export const dynamic = "force-dynamic";

export default async function GraphicPage({ searchParams }) {
  const params = await searchParams;
  const period = ["weekly", "monthly", "yearly"].includes(params?.period)
    ? params.period
    : "monthly";

  const data = await getAttendanceAnalyticsData(period);

  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          Analytics
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Grafik Kehadiran
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Analisis tren kehadiran karyawan berdasarkan periode waktu.
        </p>
      </div>
      <AttendanceAnalyticsCharts initialData={data} />
    </AdminShell>
  );
}
