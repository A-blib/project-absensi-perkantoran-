"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultSystemSettings } from "@/lib/validations/settings";
import { parseGoogleMapsLink } from "@/lib/maps/google-maps";

const tabs = [
  { id: "company", label: "Perusahaan", icon: Building2 },
  { id: "workHours", label: "Jam Kerja", icon: Clock3 },
  { id: "location", label: "Lokasi Kantor", icon: MapPin },
  { id: "attendanceRules", label: "Aturan Absensi", icon: ShieldCheck },
];

const workDayOptions = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export function AdminSettingsPanel({ initialSettings = defaultSystemSettings }) {
  const [activeTab, setActiveTab] = useState("company");
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  const activeSummary = useMemo(() => {
    if (activeTab === "company") {
      return `${settings.company.name} - ${settings.company.timezone}`;
    }

    if (activeTab === "workHours") {
      return `${settings.workHours.startTime} sampai ${settings.workHours.endTime}, toleransi ${settings.workHours.lateTolerance} menit`;
    }

    if (activeTab === "location") {
      return `${settings.location.name}, radius ${settings.location.radiusMeters} meter`;
    }

    const photoRule = settings.attendanceRules.requireCheckInPhoto
      ? "Foto check-in wajib"
      : "Foto check-in opsional";
    return `${photoRule}, ${settings.attendanceRules.oneCheckInPerDay ? "1 check-in per hari" : "multi check-in"}`;
  }, [activeTab, settings]);

  function updateSection(section, field, value) {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    setMessage("");
  }

  function toggleWorkDay(day) {
    setSettings((current) => {
      const days = current.workHours.workDays.includes(day)
        ? current.workHours.workDays.filter((item) => item !== day)
        : [...current.workHours.workDays, day];

      return {
        ...current,
        workHours: {
          ...current.workHours,
          workDays: days,
        },
      };
    });
    setMessage("");
  }

  async function persistSettings(nextSettings, successMessage) {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextSettings),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Pengaturan gagal disimpan.");
      }

      setSettings(result.settings);
      setSavedSettings(result.settings);
      setMessageType("success");
      setMessage(successMessage);
      return true;
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Pengaturan gagal disimpan.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function saveSettings() {
    persistSettings(settings, "Pengaturan sistem berhasil disimpan.");
  }

  function resetSettings() {
    persistSettings(
      defaultSystemSettings,
      "Pengaturan dikembalikan ke nilai awal dan tersimpan.",
    );
  }

  function applyLocationPatch(patch, successMessage) {
    const nextSettings = {
      ...settings,
      location: {
        ...settings.location,
        ...patch,
      },
    };

    setSettings(nextSettings);
    return persistSettings(nextSettings, successMessage);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            System Setting
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Pengaturan Sistem
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Kelola identitas perusahaan, jam kerja dasar, lokasi kantor, dan
            aturan absensi.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={resetSettings}>
            {saving ? <Loader2 className="size-5 animate-spin" /> : <RotateCcw size={18} />}
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="size-5 animate-spin" /> : <Save size={18} />}
            {saving ? "Menyimpan..." : hasChanges ? "Simpan" : "Tersimpan"}
          </Button>
        </div>
      </div>

      {message ? (
        <div
          className={[
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold",
            messageType === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {messageType === "error" ? (
            <TriangleAlert size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          {message}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <nav className="grid gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold",
                    isActive
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-medium text-slate-500">Ringkasan</p>
            <p className="mt-1 text-base font-bold text-slate-950">
              {activeSummary}
            </p>
          </div>
          <div className="p-5">
            {activeTab === "company" ? (
              <CompanySettings
                values={settings.company}
                onChange={(field, value) => updateSection("company", field, value)}
              />
            ) : null}

            {activeTab === "workHours" ? (
              <WorkHoursSettings
                values={settings.workHours}
                onChange={(field, value) => updateSection("workHours", field, value)}
                onToggleDay={toggleWorkDay}
              />
            ) : null}

            {activeTab === "location" ? (
              <LocationSettings
                values={settings.location}
                onChange={(field, value) => updateSection("location", field, value)}
                onApplyLocation={applyLocationPatch}
              />
            ) : null}

            {activeTab === "attendanceRules" ? (
              <AttendanceRulesSettings
                values={settings.attendanceRules}
                onChange={(field, value) =>
                  updateSection("attendanceRules", field, value)
                }
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function CompanySettings({ values, onChange }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field
        label="Nama Perusahaan"
        value={values.name}
        onChange={(value) => onChange("name", value)}
      />
      <Field
        label="Email Perusahaan"
        type="email"
        value={values.email}
        onChange={(value) => onChange("email", value)}
      />
      <Field
        label="Nomor Telepon"
        value={values.phone}
        onChange={(value) => onChange("phone", value)}
      />
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Zona Waktu
        <select
          value={values.timezone}
          onChange={(event) => onChange("timezone", event.target.value)}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm"
        >
          <option value="Asia/Jakarta">Asia/Jakarta</option>
          <option value="Asia/Makassar">Asia/Makassar</option>
          <option value="Asia/Jayapura">Asia/Jayapura</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
        Alamat Kantor
        <textarea
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
          rows={4}
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm"
        />
      </label>
    </div>
  );
}

function WorkHoursSettings({ values, onChange, onToggleDay }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <Field
          label="Jam Masuk"
          type="time"
          value={values.startTime}
          onChange={(value) => onChange("startTime", value)}
        />
        <Field
          label="Toleransi Telat"
          type="number"
          min="0"
          value={values.lateTolerance}
          suffix="menit"
          onChange={(value) => onChange("lateTolerance", Number(value))}
        />
        <Field
          label="Jam Pulang"
          type="time"
          value={values.endTime}
          onChange={(value) => onChange("endTime", value)}
        />
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-semibold text-slate-700">Hari Kerja</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {workDayOptions.map((day) => {
            const checked = values.workDays.includes(day);

            return (
              <label
                key={day}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-semibold",
                  checked
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleDay(day)}
                  className="size-4 accent-blue-600"
                />
                {day}
              </label>
            );
          })}
        </div>
        <p className="text-xs font-medium leading-5 text-slate-500">
          Jam kerja default digunakan untuk karyawan yang belum memiliki shift khusus.
          Karyawan dengan shift akan mengikuti jadwal shift masing-masing.
        </p>
      </div>
    </div>
  );
}

function LocationSettings({ values, onChange, onApplyLocation }) {
  const [mapsMessage, setMapsMessage] = useState("");
  const [mapsMessageType, setMapsMessageType] = useState("success");
  const [resolvingMapsLink, setResolvingMapsLink] = useState(false);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${values.latitude},${values.longitude}`,
  )}`;
  const radiusSize = Math.max(96, Math.min(240, Number(values.radiusMeters) * 1.4));
  const parsedMapsLink = parseGoogleMapsLink(values.googleMapsLink);

  async function applyParsedLocation(location, message) {
    const patch = {
      googleMapsLink: values.googleMapsLink,
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name || values.name,
    };

    onChange("name", patch.name);
    onChange("latitude", patch.latitude);
    onChange("longitude", patch.longitude);

    return onApplyLocation(patch, message);
  }

  async function applyGoogleMapsLink() {
    if (!values.googleMapsLink.trim()) return;

    setResolvingMapsLink(true);
    setMapsMessage("");

    if (parsedMapsLink) {
      const saved = await applyParsedLocation(
        parsedMapsLink,
        "Lokasi kantor berhasil diterapkan dan tersimpan untuk absensi karyawan.",
      );
      setMapsMessageType(saved ? "success" : "error");
      setMapsMessage(
        saved
          ? "Koordinat berhasil diterapkan, tersimpan, dan terhubung ke karyawan."
          : "Koordinat terbaca, tetapi lokasi gagal disimpan.",
      );
      setResolvingMapsLink(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/settings/resolve-maps-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: values.googleMapsLink }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Link Google Maps tidak bisa dibaca.");
      }

      const saved = await applyParsedLocation(
        result.location,
        "Lokasi kantor berhasil diterapkan dan tersimpan untuk absensi karyawan.",
      );
      setMapsMessageType(saved ? "success" : "error");
      setMapsMessage(
        saved
          ? "Koordinat berhasil diterapkan, tersimpan, dan terhubung ke karyawan."
          : "Koordinat terbaca, tetapi lokasi gagal disimpan.",
      );
    } catch (error) {
      setMapsMessageType("error");
      setMapsMessage(error.message || "Link Google Maps tidak bisa dibaca.");
    } finally {
      setResolvingMapsLink(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Link Google Maps
          <div className="flex flex-col gap-2 lg:flex-row">
            <input
              value={values.googleMapsLink}
              onChange={(event) => onChange("googleMapsLink", event.target.value)}
              placeholder="Tempel link Google Maps yang berisi koordinat lokasi"
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400"
            />
            <Button
              type="button"
              variant="outline"
              onClick={applyGoogleMapsLink}
              disabled={!values.googleMapsLink.trim() || resolvingMapsLink}
            >
              {resolvingMapsLink ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <MapPin size={17} />
              )}
              {resolvingMapsLink ? "Membaca Link..." : "Terapkan & Simpan"}
            </Button>
          </div>
        </label>
        {mapsMessage ? (
          <div
            className={[
              "rounded-lg border px-3 py-2 text-xs font-semibold",
              mapsMessageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {mapsMessage}
          </div>
        ) : null}
        <p className="text-xs font-medium leading-5 text-slate-500">
          Tempel link Google Maps dari titik kantor agar koordinat absensi
          terisi otomatis.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nama Lokasi
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={values.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Contoh: Kantor Pusat Jakarta"
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400"
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(values.name || "kantor")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ExternalLink size={17} />
              Cari di Maps
            </a>
          </div>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          label="Radius Valid"
          type="number"
          min="1"
          value={values.radiusMeters}
          suffix="meter"
          onChange={(value) => onChange("radiusMeters", Number(value))}
          hint="Jarak maksimal dari titik kantor agar absensi dianggap valid."
        />
        <Field
          label="Latitude"
          value={values.latitude}
          onChange={(value) => onChange("latitude", value)}
        />
        <Field
          label="Longitude"
          value={values.longitude}
          onChange={(value) => onChange("longitude", value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch">
          <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.22)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-blue-300 bg-blue-500/10"
              style={{ width: `${radiusSize}px`, height: `${radiusSize}px` }}
            />
            <div className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/30">
              <MapPin size={26} />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-sm font-bold text-slate-950">{values.name}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Titik kantor tetap: {values.latitude}, {values.longitude}
              </p>
            </div>
          </div>

          <div className="grid content-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-slate-950">Koordinat Kantor</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Koordinat ini digunakan untuk memvalidasi lokasi pegawai saat absensi.
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <InfoRow label="Latitude" value={values.latitude || "-"} />
              <InfoRow label="Longitude" value={values.longitude || "-"} />
              <InfoRow label="Radius" value={`${values.radiusMeters || 0} meter`} />
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <ExternalLink size={17} />
              Buka di Google Maps
            </a>
          </div>
        </div>
      </div>

      <ToggleRow
        icon={MapPin}
        title="Wajib Validasi Lokasi"
        description="Pegawai hanya bisa absensi saat berada dalam radius kantor."
        checked={values.requireLocation}
        onChange={(value) => onChange("requireLocation", value)}
      />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-950">{value}</span>
    </div>
  );
}

function AttendanceRulesSettings({ values, onChange }) {
  return (
    <div className="grid gap-4">
      <ToggleRow
        icon={CameraIcon}
        title="Wajib Foto Saat Check-in"
        description="Foto check-in akan menjadi bukti kehadiran pegawai."
        checked={values.requireCheckInPhoto}
        onChange={(value) => onChange("requireCheckInPhoto", value)}
      />
      <ToggleRow
        icon={CameraIcon}
        title="Wajib Foto Saat Check-out"
        description="Aktifkan jika perusahaan perlu bukti foto saat pulang."
        checked={values.requireCheckOutPhoto}
        onChange={(value) => onChange("requireCheckOutPhoto", value)}
      />
      <ToggleRow
        icon={MapPin}
        title="Izinkan Absensi di Luar Radius"
        description="Jika aktif, absensi di luar kantor tetap diterima dan diberi catatan."
        checked={values.allowOutsideRadius}
        onChange={(value) => onChange("allowOutsideRadius", value)}
      />
      <ToggleRow
        icon={Clock3}
        title="Izinkan Check-in Lebih Awal"
        description="Pegawai bisa melakukan check-in sebelum jam masuk resmi."
        checked={values.allowEarlyCheckIn}
        onChange={(value) => onChange("allowEarlyCheckIn", value)}
      />
      <ToggleRow
        icon={CalendarDays}
        title="Satu Check-in Per Hari"
        description="Mencegah pegawai membuat lebih dari satu data masuk dalam tanggal yang sama."
        checked={values.oneCheckInPerDay}
        onChange={(value) => onChange("oneCheckInPerDay", value)}
      />
      <Field
        label="Batas Maksimal Check-out"
        type="time"
        value={values.maxCheckOutTime}
        onChange={(value) => onChange("maxCheckOutTime", value)}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  suffix,
  hint,
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <span className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <input
          type={type}
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
        />
        {suffix ? (
          <span className="border-l border-slate-200 bg-slate-50 px-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            {suffix}
          </span>
        ) : null}
      </span>
      {hint ? (
        <span className="text-xs font-medium leading-5 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function ToggleRow({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">
          <Icon size={19} />
        </div>
        <div>
          <p className="font-bold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative h-7 w-12 shrink-0 rounded-full p-1",
          checked ? "bg-blue-600" : "bg-slate-300",
        ].join(" ")}
        aria-pressed={checked}
      >
        <span
          className={[
            "block size-5 rounded-full bg-white shadow-sm",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function CameraIcon(props) {
  return <ShieldCheck {...props} />;
}
