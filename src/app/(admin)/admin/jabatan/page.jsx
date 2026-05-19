import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminPositionsPanel } from "@/features/positions/admin-positions-panel";
import { listDivisions } from "@/server/repositories/division-repository";
import { listPositions } from "@/server/repositories/position-repository";

export const dynamic = "force-dynamic";

export default async function PositionsPage() {
  const [positions, divisions] = await Promise.all([
    listPositions(),
    listDivisions({ activeOnly: true }),
  ]);

  return (
    <AdminShell>
      <AdminPositionsPanel initialPositions={positions} divisions={divisions} />
    </AdminShell>
  );
}
