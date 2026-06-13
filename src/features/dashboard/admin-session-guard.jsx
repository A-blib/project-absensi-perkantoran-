"use client";

import { useEffect } from "react";

const SESSION_CHECK_INTERVAL_MS = 15000;

export function AdminSessionGuard() {
  useEffect(() => {
    let active = true;

    async function verifyAdminSession() {
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

        if (payload.user.mustChangePassword) {
          window.location.replace("/change-password");
          return;
        }

        if (payload.user.role !== "admin") {
          window.location.replace("/employee");
        }
      } catch {
        // A temporary network failure should not force a valid admin to log out.
      }
    }

    const interval = window.setInterval(
      verifyAdminSession,
      SESSION_CHECK_INTERVAL_MS,
    );

    function verifyWhenVisible() {
      if (document.visibilityState === "visible") verifyAdminSession();
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
