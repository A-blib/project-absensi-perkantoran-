import { KeyRound } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ChangePasswordForm } from "@/features/auth/change-password-form";

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
        <Logo />
        <div className="mt-10">
          <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <KeyRound size={24} />
          </div>
          <p className="mt-5 text-sm font-bold uppercase tracking-wide text-blue-600">
            Keamanan Akun
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Ganti password dulu
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Admin memberi password awal untuk login pertama. Buat password baru
            agar akun kamu lebih aman.
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
