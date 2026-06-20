"use client";

import { useEffect } from "react";

const SESSION_CHECK_INTERVAL_MS = 60000;

export function EmployeeSessionGuard() {
  useEffect(() => {
    let active = true;

    async function verifyEmployeeSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const payload = await response.json();

        if (!active) return;

        if (!response.ok || !payload.user) {
          window.location.replace("/login");
          return;
        }

        if (payload.user.role !== "employee") {
          window.location.replace("/admin");
        }
      } catch {
        // A temporary network failure should not force a valid employee to log out.
      }
    }

    verifyEmployeeSession();
    const interval = window.setInterval(
      verifyEmployeeSession,
      SESSION_CHECK_INTERVAL_MS,
    );

    function verifyWhenVisible() {
      if (document.visibilityState === "visible") verifyEmployeeSession();
    }

    window.addEventListener("focus", verifyWhenVisible);
    document.addEventListener("visibilitychange", verifyWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", verifyWhenVisible);
      document.removeEventListener("visibilitychange", verifyWhenVisible);
    };
  }, []);

  return null;
}
