import { AdminShell } from "@/features/dashboard/admin-shell";
import { Card } from "@/components/ui/card";

export default function AttendanceAdminPage() {
  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Absensi</h1>
      <Card className="mt-6 p-6">
        <p className="text-sm text-slate-500">
          Kerangka monitoring absensi harian untuk tim pengembang fitur kamera,
          geolocation, dan watermark foto.
        </p>
      </Card>
    </AdminShell>
  );
}
