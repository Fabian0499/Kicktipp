"use client";

import { useCallback, useLayoutEffect, useRef, useState, type SyntheticEvent } from "react";

/**
 * Persists <details> open state in sessionStorage. Reads storage in useLayoutEffect (before paint)
 * and ignores toggle-driven writes until then so early/spurious toggle events cannot overwrite
 * a saved "closed" value with "true".
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
    queueMicrotask(() => {
      if (storedOpen !== null) {
        setOpen(storedOpen);
      }
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
