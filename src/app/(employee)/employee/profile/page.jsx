import Image from "next/image";
import {
  Activity,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleCheck,
  Download,
  Edit3,
  FileCheck2,
  FileText,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const employee = {
  name: "Rina Pratiwi",
  id: "EMP-2026-041",
  position: "Finance Officer",
  department: "Keuangan",
  email: "rina.pratiwi@hr-futuristic.test",
  phone: "+62 812 3344 8899",
  address: "Jl. Jenderal Sudirman, Pekanbaru",
  education: "S1 Akuntansi dan Keuangan",
  joinDate: "12 Januari 2024",
  status: "Karyawan Aktif",
  contract: "Tetap",
  supervisor: "Andika Pratama",
};

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

const documents = [
  ["Kontrak Kerja", "PDF Document", "2.4 MB", FileText],
  ["Slip Gaji Juni", "PDF Document", "1.1 MB", FileCheck2],
  ["Sertifikat Finance", "Certificate", "3.8 MB", Award],
  ["Identitas Karyawan", "Image File", "820 KB", IdCard],
  ["Dokumen Pendukung", "Archive", "5.2 MB", FileText],
];

function StatPill({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#24344D] bg-[#0B1220]/80 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/60">
      <div className="mb-3 grid size-10 place-items-center rounded-xl bg-[#3b82f6]/12 text-[#60a5fa]">
        <Icon size={19} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B9DB5]">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold text-[#d4e4fa]">{value}</p>
    </div>
  );
}

export default function EmployeeProfilePage() {
  return (
    <EmployeeShell>
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[28px] border border-[#24344D] bg-[#0F1B2E] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.10),0_20px_48px_rgba(0,0,0,.28)] sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(173,198,255,.22),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,.18),transparent_32%),linear-gradient(135deg,#0F1B2E_0%,#1A3A63_48%,#0B1220_100%)]" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#3b82f6]/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="group relative mx-auto size-36 shrink-0 rounded-full bg-gradient-to-br from-[#adc6ff] via-[#3b82f6] to-[#0267b8] p-1 shadow-[0_0_38px_rgba(173,198,255,.20)] md:mx-0 md:size-44">
                <Image
                  src="/avatar-rina.svg"
                  alt="Foto profil Rina Pratiwi"
                  width={224}
                  height={224}
                  priority
                  className="size-full rounded-full border-4 border-[#132238] bg-[#0B1220] object-cover transition duration-500 group-hover:scale-[1.035]"
                />
                <div className="absolute -bottom-1 -right-1 grid size-12 place-items-center rounded-2xl border-4 border-[#132238] bg-[#adc6ff] text-[#002e6a] shadow-2xl transition duration-300 group-hover:scale-110">
                  <UserRound size={24} />
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#adc6ff]/25 bg-[#adc6ff]/10 px-4 py-2 text-sm font-bold text-[#adc6ff]">
                    <BadgeCheck size={16} />
                    ID: {employee.id}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                    <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
                    {employee.status}
                  </span>
                </div>

                <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
                  {employee.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-base text-[#c2c6d6] md:justify-start">
                  <span className="font-semibold text-[#adc6ff]">
                    {employee.position}
                  </span>
                  <span className="hidden size-1.5 rounded-full bg-[#64748b] sm:block" />
                  <span>Departemen {employee.department}</span>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[#d4e4fa]">
                    <CalendarDays size={16} className="text-[#adc6ff]" />
                    Bergabung {employee.joinDate}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[#d4e4fa]">
                    <BriefcaseBusiness size={16} className="text-[#adc6ff]" />
                    {employee.contract}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:w-52 xl:grid-cols-1">
              <button
                type="button"
                className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#adc6ff] px-5 font-bold text-[#002e6a] shadow-lg shadow-blue-300/20 transition duration-300 hover:-translate-y-1 hover:brightness-110"
              >
                <Edit3 size={18} />
                Edit Profil
              </button>
              <button
                type="button"
                className="flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-5 font-semibold text-[#d4e4fa] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.10]"
              >
                <Share2 size={18} />
                Bagikan
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="glass-panel rounded-[24px] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#8B9DB5]">Employee directory</p>
                  <h3 className="mt-1 text-xl font-bold text-[#d4e4fa]">
                    Informasi Personal
                  </h3>
                </div>
                <div className="grid size-12 place-items-center rounded-2xl bg-[#3b82f6]/12 text-[#60a5fa]">
                  <IdCard size={23} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {personalInfo.map(([label, value, Icon], index) => (
                  <div
                    key={label}
                    className={[
                      "group flex items-start gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220]/75 p-3.5 transition duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/60 hover:bg-[#122131]",
                      index === personalInfo.length - 1 ? "md:col-span-2" : "",
                    ].join(" ")}
                  >
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#132238] text-[#60a5fa] transition duration-300 group-hover:scale-110 group-hover:bg-[#3b82f6] group-hover:text-white">
                      <Icon size={21} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B9DB5]">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-base font-semibold text-[#d4e4fa] transition group-hover:text-[#adc6ff]">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[24px] p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#8B9DB5]">Career progression</p>
                  <h3 className="mt-1 text-xl font-bold text-[#d4e4fa]">
                    Riwayat Pekerjaan
                  </h3>
                </div>
                <div className="grid size-12 place-items-center rounded-2xl bg-[#3b82f6]/12 text-[#60a5fa]">
                  <BriefcaseBusiness size={23} />
                </div>
              </div>

              <div className="relative space-y-0 before:absolute before:left-[21px] before:top-4 before:h-[calc(100%-32px)] before:w-px before:bg-[#24344D]">
                {careerTimeline.map((item) => (
                  <div key={item.title} className="relative pb-4 pl-14 last:pb-0">
                    <div
                      className={[
                        "absolute left-0 top-1 z-10 grid size-11 place-items-center rounded-2xl border-2",
                        item.active
                          ? "border-[#adc6ff] bg-[#3b82f6]/20 text-[#adc6ff] shadow-[0_0_26px_rgba(59,130,246,.22)]"
                          : "border-[#24344D] bg-[#0B1220] text-[#8B9DB5]",
                      ].join(" ")}
                    >
                      {item.active ? <Star size={19} /> : <CircleCheck size={19} />}
                    </div>
                    <div className="rounded-2xl border border-[#24344D] bg-[#0B1220]/75 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/60 hover:bg-[#122131]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-[#d4e4fa]">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-sm text-[#8B9DB5]">
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
                      <p className="mt-3 border-l-2 border-[#3b82f6]/35 pl-4 text-sm leading-5 text-[#c2c6d6]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:col-span-4">
            <div className="glass-panel relative overflow-hidden rounded-[24px] p-5">
              <div className="absolute right-0 top-0 size-40 rounded-full bg-[#3b82f6]/10 blur-3xl" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8B9DB5]">Performance analytics</p>
                    <h3 className="mt-1 text-xl font-bold text-[#d4e4fa]">
                      Ringkasan Performa
                    </h3>
                  </div>
                  <TrendingUp size={24} className="text-emerald-300" />
                </div>

                <div className="grid place-items-center border-b border-[#24344D] pb-6">
                  <div className="relative size-40">
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
                        <p className="text-5xl font-extrabold text-white">9.2</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#adc6ff]">
                          Excellent
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-300">
                    <TrendingUp size={16} />
                    +0.4 poin dari bulan lalu
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <StatPill label="Absensi" value="95%" icon={ShieldCheck} />
                  <StatPill label="Sisa Cuti" value="12 Hari" icon={CalendarDays} />
                  <StatPill label="Trend" value="+8%" icon={Activity} />
                  <StatPill label="KPI" value="A" icon={Award} />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[24px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#8B9DB5]">Competency matrix</p>
                  <h3 className="mt-1 text-xl font-bold text-[#d4e4fa]">
                    Skills & Competencies
                  </h3>
                </div>
                <Award size={23} className="text-[#60a5fa]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-xl border border-[#24344D] bg-[#0B1220] px-4 py-2 text-sm font-semibold text-[#c2c6d6] transition duration-300 hover:-translate-y-0.5 hover:border-[#3b82f6]/60 hover:text-[#adc6ff]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <section className="glass-panel rounded-[24px] p-5 xl:col-span-12">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#8B9DB5]">Document management</p>
                <h3 className="mt-1 text-xl font-bold text-[#d4e4fa]">
                  Dokumen Kepegawaian
                </h3>
              </div>
              <button
                type="button"
                className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#24344D] bg-[#0B1220] px-4 text-sm font-bold text-[#adc6ff] transition duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/60"
              >
                <Download size={17} />
                Lihat Arsip
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {documents.map(([name, type, size, Icon]) => (
                <article
                  key={name}
                  className="group rounded-3xl border border-[#24344D] bg-[#0B1220]/80 p-4 transition duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/60 hover:bg-[#122131] hover:shadow-2xl hover:shadow-blue-950/20"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="grid size-12 place-items-center rounded-2xl bg-[#3b82f6]/12 text-[#60a5fa] transition duration-300 group-hover:scale-110 group-hover:bg-[#3b82f6] group-hover:text-white">
                      <Icon size={24} />
                    </div>
                    <Download
                      size={18}
                      className="text-[#64748b] transition group-hover:text-[#adc6ff]"
                    />
                  </div>
                  <h4 className="truncate font-bold text-[#d4e4fa] transition group-hover:text-[#adc6ff]">
                    {name}
                  </h4>
                  <p className="mt-2 text-sm text-[#8B9DB5]">{type}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748b]">
                    {size}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </EmployeeShell>
  );
}
