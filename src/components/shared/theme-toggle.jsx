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

export function ThemeToggle() {
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

  return (
    <div
      className="fixed bottom-5 right-5 z-40 flex rounded-full border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/10 max-sm:bottom-24 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40"
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
              "flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold",
              isActive
                ? "bg-blue-600 text-white shadow-sm"
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
