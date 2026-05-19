import { Camera, MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

export default function EmployeeHomePage() {
  return (
    <EmployeeShell>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Selamat pagi,</p>
          <h1 className="text-2xl font-bold">Rina Pratiwi</h1>
        </div>
        <div className="size-12 rounded-full bg-blue-100" />
      </header>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Status hari ini</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">Hadir</p>
          </div>
          <Badge status="hadir">Tervalidasi</Badge>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Masuk</p>
            <p className="mt-1 font-bold">08:01</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Pulang</p>
            <p className="mt-1 font-bold">--:--</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Telat</p>
            <p className="mt-1 font-bold">0m</p>
          </div>
        </div>
      </Card>

      <section className="mt-6">
        <button className="flex h-24 w-full items-center justify-center gap-3 rounded-3xl bg-[#3b82f6] text-lg font-bold text-white shadow-lg shadow-blue-500/20">
          <Camera size={28} />
          Absen Sekarang
        </button>
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="h-52 bg-slate-200" />
        <div className="p-5">
          <p className="text-sm font-bold">Preview Absensi</p>
          <p className="mt-1 text-xs text-slate-500">
            Watermark: 18 Mei 2026, 08:01 WIB
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <MapPinned size={18} className="text-blue-600" />
            Kantor Pusat, Jakarta
          </div>
        </div>
      </Card>
    </EmployeeShell>
  );
}
