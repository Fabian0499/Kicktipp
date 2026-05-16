"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n/types";

const options: Array<{ locale: Locale; flag: string; labelKey: "de" | "en" }> = [
  { locale: "de", flag: "https://flagcdn.com/w40/de.png", labelKey: "de" },
  { locale: "en", flag: "https://flagcdn.com/w40/gb.png", labelKey: "en" },
];

export function LanguageSelect() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.locale === locale) ?? options[0];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function pick(next: Locale) {
    setOpen(false);
    if (next === locale || busy) {
      return;
    }
    setBusy(true);
    try {
      await setLocale(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("language.label")}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm font-medium text-black hover:bg-zinc-50 disabled:opacity-60"
      >
        <img src={current.flag} alt="" width={20} height={15} className="h-[15px] w-5 rounded-sm object-cover" />
        <span className="text-xs text-zinc-500">▾</span>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option.locale} role="option" aria-selected={option.locale === locale}>
              <button
                type="button"
                onClick={() => void pick(option.locale)}
                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50 ${
                  option.locale === locale ? "bg-zinc-100 font-semibold" : "font-medium text-zinc-800"
                }`}
              >
                <img
                  src={option.flag}
                  alt=""
                  width={20}
                  height={15}
                  className="h-[15px] w-5 shrink-0 rounded-sm object-cover"
                />
                {t(`language.${option.labelKey}`)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
