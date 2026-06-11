"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  Info,
  Search,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const initialNotifications = [
  {
    title: "Absensi berhasil",
    body: "Absensi masuk tercatat pukul 08:00:22 WIB.",
    time: "2 menit lalu",
    category: "Absensi",
    tone: "emerald",
    Icon: CheckCircle2,
    unread: true,
  },
  {
    title: "Terlambat masuk",
    body: "Kamu terlambat 14 menit pada 04/06/2026.",
    time: "Kemarin",
    category: "Absensi",
    tone: "amber",
    Icon: TriangleAlert,
    unread: true,
  },
  {
    title: "Izin disetujui",
    body: "Pengajuan sakit tanggal 28/05/2026 disetujui admin.",
    time: "1 minggu lalu",
    category: "Izin",
    tone: "sky",
    Icon: ClipboardCheck,
    unread: false,
  },
  {
    title: "Izin ditolak",
    body: "Pengajuan izin tanggal 22/05/2026 perlu revisi alasan.",
    time: "2 minggu lalu",
    category: "Izin",
    tone: "red",
    Icon: XCircle,
    unread: false,
  },
  {
    title: "Informasi dari admin",
    body: "Briefing divisi dilakukan Jumat pukul 09:00 WIB.",
    time: "3 minggu lalu",
    category: "Info",
    tone: "slate",
    Icon: Info,
    unread: false,
  },
];

const categories = ["Semua", "Absensi", "Izin", "Info"];

const toneClasses = {
  emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  sky: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  red: "bg-red-400/10 text-red-300 border-red-400/20",
  slate: "bg-slate-400/10 text-slate-300 border-slate-400/20",
};

export default function EmployeeNotificationsPage() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [readAll, setReadAll] = useState(false);
  const [query, setQuery] = useState("");

  const notifications = useMemo(() => {
    return initialNotifications.filter((item) => {
      const matchesCategory =
        activeCategory === "Semua" || item.category === activeCategory;
      const matchesQuery = `${item.title} ${item.body}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <EmployeeShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-[#8B9DB5]">Notification center</p>
          <h2 className="mt-1 text-2xl font-bold text-[#d4e4fa]">
            Pusat Notifikasi
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setReadAll(true)}
          className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#3b82f6] px-5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-[#60a5fa]"
        >
          <BellRing size={18} />
          Tandai Semua Dibaca
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="glass-panel rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#c2c6d6]">
            <Filter size={18} className="text-[#60a5fa]" />
            Filter Kategori
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={[
                  "flex min-h-11 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-semibold transition",
                  activeCategory === category
                    ? "bg-[#3b82f6] text-white"
                    : "text-[#c2c6d6] hover:bg-[#0B1220]",
                ].join(" ")}
              >
                {category}
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">
                  {
                    initialNotifications.filter(
                      (item) => category === "Semua" || item.category === category,
                    ).length
                  }
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="glass-panel rounded-3xl p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B9DB5]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari notifikasi"
                className="min-h-12 w-full rounded-2xl border border-[#24344D] bg-[#0B1220] pl-11 pr-4 text-sm text-[#d4e4fa] outline-none transition placeholder:text-[#64748b] focus:border-[#3b82f6]"
              />
            </div>
            <p className="text-sm text-[#8B9DB5]">
              {notifications.length} notifikasi ditemukan
            </p>
          </div>

          <div className="space-y-3">
            {notifications.map(({ title, body, time, category, tone, Icon, unread }) => (
              <article
                key={`${title}-${time}`}
                className="rounded-3xl border border-[#24344D] bg-[#0B1220] p-4 transition hover:-translate-y-1 hover:border-[#3b82f6]/60"
              >
                <div className="flex gap-4">
                  <div
                    className={[
                      "grid size-12 shrink-0 place-items-center rounded-2xl border",
                      toneClasses[tone],
                    ].join(" ")}
                  >
                    <Icon size={21} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-[#d4e4fa]">{title}</h3>
                      {!readAll && unread ? (
                        <span className="size-2 rounded-full bg-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,.85)]" />
                      ) : null}
                      <span className="rounded-full bg-[#132238] px-3 py-1 text-xs font-semibold text-[#8B9DB5]">
                        {category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#c2c6d6]">
                      {body}
                    </p>
                    <p className="mt-3 text-xs text-[#8B9DB5]">{time}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </EmployeeShell>
  );
}
