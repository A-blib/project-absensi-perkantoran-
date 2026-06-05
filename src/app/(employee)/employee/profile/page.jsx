import Image from "next/image";
import { Camera, KeyRound, Mail, Pencil, Phone, Save } from "lucide-react";
import { EmployeeShell } from "@/features/dashboard/employee-shell";

const fields = [
  ["Nama lengkap", "Rina Pratiwi", "text"],
  ["Email", "rina.pratiwi@hr-futuristic.test", "email"],
  ["Nomor HP", "+62 812 3344 8899", "tel"],
  ["Jabatan", "Finance Officer", "text"],
  ["Divisi", "Keuangan", "text"],
  ["Alamat", "Jl. Sudirman Kav. 52, Jakarta Pusat", "text"],
];

export default function EmployeeProfilePage() {
  return (
    <EmployeeShell>
      <div className="mb-5">
        <p className="text-sm text-slate-400">Data pegawai</p>
        <h2 className="text-3xl font-semibold text-white">Profil Saya</h2>
      </div>

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 text-center shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <div className="mx-auto size-40 rounded-full bg-gradient-to-br from-[#00F0FF] via-[#6C3CE8] to-[#E2E8F0] p-1 shadow-[0_0_44px_rgba(0,240,255,0.22)]">
            <Image
              src="/avatar-rina.svg"
              alt="Foto profil Rina Pratiwi"
              width={160}
              height={160}
              className="size-full rounded-full object-cover"
            />
          </div>
          <p className="mt-5 text-xl font-semibold text-white">Rina Pratiwi</p>
          <p className="mt-1 text-sm text-slate-400">Finance Officer</p>
          <button
            type="button"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-5 font-semibold text-cyan-100 hover:border-cyan-200"
          >
            <Camera size={18} />
            Ubah Foto
          </button>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([label, value, type]) => (
              <label key={label} className="block">
                <span className="text-sm font-medium text-slate-300">{label}</span>
                <span className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-cyan-300/15 bg-[#0A0F2C]/50 px-4">
                  {label === "Email" ? (
                    <Mail size={17} className="text-[#00F0FF]" />
                  ) : label === "Nomor HP" ? (
                    <Phone size={17} className="text-[#00F0FF]" />
                  ) : (
                    <Pencil size={17} className="text-slate-500" />
                  )}
                  <input
                    type={type}
                    defaultValue={value}
                    readOnly={label === "Email" || label === "Jabatan" || label === "Divisi"}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none read-only:text-slate-400"
                  />
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-violet-300/25 bg-violet-300/10 px-5 font-semibold text-violet-100 hover:border-violet-200"
            >
              <KeyRound size={18} />
              Ubah Password
            </button>
            <button
              type="button"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#6C3CE8] px-5 font-semibold text-white shadow-lg shadow-cyan-400/20 hover:-translate-y-0.5"
            >
              <Save size={18} />
              Simpan Perubahan
            </button>
          </div>
        </div>
      </section>
    </EmployeeShell>
  );
}
