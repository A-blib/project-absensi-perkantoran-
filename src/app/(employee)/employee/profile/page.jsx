import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { Card } from "@/components/ui/card";

export default function EmployeeProfilePage() {
  return (
    <EmployeeShell>
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card className="mt-6 p-5">
        <div className="mx-auto size-20 rounded-full bg-blue-100" />
        <div className="mt-4 text-center">
          <p className="text-lg font-bold">Rina Pratiwi</p>
          <p className="text-sm text-slate-500">Finance · Pegawai</p>
        </div>
      </Card>
    </EmployeeShell>
  );
}
