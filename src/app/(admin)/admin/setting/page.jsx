import { AdminShell } from "@/features/dashboard/admin-shell";
import { Card } from "@/components/ui/card";

export default function SettingPage() {
  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Setting</h1>
      <Card className="mt-6 p-6">
        <p className="text-sm text-slate-500">
          Kerangka pengaturan sistem: jam kerja, toleransi telat, lokasi kantor,
          aturan upload, dan reset session harian.
        </p>
      </Card>
    </AdminShell>
  );
}
