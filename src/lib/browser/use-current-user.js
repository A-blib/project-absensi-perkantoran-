"use client";

import { useEffect, useState } from "react";

export function useCurrentUser(initialUser = null) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!active) return;

        if (!response.ok) {
          setUser(initialUser);
          return;
        }

        const payload = await response.json();
        setUser(payload.user || initialUser);
      } catch {
        if (active) setUser(initialUser);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [initialUser]);

  return { user, loading };
}
