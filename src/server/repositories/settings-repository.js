import { createSupabaseServerClient } from "@/server/db/client";
import {
  defaultSystemSettings,
  systemSettingsSchema,
} from "@/lib/validations/settings";

const SETTINGS_KEY = "system_settings";

function isMissingSettingsTable(error) {
  return (
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  );
}

function normalizeSettings(value) {
  const parsed = systemSettingsSchema.safeParse({
    ...defaultSystemSettings,
    ...(value || {}),
    company: {
      ...defaultSystemSettings.company,
      ...(value?.company || {}),
    },
    workHours: {
      ...defaultSystemSettings.workHours,
      ...(value?.workHours || {}),
    },
    location: {
      ...defaultSystemSettings.location,
      ...(value?.location || {}),
    },
    attendanceRules: {
      ...defaultSystemSettings.attendanceRules,
      ...(value?.attendanceRules || {}),
    },
  });

  return parsed.success ? parsed.data : defaultSystemSettings;
}

export async function getSystemSettings() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (isMissingSettingsTable(error)) {
    return defaultSystemSettings;
  }

  if (error) {
    throw new Error(`Gagal mengambil pengaturan sistem: ${error.message}`);
  }

  return normalizeSettings(data?.value);
}

export async function saveSystemSettings(input) {
  const settings = systemSettingsSchema.parse(input);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .upsert(
      {
        key: SETTINGS_KEY,
        value: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )
    .select("value")
    .single();

  if (error) {
    throw new Error(`Gagal menyimpan pengaturan sistem: ${error.message}`);
  }

  return normalizeSettings(data.value);
}
