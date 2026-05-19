"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
      }),
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setMessage(result.message || "Password gagal diperbarui.");
      return;
    }

    window.location.href = result.redirectTo || "/login";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
      <Input
        label="Password Saat Ini"
        name="currentPassword"
        type="password"
        placeholder="Masukkan password awal"
        required
      />
      <Input
        label="Password Baru"
        name="newPassword"
        type="password"
        placeholder="Minimal 6 karakter"
        required
      />
      {message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      ) : null}
      <Button type="submit" size="lg" disabled={isLoading}>
        {isLoading ? <Loader2 className="size-5 animate-spin" /> : <KeyRound size={18} />}
        {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
      </Button>
    </form>
  );
}
