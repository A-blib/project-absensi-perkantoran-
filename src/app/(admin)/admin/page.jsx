import { Clock3, UserCheck, UserX, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceCharts } from "@/components/charts/attendance-charts";
import { AdminShell } from "@/features/dashboard/admin-shell";

const cards = [
  { label: "Total Pegawai", value: "128", icon: Users, tone: "text-blue-600 bg-blue-50" },
  { label: "Hadir Hari Ini", value: "94", icon: UserCheck, tone: "text-emerald-600 bg-emerald-50" },
  { label: "Telat", value: "11", icon: Clock3, tone: "text-amber-600 bg-amber-50" },
  { label: "Tidak Hadir", value: "23", icon: UserX, tone: "text-red-600 bg-red-50" },
];

export default function AdminDashboardPage() {
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
                <p className="mt-2 text-3xl font-bold text-slate-950">{item.value}</p>
              </div>
              <div className={`grid size-11 place-items-center rounded-lg ${item.tone}`}>
                <item.icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="mt-6">
        <AttendanceCharts />
      </section>

      <section className="mt-6">
        <Card className="p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Aktivitas Terbaru</h2>
              <p className="text-sm text-slate-500">Data contoh untuk kerangka awal.</p>
            </div>
            <Badge status="hadir">Realtime</Badge>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {["Rina masuk 08:01", "Budi telat 12 menit", "Sari izin cuti tahunan"].map(
              (item) => (
                <div key={item} className="py-3 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ),
            )}
          </div>
        </Card>
      </section>
    </AdminShell>
  );
}
