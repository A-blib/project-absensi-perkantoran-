import { AdminShell } from "@/features/dashboard/admin-shell";
import { AdminSettingsPanel } from "@/features/settings/admin-settings-panel";
import { getSystemSettings } from "@/server/repositories/settings-repository";

export const dynamic = "force-dynamic";

export default async function SettingPage() {
  const settings = await getSystemSettings();

  return (
    <AdminShell>
      <AdminSettingsPanel initialSettings={settings} />
    </AdminShell>
  );
}
