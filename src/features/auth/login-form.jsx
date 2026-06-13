"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Login gagal. Periksa email dan password.");
      return;
    }

    window.location.href = result.redirectTo || "/admin";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-[38px] size-5 text-slate-400" />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="admin@kantor.test"
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
        Gunakan akun admin atau pegawai yang sudah terdaftar di menu Pegawai.
        Role akun akan menentukan dashboard tujuan setelah login.
      </div>
    </form>
  );
}
