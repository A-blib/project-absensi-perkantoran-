"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const themes = {
  default: {
    label: "Default",
    icon: Sun,
  },
  dark: {
    label: "Dark",
    icon: Moon,
  },
};

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

  return (
    <div
      className={[
        "flex rounded-full border p-1",
        isInline
          ? "border-[#2C5B9A]/45 bg-[#101B2D] shadow-[0_8px_20px_rgba(0,0,0,.18)]"
          : "fixed bottom-5 right-5 z-40 border-slate-200 bg-white shadow-xl shadow-slate-950/10 max-sm:bottom-24 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40",
      ].join(" ")}
      aria-label="Pilih tema tampilan"
    >
      {Object.entries(themes).map(([value, item]) => {
        const Icon = item.icon;
        const isActive = theme === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => handleChange(value)}
            aria-pressed={isActive}
            className={[
              "flex items-center gap-2 rounded-full font-semibold transition",
              isInline ? "h-9 px-2.5 text-xs" : "h-10 px-3 text-sm",
              isActive
                ? "bg-[#2563EB] text-white shadow-sm"
                : isInline
                  ? "text-[#9AA8BD] hover:bg-[#17243A] hover:text-[#E5EEFF]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
            ].join(" ")}
          >
            <Icon size={16} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
