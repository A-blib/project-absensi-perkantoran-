import { Camera } from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmployeeAttendancePage() {
  return (
    <EmployeeShell>
      <h1 className="text-2xl font-bold">Absensi</h1>
      <Card className="mt-6 p-5 text-center">
        <Camera className="mx-auto size-14 rounded-full bg-blue-50 p-3 text-blue-600" />
        <p className="mt-4 font-bold">Kerangka kamera absensi</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Tim kamera dapat menghubungkan getUserMedia, capture foto otomatis,
          watermark tanggal/jam, dan geolocation di sini.
        </p>
        <Button className="mt-5 w-full">Buka Kamera</Button>
      </Card>
    </EmployeeShell>
  );
}
