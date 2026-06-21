import { Clock3, UserCheck, UserX, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceCharts } from "@/components/charts/attendance-charts";
import { AdminShell } from "@/features/dashboard/admin-shell";
import { getAdminAttendanceDashboard } from "@/server/repositories/attendance-repository";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminAttendanceDashboard();
  const absentToday = dashboard.counts.alpa;
  const cards = [
    {
      label: "Total Pegawai",
      value: dashboard.totalEmployees,
      icon: Users,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Hadir Hari Ini",
      value: dashboard.counts.hadir,
      icon: UserCheck,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Telat",
      value: dashboard.counts.telat,
      icon: Clock3,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Tidak Hadir",
      value: absentToday,
      icon: UserX,
      tone: "text-red-600 bg-red-50",
    },
  ];

  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Ringkasan absensi hari ini
        </h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {item.value}
                </p>
              </div>
              <div className={`grid size-11 place-items-center rounded-lg ${item.tone}`}>
                <item.icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="mt-6">
        <AttendanceCharts
          statusCounts={dashboard.counts}
          weeklyData={dashboard.weeklyData}
        />
      </section>

      <section className="mt-6">
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Aktivitas Terbaru</h2>
              <p className="text-sm text-slate-500">
                Diambil dari absensi karyawan hari ini.
              </p>
            </div>
            <Badge status="hadir">Realtime</Badge>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {dashboard.recentActivities.length ? (
              dashboard.recentActivities.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-slate-700">
                    {item.name} — {item.message}
                  </span>
                  <Badge status={item.status}>
                    {item.status === "hadir" ? "Hadir" : item.status === "telat" ? "Telat" : item.status === "izin" ? "Izin" : item.status === "alpa" ? "Ditolak" : item.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-3 text-sm font-medium text-slate-500">
                Belum ada absensi karyawan yang tercatat hari ini.
              </div>
            )}
          </div>
        </Card>
      </section>
    </AdminShell>
  );
}
