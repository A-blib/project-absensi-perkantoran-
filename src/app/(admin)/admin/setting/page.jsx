import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminSettingsPanel } from "@/features/settings/admin-settings-panel";

export default function SettingPage() {
  return (
    <AdminShell>
      <AdminSettingsPanel />
    </AdminShell>
  );
}
