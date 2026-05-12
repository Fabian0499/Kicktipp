"use client";

import { WM_WINNER_FIELD_DB_LABEL, WM_WINNER_FLAG_ISO } from "@/lib/wm-winner";

const PIRATE_FLAG = String.fromCodePoint(0x1f3f4, 0x200d, 0x2620, 0xfe0f);

type Props = {
  option?: { label: string; isField: boolean };
  /** Gespeicherter DB-Name (z. B. beim Tipp „Dein Tipp“) */
  storedLabel?: string;
  size?: "md" | "lg";
};

/**
 * Länder: PNG von flagcdn (Emoji-Regionalindikatoren sind unter Windows oft nur „ES“, „FR“ …).
 * Piraten: Unicode-Emoji (funktioniert dort bereits zuverlässig).
 */
export function WmWinnerFlag({ option, storedLabel, size = "md" }: Props) {
  const isPirate =
    Boolean(option?.isField) ||
    (storedLabel !== undefined && storedLabel === WM_WINNER_FIELD_DB_LABEL);

  const base = size === "lg" ? 80 : 40;
  const dim =
    size === "lg" ? "h-10 w-[3.35rem] sm:h-11 sm:w-14" : "h-9 w-[3rem] sm:h-10 sm:w-12";

  if (isPirate) {
    return (
      <span
        className={`${dim} flex shrink-0 items-center justify-center rounded-sm shadow-sm ring-1 ring-zinc-300/80`}
        aria-hidden
      >
        <span
          className={
            size === "lg"
              ? "translate-y-px text-[2.5rem] leading-none sm:text-[2.75rem]"
              : "translate-y-px text-[2.125rem] leading-none sm:text-[2.375rem]"
          }
        >
          {PIRATE_FLAG}
        </span>
      </span>
    );
  }

  const label = option?.label ?? storedLabel;
  if (!label || label === WM_WINNER_FIELD_DB_LABEL) {
    return (
      <span className={`shrink-0 ${size === "lg" ? "text-2xl" : "text-xl"} opacity-70`} aria-hidden>
        ⚽
      </span>
    );
  }

  const iso = WM_WINNER_FLAG_ISO[label];
  if (!iso) {
    return (
      <span className={`shrink-0 ${size === "lg" ? "text-2xl" : "text-xl"} opacity-70`} aria-hidden>
        ⚽
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w${base}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${base}/${iso}.png 1x, https://flagcdn.com/w${base * 2}/${iso}.png 2x`}
      alt=""
      width={base}
      height={Math.round(base * 0.75)}
      className={`${dim} shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-zinc-300/80`}
      loading="lazy"
      decoding="async"
    />
  );
}
