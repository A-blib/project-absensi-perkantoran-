import Image from "next/image";
import {
  BadgeCheck,
  Building2,
  Edit3,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";
import { getCurrentUser } from "@/server/auth/guards";

function getDisplayValue(value, fallback = "-") {
  return value || fallback;
}

function getEmployeeProfile(user) {
  return {
    name: getDisplayValue(user?.name, "Pegawai"),
    employeeCode: getDisplayValue(user?.employeeCode || user?.id),
    position: getDisplayValue(user?.position, "Pegawai"),
    division: getDisplayValue(user?.division),
    email: getDisplayValue(user?.email),
    phone: getDisplayValue(user?.phone),
    status: user?.status === "active" ? "Akun Aktif" : "Akun Nonaktif",
  };
}

function getPersonalInfo(employee) {
  return [
    ["Email", employee.email, Mail],
    ["Nomor Telepon", employee.phone, Phone],
    ["Divisi", employee.division, Building2],
    ["Jabatan", employee.position, IdCard],
  ];
}

export default async function EmployeeProfilePage() {
  const user = await getCurrentUser();
  const employee = getEmployeeProfile(user);
  const personalInfo = getPersonalInfo(employee);

  return (
    <EmployeeShell initialUser={user}>
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-[#24344D] bg-[#0F1B2E] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.10),0_20px_48px_rgba(0,0,0,.28)] sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(173,198,255,.20),transparent_34%),linear-gradient(135deg,#0F1B2E_0%,#1A3A63_48%,#0B1220_100%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative mx-auto size-36 shrink-0 rounded-full bg-gradient-to-br from-[#adc6ff] via-[#3b82f6] to-[#0267b8] p-1 md:mx-0 md:size-40">
                <Image
                  src="/avatar-rina.svg"
                  alt={`Foto profil ${employee.name}`}
                  width={200}
                  height={200}
                  priority
                  className="size-full rounded-full border-4 border-[#132238] bg-[#0B1220] object-cover"
                />
                <div className="absolute -bottom-1 -right-1 grid size-12 place-items-center rounded-2xl border-4 border-[#132238] bg-[#adc6ff] text-[#002e6a] shadow-2xl">
                  <UserRound size={24} />
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#adc6ff]/25 bg-[#adc6ff]/10 px-4 py-2 text-sm font-bold text-[#adc6ff]">
                    <BadgeCheck size={16} />
                    ID: {employee.employeeCode}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                    <ShieldCheck size={16} />
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
                  <span>Divisi {employee.division}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-[#adc6ff] px-5 font-bold text-[#002e6a] shadow-lg shadow-blue-300/20 transition duration-300 hover:-translate-y-1 hover:brightness-110"
            >
              <Edit3 size={18} />
              Edit Profil
            </button>
          </div>
        </section>

        <section className="glass-panel rounded-[24px] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#8B9DB5]">Data akun karyawan</p>
              <h3 className="mt-1 text-xl font-bold text-[#d4e4fa]">
                Informasi Personal
              </h3>
            </div>
            <div className="grid size-12 place-items-center rounded-2xl bg-[#3b82f6]/12 text-[#60a5fa]">
              <IdCard size={23} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {personalInfo.map(([label, value, Icon]) => (
              <div
                key={label}
                className="group flex items-start gap-3 rounded-2xl border border-[#24344D] bg-[#0B1220]/75 p-3.5 transition duration-300 hover:-translate-y-1 hover:border-[#3b82f6]/60 hover:bg-[#122131]"
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
        </section>
      </div>
    </EmployeeShell>
  );
}
