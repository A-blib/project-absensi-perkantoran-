"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoAccounts = [
  {
    value: "admin",
    role: "Admin",
    target: "Masuk ke dashboard admin",
  },
  {
    value: "employee",
    role: "Karyawan",
    target: "Masuk ke dashboard karyawan",
  },
];

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function chooseLoginRole(role) {
    setSelectedRole(role);
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!selectedRole) {
      setMessage("Pilih dulu mau login sebagai Admin atau Karyawan.");
      return;
    }

    setIsLoading(true);

    const payload = {
      role: selectedRole,
      email,
      password,
    };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Login gagal. Periksa email dan password.");
      return;
    }

    window.location.replace(result.redirectTo || "/admin");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
      <fieldset className="grid gap-3">
        <legend className="text-sm font-bold text-slate-700">
          Pilih jenis akun
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
        {demoAccounts.map((account) => (
          <button
            key={account.role}
            type="button"
            onClick={() => chooseLoginRole(account.value)}
            className={[
              "rounded-xl border p-4 text-left transition",
              selectedRole === account.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50",
            ].join(" ")}
            aria-pressed={selectedRole === account.value}
          >
            <span className="flex items-center justify-between gap-3 text-sm font-bold">
              {account.role}
              <span
                className={[
                  "grid size-5 place-items-center rounded-full border text-[10px]",
                  selectedRole === account.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 text-transparent",
                ].join(" ")}
              >
                {selectedRole === account.value ? <Check size={12} /> : null}
              </span>
            </span>
            <span className="mt-1 block text-xs font-medium text-slate-500">
              {account.target}
            </span>
          </button>
        ))}
        </div>
      </fieldset>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-[38px] size-5 text-slate-400" />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="admin@kantor.test"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="pl-10"
          required
        />
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-[38px] size-5 text-slate-400" />
        <Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Masukkan password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="pl-10 pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute right-2 top-[31px] grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      {message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}
      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? <Loader2 className="size-5 animate-spin" /> : null}
        {isLoading ? "Memproses..." : "Login"}
      </Button>
      <div className="rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-500">
        Wajib pilih Admin atau Karyawan sebelum login. Sistem akan menolak
        jika jenis akun yang dipilih tidak sesuai dengan role di database.
      </div>
    </form>
  );
}
