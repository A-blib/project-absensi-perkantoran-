import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminLeavePanel } from "@/features/leaves/admin-leave-panel";
import { listLeaveRequests } from "@/server/repositories/leave-repository";

export const dynamic = "force-dynamic";

export default async function AdminLeavePage() {
  const requests = await listLeaveRequests();

  return (
    <AdminShell>
      <AdminLeavePanel initialRequests={requests} />
    </AdminShell>
  );
}
