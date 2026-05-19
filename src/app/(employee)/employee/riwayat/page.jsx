import { MapPinned } from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const history = [
  ["18 Mei 2026", "Hadir", "hadir", "08:01 - 17:02"],
  ["17 Mei 2026", "Telat", "telat", "08:16 - 17:01"],
  ["16 Mei 2026", "Izin/Cuti", "izin", "--:--"],
];

export default function EmployeeHistoryPage() {
  return (
    <EmployeeShell>
      <h1 className="text-2xl font-bold">Riwayat</h1>
      <div className="mt-6 grid gap-4">
        {history.map(([date, label, status, time]) => (
          <Card key={date} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 size-3 rounded-full bg-blue-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">{date}</p>
                  <Badge status={status}>{label}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">{time}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <MapPinned size={14} />
                  Kantor Pusat
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </EmployeeShell>
  );
}
