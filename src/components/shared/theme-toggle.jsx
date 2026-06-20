"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("theme", theme);
}

export function ThemeToggle({ placement = "floating" }) {
  const [theme, setTheme] = useState("default");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const savedTheme = localStorage.getItem("theme") === "dark" ? "dark" : "default";
      setTheme(savedTheme);
      applyTheme(savedTheme);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  function handleChange(nextTheme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const isInline = placement === "inline";
  const isDark = theme === "dark";
  const Icon = isDark ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => handleChange(isDark ? "default" : "dark")}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      aria-pressed={isDark}
      className={[
        "employee-theme-toggle grid place-items-center rounded-xl border transition",
        isInline
          ? "size-10 border-[#2D4568]/70 bg-[#0D1728]/70 text-[#B6C8E3] shadow-[0_8px_20px_rgba(0,0,0,.12)] hover:border-[#38BDF8]/50 hover:text-[#38BDF8]"
          : "fixed bottom-5 right-5 z-40 size-12 border-slate-200 bg-white text-slate-700 shadow-xl shadow-slate-950/10 hover:bg-slate-50 max-sm:bottom-24 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-950/40 dark:hover:bg-slate-800",
      ].join(" ")}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
