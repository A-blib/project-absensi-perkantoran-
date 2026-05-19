"use client";

import { useState } from "react";
import { Eye, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

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
          type="password"
          placeholder="Masukkan password"
          className="pl-10 pr-10"
          required
        />
        <Eye className="pointer-events-none absolute right-3 top-[38px] size-5 text-slate-400" />
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
        Demo: gunakan format email admin atau pegawai. Integrasi database Supabase,
        Drizzle, dan bcryptjs sudah disiapkan di layer server.
      </div>
    </form>
  );
}
