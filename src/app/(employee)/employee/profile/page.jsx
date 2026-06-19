"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleCheck,
  Edit3,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { employee } from "@/lib/profile/employee-profile-data";

const personalInfo = [
  ["Email Karyawan", employee.email, Mail],
  ["Nomor Telepon", employee.phone, Phone],
  ["Departemen", employee.department, Building2],
  ["Pendidikan", employee.education, GraduationCap],
  ["Alamat Tinggal", employee.address, MapPin],
];

const careerTimeline = [
  {
    title: "Finance Officer",
    period: "Jan 2024 - Sekarang",
    status: "Aktif",
    description:
      "Mengelola validasi laporan keuangan, rekonsiliasi operasional, dan koordinasi data payroll bulanan.",
    active: true,
  },
  {
    title: "Junior Finance Staff",
    period: "Jul 2022 - Des 2023",
    status: "Promosi",
    description:
      "Bertanggung jawab pada dokumentasi invoice, arsip transaksi, dan monitoring administrasi pembayaran.",
    active: false,
  },
  {
    title: "Finance Intern",
    period: "Jan 2022 - Jun 2022",
    status: "Riwayat",
    description:
      "Mendukung proses pencatatan transaksi harian dan validasi dokumen pendukung keuangan.",
    active: false,
  },
];

const skills = [
  "Financial Reporting",
  "Payroll Validation",
  "Budget Control",
  "Tax Documentation",
  "Excel Advanced",
  "Audit Preparation",
  "Vendor Reconciliation",
  "Data Accuracy",
  "Compliance",
];

function StatPill({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#315173]/70 bg-[#0A1526]/90 p-3 shadow-[0_10px_22px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.06)] transition duration-300 hover:-translate-y-0.5 hover:border-[#38BDF8]/60 hover:bg-[#10233A]">
      <div className="mb-2 grid size-8 place-items-center rounded-lg bg-[#38BDF8]/12 text-[#7DD3FC]">
        <Icon size={17} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B9DB5]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#E5EEFF]">{value}</p>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const [notice, setNotice] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  function showNotice(message, type = "success") {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 2600);
  }

  return (
    <EmployeeShell>
      {notice ? (
        <div
          className={[
            "fixed right-4 top-24 z-50 flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl",
            notice.type === "warning"
              ? "border-[#F59E0B]/35 bg-[#2A2113]/95 text-[#FDE68A]"
              : "border-[#22C55E]/35 bg-[#10251D]/95 text-[#BBF7D0]",
          ].join(" ")}
        >
          {notice.type === "warning" ? <AlertTriangle size={18} /> : <CircleCheck size={18} />}
          {notice.message}
        </div>
      ) : null}

      <div className="mx-auto max-w-[1320px] space-y-4 pb-10">
        <section className="relative overflow-hidden rounded-[20px] border border-[#2F5B86]/80 bg-[#102036] p-4 shadow-[0_18px_46px_rgba(0,0,0,.34),inset_0_1px_0_rgba(255,255,255,.10)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(56,189,248,.18),transparent_24rem),radial-gradient(circle_at_78%_14%,rgba(34,197,94,.10),transparent_18rem),linear-gradient(135deg,#102036_0%,#183153_48%,#0B1220_100%)]" />
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#22C55E,#3B82F6)]" />
          <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="group relative mx-auto size-24 shrink-0 rounded-full bg-gradient-to-br from-[#7DD3FC] via-[#3b82f6] to-[#0267b8] p-1 shadow-[0_0_32px_rgba(56,189,248,.22)] md:mx-0 md:size-28">
                <Image
                  src="/avatar-rina.svg"
                  alt="Foto profil Rina Pratiwi"
                  width={224}
                  height={224}
                  priority
                  className="size-full rounded-full border-4 border-[#132238] bg-[#0B1220] object-cover transition duration-500 group-hover:scale-[1.035]"
                />
                <div className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-xl border-4 border-[#132238] bg-[#BAE6FD] text-[#082F49] shadow-2xl transition duration-300 group-hover:scale-110">
                  <UserRound size={18} />
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#7DD3FC]/25 bg-[#7DD3FC]/10 px-3 py-1.5 text-xs font-bold text-[#BAE6FD]">
                    <BadgeCheck size={16} />
                    ID: {employee.id}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                    <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
                    {employee.status}
                  </span>
                </div>

                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {employee.name}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-sm text-[#c2c6d6] md:justify-start">
                  <span className="font-semibold text-[#adc6ff]">
                    {employee.position}
                  </span>
                  <span className="hidden size-1.5 rounded-full bg-[#64748b] sm:block" />
                  <span>Departemen {employee.department}</span>
                </div>

                <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#d4e4fa]">
                    <CalendarDays size={16} className="text-[#adc6ff]" />
                    Bergabung {employee.joinDate}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-[#d4e4fa]">
                    <BriefcaseBusiness size={16} className="text-[#adc6ff]" />
                    {employee.contract}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:w-48">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#BAE6FD] px-4 text-sm font-bold text-[#082F49] shadow-lg shadow-sky-300/15 transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
              >
                <Edit3 size={18} />
                Edit Profil
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="relative overflow-hidden rounded-[18px] border border-[#315173]/80 bg-[linear-gradient(145deg,#12233A,#0D1829)] p-4 shadow-[0_16px_38px_rgba(0,0,0,.30),inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#2563EB)]" />
              <div className="relative mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#8B9DB5]">Employee directory</p>
                  <h3 className="text-lg font-bold text-[#E5EEFF]">
                    Informasi Personal
                  </h3>
                </div>
                <div className="grid size-9 place-items-center rounded-xl border border-[#38BDF8]/20 bg-[#38BDF8]/12 text-[#7DD3FC]">
                  <IdCard size={20} />
                </div>
              </div>

              <div className="relative grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {personalInfo.map(([label, value, Icon], index) => (
                  <div
                    key={label}
                    className={[
                      "group flex items-start gap-3 rounded-xl border border-[#2C4564] bg-[#0A1526]/88 p-3 shadow-[0_10px_22px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#38BDF8]/60 hover:bg-[#10233A]",
                      index === personalInfo.length - 1 ? "md:col-span-2 xl:col-span-2" : "",
                    ].join(" ")}
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#132A45] text-[#7DD3FC] transition duration-300 group-hover:scale-105 group-hover:bg-[#2563EB] group-hover:text-white">
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B9DB5]">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-[#E5EEFF] transition group-hover:text-[#BAE6FD]">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[18px] border border-[#315173]/80 bg-[linear-gradient(145deg,#12233A,#0D1829)] p-4 shadow-[0_16px_38px_rgba(0,0,0,.30),inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#22C55E,#38BDF8)]" />
              <div className="relative mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#8B9DB5]">Career progression</p>
                  <h3 className="text-lg font-bold text-[#E5EEFF]">
                    Riwayat Pekerjaan
                  </h3>
                </div>
                <div className="grid size-9 place-items-center rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/12 text-[#86EFAC]">
                  <BriefcaseBusiness size={20} />
                </div>
              </div>

              <div className="relative space-y-0 before:absolute before:left-[16px] before:top-4 before:h-[calc(100%-32px)] before:w-px before:bg-[#315173]">
                {careerTimeline.map((item) => (
                  <div key={item.title} className="relative pb-2.5 pl-11 last:pb-0">
                    <div
                      className={[
                        "absolute left-0 top-1 z-10 grid size-8 place-items-center rounded-xl border-2",
                        item.active
                          ? "border-[#adc6ff] bg-[#3b82f6]/20 text-[#adc6ff] shadow-[0_0_26px_rgba(59,130,246,.22)]"
                          : "border-[#24344D] bg-[#0B1220] text-[#8B9DB5]",
                      ].join(" ")}
                    >
                      {item.active ? <Star size={19} /> : <CircleCheck size={19} />}
                    </div>
                    <div className="rounded-xl border border-[#2C4564] bg-[#0A1526]/88 p-3 shadow-[0_10px_22px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#38BDF8]/60 hover:bg-[#10233A]">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-base font-bold text-[#d4e4fa]">
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-sm text-[#8B9DB5]">
                            Corporate EMS - {item.period}
                          </p>
                        </div>
                        <span
                          className={[
                            "w-fit rounded-full border px-3 py-1 text-xs font-bold",
                            item.active
                              ? "border-[#adc6ff]/25 bg-[#adc6ff]/10 text-[#adc6ff]"
                              : "border-[#24344D] bg-[#132238] text-[#c2c6d6]",
                          ].join(" ")}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 border-l-2 border-[#38BDF8]/35 pl-3 text-sm leading-5 text-[#c2c6d6]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:col-span-4">
            <div className="relative overflow-hidden rounded-[18px] border border-[#315173]/80 bg-[linear-gradient(145deg,#12233A,#0D1829)] p-4 shadow-[0_16px_38px_rgba(0,0,0,.30),inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#A78BFA,#38BDF8)]" />
              <div className="absolute right-0 top-0 size-32 rounded-full bg-[#38BDF8]/10 blur-3xl" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B9DB5]">Performance analytics</p>
                    <h3 className="text-lg font-bold text-[#E5EEFF]">
                      Ringkasan Performa
                    </h3>
                  </div>
                  <TrendingUp size={22} className="text-emerald-300" />
                </div>

                <div className="grid place-items-center rounded-xl border border-[#2C4564] bg-[#0A1526]/60 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
                  <div className="relative size-28">
                    <svg className="size-full -rotate-90" viewBox="0 0 180 180">
                      <circle
                        cx="90"
                        cy="90"
                        fill="transparent"
                        r="74"
                        stroke="#273647"
                        strokeWidth="14"
                      />
                      <circle
                        cx="90"
                        cy="90"
                        fill="transparent"
                        r="74"
                        stroke="#adc6ff"
                        strokeDasharray="465"
                        strokeDashoffset="37"
                        strokeLinecap="round"
                        strokeWidth="14"
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <div>
                        <p className="text-3xl font-extrabold text-white">9.2</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#adc6ff]">
                          Excellent
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <TrendingUp size={16} />
                    +0.4 poin dari bulan lalu
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <StatPill label="Absensi" value="95%" icon={ShieldCheck} />
                  <StatPill label="Sisa Cuti" value="12 Hari" icon={CalendarDays} />
                  <StatPill label="Trend" value="+8%" icon={Activity} />
                  <StatPill label="KPI" value="A" icon={Award} />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[18px] border border-[#315173]/80 bg-[linear-gradient(145deg,#12233A,#0D1829)] p-4 shadow-[0_16px_38px_rgba(0,0,0,.30),inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#F59E0B,#38BDF8)]" />
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8B9DB5]">Competency matrix</p>
                  <h3 className="text-lg font-bold text-[#E5EEFF]">
                    Skills & Competencies
                  </h3>
                </div>
                <Award size={21} className="text-[#7DD3FC]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-[#2C4564] bg-[#0A1526]/88 px-3 py-1.5 text-xs font-semibold text-[#c2c6d6] shadow-[0_8px_18px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#38BDF8]/60 hover:text-[#BAE6FD]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <section className="relative overflow-hidden rounded-[18px] border border-[#315173]/80 bg-[linear-gradient(145deg,#12233A,#0D1829)] p-4 shadow-[0_16px_38px_rgba(0,0,0,.30),inset_0_1px_0_rgba(255,255,255,.08)] xl:col-span-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#38BDF8,#1D4ED8)]" />
            <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-[#8B9DB5]">Document management</p>
                <h3 className="text-lg font-bold text-[#E5EEFF]">
                  Dokumen Kepegawaian
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-[#A7B3C6]">
                  Arsip dokumen dibuat sebagai sub menu khusus agar profil tetap ringkas.
                </p>
              </div>
              <Link
                href="/employee/dokumen"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#60A5FA]/55 bg-[#1D4ED8] px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#2563EB]"
              >
                Buka Sub Menu Dokumen
              </Link>
            </div>
          </section>
        </section>
      </div>

      {isEditOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#2D4568] bg-[#111C2E] shadow-[0_24px_70px_rgba(0,0,0,.45)]">
            <div className="flex items-center justify-between border-b border-[#2D4568] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Edit Profil</h3>
                <p className="mt-0.5 text-sm text-[#A7B3C6]">
                  Perbarui informasi kontak karyawan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="grid size-9 place-items-center rounded-lg border border-[#2D4568] text-[#CBD5E1] transition hover:bg-[#223754] hover:text-[#F8FAFC]"
                aria-label="Tutup edit profil"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="grid gap-3 p-5"
              onSubmit={(event) => {
                event.preventDefault();
                setIsEditOpen(false);
                showNotice("Perubahan profil tersimpan untuk sesi demo.");
              }}
            >
              {[
                ["Nama", employee.name],
                ["Email", employee.email],
                ["Nomor Telepon", employee.phone],
                ["Alamat", employee.address],
              ].map(([label, value]) => (
                <label key={label} className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#CBD5E1]">
                    {label}
                  </span>
                  <input
                    defaultValue={value}
                    className="h-11 w-full rounded-xl border border-[#2D4568] bg-[#0D1728] px-3 text-sm font-semibold text-[#F8FAFC] outline-none transition hover:border-[#38BDF8] focus:border-[#38BDF8]"
                  />
                </label>
              ))}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#2D4568] bg-[#142136] px-4 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#223754]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#60A5FA]/55 bg-[#1D4ED8] px-4 text-sm font-bold text-white transition hover:bg-[#2563EB]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </EmployeeShell>
  );
}
