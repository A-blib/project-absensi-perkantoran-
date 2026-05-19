import { AdminShell } from "@/features/dashboard/admin-shell";
import { getAttendanceRecap } from "@/server/repositories/attendance-repository";
import { AttendanceRecapTable } from "@/components/tables/attendance-recap-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function RecapPage() {
  const rows = await getAttendanceRecap();

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Reports
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Rekap Absensi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Fokus awal untuk admin membaca data cepat dan rapi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Filter Tanggal</Button>
          <Button>Export</Button>
        </div>
      </div>
      <Card>
        <AttendanceRecapTable data={rows} />
      </Card>
    </AdminShell>
  );
}
