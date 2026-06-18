import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminDivisionsPanel } from "@/features/divisions/admin-divisions-panel";
import { listDivisions } from "@/server/repositories/division-repository";

export const dynamic = "force-dynamic";

export default async function DivisionsPage() {
  const divisions = await listDivisions();

  return (
    <AdminShell>
      <AdminDivisionsPanel initialDivisions={divisions} />
    </AdminShell>
  );
}
