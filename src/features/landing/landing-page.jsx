import {
  BarChart3,
  Camera,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";

const features = [
  {
    title: "Kamera Attendance",
    text: "Absensi foto langsung dari kamera perangkat tanpa upload manual.",
    icon: Camera,
  },
  {
    title: "GPS Validation",
    text: "Lokasi absensi tersimpan untuk membantu validasi kehadiran.",
    icon: LocateFixed,
  },
  {
    title: "Realtime Rekap",
    text: "Admin dapat membaca status hadir, telat, izin, dan alpa dengan cepat.",
    icon: Clock3,
  },
  {
    title: "Dashboard Analitik",
    text: "Ringkasan kehadiran membantu admin melihat kondisi kantor lebih cepat.",
    icon: BarChart3,
  },
  {
    title: "Watermark Foto",
    text: "Foto absensi dirancang membawa watermark tanggal dan jam.",
    icon: CheckCircle2,
  },
  {
    title: "Akses Sesuai Role",
    text: "Admin dan karyawan masuk melalui alur login yang berbeda sesuai peran akun.",
    icon: ShieldCheck,
  },
];

const stats = [
  ["GPS", "Validasi lokasi"],
  ["Role", "Admin & karyawan"],
  ["Rekap", "Data kehadiran"],
  ["Mobile", "Absensi dari HP"],
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#fitur" className="hover:text-slate-950">
              Fitur
            </a>
            <a href="#preview" className="hover:text-slate-950">
              Preview
            </a>
            <a href="#statistik" className="hover:text-slate-950">
              Statistik
            </a>
          </nav>
          <Button asChild href="/login" size="sm">
            Login
          </Button>
        </div>
      </header>

      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto grid min-h-[660px] max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="max-w-2xl">
            <Badge>Realtime attendance</Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              System Absen Perkantoran
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Aplikasi absensi untuk karyawan dan admin kantor: mencatat
              kehadiran dari HP, memvalidasi lokasi, dan menampilkan rekap
              dalam dashboard yang mudah dibaca.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild href="/login" size="lg">
                Login
              </Button>
              <Button asChild href="#fitur" variant="outline" size="lg">
                Lihat Fitur
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                GPS validation
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                Dashboard analitik
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
                Akses sesuai role
              </span>
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-7xl px-5 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">
            Dibuat untuk alur absensi harian yang sederhana.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="p-5">
              <feature.icon className="size-9 rounded-lg bg-blue-50 p-2 text-blue-600" />
              <h3 className="mt-5 text-lg font-bold text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="preview" className="border-y border-slate-100 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <PreviewPanel title="Employee Mobile UI" mode="mobile" />
            <PreviewPanel title="Admin Dashboard UI" mode="admin" />
          </div>
        </div>
      </section>

      <section id="statistik" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-3xl font-bold text-slate-950">{value}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#334155] px-5 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Mulai rapikan absensi kantor.</h2>
            <p className="mt-3 max-w-xl text-slate-200">
              Login sebagai admin atau pegawai untuk melihat alur utama sistem.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild href="/login" size="lg">
              Mulai Sekarang
            </Button>
            <Button asChild href="#preview" variant="outline" size="lg" className="border-white/30 bg-white text-slate-900 hover:bg-blue-50">
              Lihat Preview
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">Dashboard</p>
                <p className="mt-1 text-xl font-bold text-slate-950">Kehadiran Hari Ini</p>
              </div>
              <Badge status="hadir">Live</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["128", "Total Pegawai"],
                ["94", "Hadir"],
                ["11", "Telat"],
                ["23", "Belum hadir"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-950">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 h-32 rounded-lg bg-white p-3 ring-1 ring-slate-100">
              <div className="flex h-full items-end gap-3">
                {[42, 68, 55, 82, 74, 90, 76].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-md bg-blue-500"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[260px] rounded-[28px] border border-slate-200 bg-slate-950 p-3 shadow-lg">
            <div className="rounded-[22px] bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Halo, Rina</p>
                  <p className="font-bold text-slate-950">Senin, 08:02</p>
                </div>
                <div className="size-10 rounded-full bg-blue-100" />
              </div>
              <div className="mt-5 rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-semibold text-blue-700">Status Hari Ini</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">Hadir</p>
                <p className="mt-2 text-xs text-slate-500">Masuk 08:01 · Pulang --:--</p>
              </div>
              <button className="mt-5 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#3b82f6] font-bold text-white">
                <Camera size={20} />
                Absen Cepat
              </button>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                <MapPinned size={16} className="text-blue-600" />
                Lokasi kantor tervalidasi
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel({ title, mode }) {
  return (
    <Card className="p-5">
      <h3 className="text-xl font-bold text-slate-950">{title}</h3>
      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
        {mode === "mobile" ? (
          <div className="mx-auto max-w-sm space-y-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-950">Status: Hadir</p>
              <p className="text-xs text-slate-500">Watermark 18 Mei 2026, 08:01 WIB</p>
            </div>
            <div className="h-36 rounded-lg bg-slate-200" />
            <Button className="w-full">Buka Kamera</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-44 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-bold">Kehadiran Mingguan</p>
              <div className="mt-6 flex h-24 items-end gap-2">
                {[40, 60, 72, 50, 85].map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t bg-blue-500"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="h-44 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-bold">Rekap Status</p>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <Badge status="hadir">Hadir 74%</Badge>
                <Badge status="telat">Telat 9%</Badge>
                <Badge status="izin">Izin 8%</Badge>
                <Badge status="alpa">Alpa 9%</Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
