import { LoginForm } from "@/features/auth/login-form";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden bg-[#334155] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo dark />
        <div>
          <p className="max-w-xl text-5xl font-bold leading-tight">
            Absensi cepat untuk pegawai, data jelas untuk admin.
          </p>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-200">
            Login terproteksi dengan JWT cookie, password bcryptjs, dan session
            harian yang dirancang reset otomatis pukul 00:00.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-white/15 p-4">
            <p className="text-2xl font-bold">GPS</p>
            <p className="mt-1 text-slate-200">Validation</p>
          </div>
          <div className="rounded-lg border border-white/15 p-4">
            <p className="text-2xl font-bold">JWT</p>
            <p className="mt-1 text-slate-200">Cookie Auth</p>
          </div>
          <div className="rounded-lg border border-white/15 p-4">
            <p className="text-2xl font-bold">Zod</p>
            <p className="mt-1 text-slate-200">Validation</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Secure login
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950">
              Masuk ke dashboard
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Gunakan akun admin atau pegawai untuk masuk ke sistem absensi.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
