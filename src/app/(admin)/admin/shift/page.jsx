import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminShiftsPanel } from "@/features/shifts/admin-shifts-panel";
import { listShifts } from "@/server/repositories/shift-repository";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const shifts = await listShifts();

  return (
    <AdminShell>
      <AdminShiftsPanel initialShifts={shifts} />
    </AdminShell>
  );
}
