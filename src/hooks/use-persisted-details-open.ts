"use client";

import { useCallback, useLayoutEffect, useRef, useState, type SyntheticEvent } from "react";

/**
 * Persists <details> open state in sessionStorage. Reads storage in useLayoutEffect (before paint)
 * and applies it synchronously so the first paint matches storage (avoids stray toggle events
 * after reload — e.g. admin Auswertung → location.reload — overwriting "false" with "true").
 * Persisting user toggles is enabled only after a later microtask so layout-driven updates cannot
 * race with spurious toggles from the wrong initial open state.
 */
export function usePersistedDetailsOpen(storageKey: string, defaultOpen = true) {
  const [open, setOpen] = useState(defaultOpen);
  const allowPersist = useRef(false);

  useLayoutEffect(() => {
    allowPersist.current = false;
    let storedOpen: boolean | null = null;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored !== null) {
        storedOpen = stored === "true";
      }
    } catch {
      /* ignore */
    }
    if (storedOpen !== null) {
      setOpen(storedOpen);
    }
    queueMicrotask(() => {
      allowPersist.current = true;
    });
  }, [storageKey]);

  const onToggle = useCallback(
    (event: SyntheticEvent<HTMLDetailsElement>) => {
      const next = event.currentTarget.open;
      setOpen(next);
      if (!allowPersist.current) {
        return;
      }
      try {
        sessionStorage.setItem(storageKey, String(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  return { open, onToggle };
}
