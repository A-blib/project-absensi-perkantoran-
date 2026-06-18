import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminUsersPanel } from "@/features/users/admin-users-panel";
import { listDivisions } from "@/server/repositories/division-repository";
import { listPositions } from "@/server/repositories/position-repository";
import { listUsers } from "@/server/repositories/user-repository";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const [users, divisions, positions] = await Promise.all([
    listUsers(),
    listDivisions({ activeOnly: true }),
    listPositions({ activeOnly: true }),
  ]);

  return (
    <AdminShell>
      <AdminUsersPanel
        initialUsers={users}
        divisions={divisions}
        positions={positions}
      />
    </AdminShell>
  );
}
