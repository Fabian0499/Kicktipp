"use client";

import { FormEvent, useState } from "react";
import { usePersistedDetailsOpen } from "@/hooks/use-persisted-details-open";

const NEW_MATCH_DETAILS_STORAGE_KEY = "kicktipp-admin-new-match-details-open";

export function AdminMatchForm() {
  const { open: detailsOpen, onToggle: onDetailsToggle } = usePersistedDetailsOpen(
    NEW_MATCH_DETAILS_STORAGE_KEY,
    true,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isKnockout, setIsKnockout] = useState(false);
  const [cardsRowStart, setCardsRowStart] = useState(0);
  const [cardsRowCount, setCardsRowCount] = useState(9);
  const [cornersRowStart, setCornersRowStart] = useState(0);
  const [cornersRowCount, setCornersRowCount] = useState(9);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const form = event.currentTarget;

    const formData = new FormData(form);

    const payload = {
      homeTeam: String(formData.get("homeTeam") ?? ""),
      awayTeam: String(formData.get("awayTeam") ?? ""),
      startsAt: new Date(String(formData.get("startsAt") ?? "")).toISOString(),
      isKnockout: String(formData.get("isKnockout") ?? "no") === "yes",
      odds: {
        oneXTwo: {
          home: Number(formData.get("odd1")),
          draw: Number(formData.get("oddX")),
          away: Number(formData.get("odd2")),
        },
        halfTimeOneXTwo: {
          home: Number(formData.get("oddHt1")),
          draw: Number(formData.get("oddHtX")),
          away: Number(formData.get("oddHt2")),
        },
        halfTimeFullTime: {
          oneOne: Number(formData.get("oddHtFt11")),
          oneX: Number(formData.get("oddHtFt1X")),
          oneTwo: Number(formData.get("oddHtFt12")),
          xOne: Number(formData.get("oddHtFtX1")),
          xX: Number(formData.get("oddHtFtXX")),
          xTwo: Number(formData.get("oddHtFtX2")),
          twoOne: Number(formData.get("oddHtFt21")),
          twoX: Number(formData.get("oddHtFt2X")),
          twoTwo: Number(formData.get("oddHtFt22")),
        },
        exactScore: {
          s00: Number(formData.get("oddCs00")),
          s10: Number(formData.get("oddCs10")),
          s01: Number(formData.get("oddCs01")),
          s11: Number(formData.get("oddCs11")),
          s20: Number(formData.get("oddCs20")),
          s02: Number(formData.get("oddCs02")),
          s21: Number(formData.get("oddCs21")),
          s12: Number(formData.get("oddCs12")),
          s22: Number(formData.get("oddCs22")),
          s30: Number(formData.get("oddCs30")),
          s03: Number(formData.get("oddCs03")),
          s31: Number(formData.get("oddCs31")),
          s13: Number(formData.get("oddCs13")),
          s32: Number(formData.get("oddCs32")),
          s23: Number(formData.get("oddCs23")),
          s33: Number(formData.get("oddCs33")),
        },
        overUnder15: {
          over: Number(formData.get("oddOver15")),
          under: Number(formData.get("oddUnder15")),
        },
        overUnder25: {
          over: Number(formData.get("oddOver25")),
          under: Number(formData.get("oddUnder25")),
        },
        overUnder35: {
          over: Number(formData.get("oddOver35")),
          under: Number(formData.get("oddUnder35")),
        },
        overUnder45: {
          over: Number(formData.get("oddOver45")),
          under: Number(formData.get("oddUnder45")),
        },
        overUnder55: {
          over: Number(formData.get("oddOver55")),
          under: Number(formData.get("oddUnder55")),
        },
        bothTeamsToScore: {
          yes: Number(formData.get("oddBttsYes")),
          no: Number(formData.get("oddBttsNo")),
        },
        doubleChance: {
          oneX: Number(formData.get("odd1X")),
          twelve: Number(formData.get("odd12")),
          xTwo: Number(formData.get("oddX2")),
        },
        cardsMatrixStart: Number(formData.get("cardsMatrixStart")),
        cardsMatrixRowCount: Number(formData.get("cardsMatrixRowCount")),
        cardsMatrix: (() => {
          const kStart = Number(formData.get("cardsMatrixStart"));
          const kCount = Number(formData.get("cardsMatrixRowCount"));
          return Array.from({ length: kCount }, (_, i) => {
            const n = kStart + i;
            const exakt = Number(formData.get(`oddCardsE${i}`));
            const uber = Number(formData.get(`oddCardsO${i}`));
            if (n === 0) {
              return { exakt, uber };
            }
            return {
              unter: Number(formData.get(`oddCardsU${i}`)),
              exakt,
              uber,
            };
          });
        })(),
        cornersMatrixStart: Number(formData.get("cornersMatrixStart")),
        cornersMatrixRowCount: Number(formData.get("cornersMatrixRowCount")),
        cornersMatrix: (() => {
          const cStart = Number(formData.get("cornersMatrixStart"));
          const cCount = Number(formData.get("cornersMatrixRowCount"));
          return Array.from({ length: cCount }, (_, i) => {
            const n = cStart + i;
            const exakt = Number(formData.get(`oddCornersE${i}`));
            const uber = Number(formData.get(`oddCornersO${i}`));
            if (n === 0) {
              return { exakt, uber };
            }
            return {
              unter: Number(formData.get(`oddCornersU${i}`)),
              exakt,
              uber,
            };
          });
        })(),
        ...(String(formData.get("isKnockout") ?? "no") === "yes"
          ? {
              toQualify: {
                home: Number(formData.get("oddQualifyHome")),
                away: Number(formData.get("oddQualifyAway")),
              },
            }
          : {}),
      },
    };

    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Spiel konnte nicht erstellt werden.");
      setLoading(false);
      return;
    }

    form.reset();
    setCardsRowStart(0);
    setCardsRowCount(9);
    setCornersRowStart(0);
    setCornersRowCount(9);
    setMessage("Spiel und Märkte wurden veröffentlicht und sind jetzt im Reiter Tipps sichtbar.");
    setLoading(false);
  }

  return (
    <details
      className="mt-8 rounded-xl border bg-white p-5 text-zinc-900 shadow-sm"
      open={detailsOpen}
      onToggle={onDetailsToggle}
    >
      <summary className="cursor-pointer text-xl font-semibold text-zinc-900">
        Neues Spiel eintragen
      </summary>
      <form className="mt-4 space-y-5 text-zinc-900" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Heimteam</label>
          <input
            name="homeTeam"
            defaultValue="Deutschland"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Auswärtsteam</label>
          <input
            name="awayTeam"
            defaultValue="Ukraine"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Anstoßzeit</label>
        <input
          name="startsAt"
          type="datetime-local"
          required
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">KO-Spiel</label>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="isKnockout"
              value="no"
              checked={!isKnockout}
              onChange={() => setIsKnockout(false)}
            />
            Nein
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="isKnockout"
              value="yes"
              checked={isKnockout}
              onChange={() => setIsKnockout(true)}
            />
            Ja
          </label>
        </div>
      </div>

      {isKnockout ? (
        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Qualifiziert sich</legend>
          <p className="text-xs text-zinc-600">
            Quote für das Team, das in die nächste Runde einzieht (Sieger der Partie nach eingetragenem Endstand).
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-800">Heim qualifiziert sich (1)</label>
              <input
                name="oddQualifyHome"
                type="number"
                step="0.01"
                min="1.01"
                max={1000}
                required={isKnockout}
                placeholder="Quote"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-800">Gast qualifiziert sich (2)</label>
              <input
                name="oddQualifyAway"
                type="number"
                step="0.01"
                min="1.01"
                max={1000}
                required={isKnockout}
                placeholder="Quote"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
              />
            </div>
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">1X2</legend>
          <div className="mt-2 grid gap-2">
            <input name="odd1" type="number" step="0.01" min="1.01" placeholder="Quote 1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddX" type="number" step="0.01" min="1.01" placeholder="Quote X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="odd2" type="number" step="0.01" min="1.01" placeholder="Quote 2" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Halbzeit 1X2</legend>
          <div className="mt-2 grid gap-2">
            <input name="oddHt1" type="number" step="0.01" min="1.01" placeholder="Quote HZ 1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtX" type="number" step="0.01" min="1.01" placeholder="Quote HZ X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHt2" type="number" step="0.01" min="1.01" placeholder="Quote HZ 2" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Halbzeit / Endstand</legend>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <input name="oddHtFt11" type="number" step="0.01" min="1.01" placeholder="1/1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt1X" type="number" step="0.01" min="1.01" placeholder="1/X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt12" type="number" step="0.01" min="1.01" placeholder="1/2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFtX1" type="number" step="0.01" min="1.01" placeholder="X/1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFtXX" type="number" step="0.01" min="1.01" placeholder="X/X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFtX2" type="number" step="0.01" min="1.01" placeholder="X/2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt21" type="number" step="0.01" min="1.01" placeholder="2/1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt2X" type="number" step="0.01" min="1.01" placeholder="2/X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddHtFt22" type="number" step="0.01" min="1.01" placeholder="2/2" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Exact Score (0:0 bis 3:3)</legend>
          <p className="mb-3 text-xs text-zinc-600">
            Die <strong>ersten 15 Felder</strong> (von <strong>0:0</strong> bis <strong>2:3</strong>) gelten jeweils nur
            für genau dieses Ergebnis. Das letzte Feld (<strong>X:X</strong>) ist die Quote für{" "}
            <strong>exakt 3:3</strong> und zugleich die <strong>Sammelquote für jedes andere</strong> Ergebnis
            außerhalb der Matrix (z. B. <strong>4:2</strong>, <strong>3:4</strong>).
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <input name="oddCs00" type="number" step="0.01" min="1.01" placeholder="0:0" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs10" type="number" step="0.01" min="1.01" placeholder="1:0" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs01" type="number" step="0.01" min="1.01" placeholder="0:1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs11" type="number" step="0.01" min="1.01" placeholder="1:1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs20" type="number" step="0.01" min="1.01" placeholder="2:0" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs02" type="number" step="0.01" min="1.01" placeholder="0:2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs21" type="number" step="0.01" min="1.01" placeholder="2:1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs12" type="number" step="0.01" min="1.01" placeholder="1:2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs22" type="number" step="0.01" min="1.01" placeholder="2:2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs30" type="number" step="0.01" min="1.01" placeholder="3:0" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs03" type="number" step="0.01" min="1.01" placeholder="0:3" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs31" type="number" step="0.01" min="1.01" placeholder="3:1" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs13" type="number" step="0.01" min="1.01" placeholder="1:3" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs32" type="number" step="0.01" min="1.01" placeholder="3:2" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs23" type="number" step="0.01" min="1.01" placeholder="2:3" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddCs33" type="number" step="0.01" min="1.01" placeholder="X:X" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-lg border-2 border-zinc-400 bg-zinc-50/70 p-4 md:col-span-2">
          <legend className="px-2 text-base font-semibold text-zinc-900">Über / Unter Tore</legend>
          <p className="mb-4 text-xs text-zinc-600">
            Gesamttore (Regelzeit) – getrennte Quoten für Über und Unter pro Linie (1,5 · 2,5 · 3,5 · 4,5 · 5,5).
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <fieldset className="rounded-md border border-zinc-300 bg-white p-3">
              <legend className="px-2 text-sm font-semibold text-zinc-800">Linie 1,5</legend>
              <div className="mt-2 grid gap-2">
                <input name="oddOver15" type="number" step="0.01" min="1.01" placeholder="Über 1.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
                <input name="oddUnder15" type="number" step="0.01" min="1.01" placeholder="Unter 1.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
              </div>
            </fieldset>

            <fieldset className="rounded-md border border-zinc-300 bg-white p-3">
              <legend className="px-2 text-sm font-semibold text-zinc-800">Linie 2,5</legend>
              <div className="mt-2 grid gap-2">
                <input name="oddOver25" type="number" step="0.01" min="1.01" placeholder="Über 2.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
                <input name="oddUnder25" type="number" step="0.01" min="1.01" placeholder="Unter 2.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
              </div>
            </fieldset>

            <fieldset className="rounded-md border border-zinc-300 bg-white p-3">
              <legend className="px-2 text-sm font-semibold text-zinc-800">Linie 3,5</legend>
              <div className="mt-2 grid gap-2">
                <input name="oddOver35" type="number" step="0.01" min="1.01" placeholder="Über 3.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
                <input name="oddUnder35" type="number" step="0.01" min="1.01" placeholder="Unter 3.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
              </div>
            </fieldset>

            <fieldset className="rounded-md border border-zinc-300 bg-white p-3">
              <legend className="px-2 text-sm font-semibold text-zinc-800">Linie 4,5</legend>
              <div className="mt-2 grid gap-2">
                <input name="oddOver45" type="number" step="0.01" min="1.01" placeholder="Über 4.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
                <input name="oddUnder45" type="number" step="0.01" min="1.01" placeholder="Unter 4.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
              </div>
            </fieldset>

            <fieldset className="rounded-md border border-zinc-300 bg-white p-3">
              <legend className="px-2 text-sm font-semibold text-zinc-800">Linie 5,5</legend>
              <div className="mt-2 grid gap-2">
                <input name="oddOver55" type="number" step="0.01" min="1.01" placeholder="Über 5.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
                <input name="oddUnder55" type="number" step="0.01" min="1.01" placeholder="Unter 5.5" required className="rounded-md border border-zinc-300 px-3 py-2" />
              </div>
            </fieldset>
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Beide Teams treffen</legend>
          <div className="mt-2 grid gap-2">
            <input name="oddBttsYes" type="number" step="0.01" min="1.01" placeholder="Quote Ja" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddBttsNo" type="number" step="0.01" min="1.01" placeholder="Quote Nein" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-3">
          <legend className="px-2 text-sm font-semibold">Doppelte Chance</legend>
          <div className="mt-2 grid gap-2">
            <input name="odd1X" type="number" step="0.01" min="1.01" placeholder="Quote 1X" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="odd12" type="number" step="0.01" min="1.01" placeholder="Quote 12" required className="rounded-md border border-zinc-300 px-3 py-2" />
            <input name="oddX2" type="number" step="0.01" min="1.01" placeholder="Quote X2" required className="rounded-md border border-zinc-300 px-3 py-2" />
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-4 md:col-span-2">
          <legend className="px-2 text-base font-semibold text-zinc-900">Kort</legend>
          <p className="mb-3 text-xs text-zinc-600">
            Gesamtzahl Kort (nach eurer Zählregel). Pro Zeile gilt die Schwelle <strong>N</strong>. Nur wenn die
            kleinste Schwelle <strong>N = 0</strong> ist, entfällt dort „Unter“. Sonst wie bei Hjornespark: Unter / Exakt /
            Über.
          </p>
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Erste Schwelle (N)</label>
              <input
                name="cardsMatrixStart"
                type="number"
                min={0}
                max={30}
                required
                value={cardsRowStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCardsRowStart(Math.min(30, Math.max(0, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">z. B. 0 oder 4</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Anzahl Zeilen</label>
              <input
                name="cardsMatrixRowCount"
                type="number"
                min={1}
                max={15}
                required
                value={cardsRowCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCardsRowCount(Math.min(15, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">1–15</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-semibold text-zinc-800">Schwelle N</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Unter</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Exakt</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Über</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cardsRowCount }, (_, i) => {
                  const n = cardsRowStart + i;
                  return (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-zinc-900">{n}</td>
                      <td className="px-2 py-1.5">
                        {n === 0 ? (
                          <span className="flex h-9 items-center justify-center text-sm text-zinc-400">–</span>
                        ) : (
                          <input
                            name={`oddCardsU${i}`}
                            type="number"
                            step="0.01"
                            min="1.01"
                            max={1000}
                            required
                            placeholder="Quote"
                            className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCardsE${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCardsO${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>

        <fieldset className="rounded-md border p-4 md:col-span-2">
          <legend className="px-2 text-base font-semibold text-zinc-900">Hjornespark</legend>
          <p className="mb-3 text-xs text-zinc-600">
            Gesamtzahl Hjornespark (nach eurer Zählregel). Pro Zeile gilt die Schwelle <strong>N</strong> (Unter /
            Exakt / Über). Nur wenn die <strong>kleinste Schwelle N = 0</strong> ist, entfällt bei dieser Zeile das
            Feld „Unter“ (nicht sinnvoll). Beginnst du z. B. bei <strong>N = 6</strong>, haben alle Zeilen Unter,
            Exakt und Über.
          </p>
          <div className="mb-4 flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Erste Schwelle (N)</label>
              <input
                name="cornersMatrixStart"
                type="number"
                min={0}
                max={30}
                required
                value={cornersRowStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCornersRowStart(Math.min(30, Math.max(0, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">z. B. 0 oder 6</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-800">Anzahl Zeilen</label>
              <input
                name="cornersMatrixRowCount"
                type="number"
                min={1}
                max={15}
                required
                value={cornersRowCount}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setCornersRowCount(Math.min(15, Math.max(1, Math.round(v))));
                  }
                }}
                className="mt-1 w-24 rounded-md border border-zinc-300 px-2 py-1.5 tabular-nums"
              />
              <p className="mt-1 text-[11px] text-zinc-500">1–15</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                  <th className="px-3 py-2 font-semibold text-zinc-800">Schwelle N</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Unter</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Exakt</th>
                  <th className="px-3 py-2 font-semibold text-zinc-800">Über</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cornersRowCount }, (_, i) => {
                  const n = cornersRowStart + i;
                  return (
                    <tr key={i} className="border-b border-zinc-100">
                      <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-zinc-900">{n}</td>
                      <td className="px-2 py-1.5">
                        {n === 0 ? (
                          <span className="flex h-9 items-center justify-center text-sm text-zinc-400">–</span>
                        ) : (
                          <input
                            name={`oddCornersU${i}`}
                            type="number"
                            step="0.01"
                            min="1.01"
                            max={1000}
                            required
                            placeholder="Quote"
                            className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                          />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCornersE${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          name={`oddCornersO${i}`}
                          type="number"
                          step="0.01"
                          min="1.01"
                          max={1000}
                          required
                          placeholder="Quote"
                          className="w-full min-w-[5rem] rounded-md border border-zinc-300 px-2 py-1.5"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer rounded-md bg-black px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Speichern..." : "Spiel + Quoten veröffentlichen"}
      </button>
    </form>
    </details>
  );
}
