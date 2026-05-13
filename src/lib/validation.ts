import { z } from "zod";
import { EXACT_SCORE_ORDERED_OUTCOMES } from "@/lib/exact-score";
import { WORLD_CUP_GROUP_CODES } from "@/lib/world-cup-groups";

export const registerSchema = z.object({
  email: z.email().toLowerCase(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Nur Buchstaben, Zahlen und Unterstrich erlaubt."),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Mindestens ein Großbuchstabe erforderlich.")
    .regex(/[a-z]/, "Mindestens ein Kleinbuchstabe erforderlich.")
    .regex(/[0-9]/, "Mindestens eine Zahl erforderlich."),
});

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Mindestens ein Großbuchstabe erforderlich.")
    .regex(/[a-z]/, "Mindestens ein Kleinbuchstabe erforderlich.")
    .regex(/[0-9]/, "Mindestens eine Zahl erforderlich."),
});

const oddValue = z.coerce.number().positive().max(1000);

/** Einzelergebnisse (Heim / Unentschieden / Auswärts) + catchAll für Sammelquote „X:X“. */
const exactScoreOddsShapeEntries = EXACT_SCORE_ORDERED_OUTCOMES.map(
  (outcome) => [outcome, oddValue] as const,
);

export const exactScoreOddsSchema = z.object(
  Object.fromEntries([...exactScoreOddsShapeEntries, ["catchAll", oddValue] as const]) as z.ZodRawShape,
);

export const adminCreateMatchSchema = z.object({
  homeTeam: z.string().trim().min(2).max(60),
  awayTeam: z.string().trim().min(2).max(60),
  groupCode: z.enum(WORLD_CUP_GROUP_CODES).nullable().optional(),
  startsAt: z.iso.datetime(),
  isKnockout: z.boolean().default(false),
  odds: z.object({
    oneXTwo: z.object({
      home: oddValue,
      draw: oddValue,
      away: oddValue,
    }),
    halfTimeFullTime: z.object({
      oneOne: oddValue,
      oneX: oddValue,
      oneTwo: oddValue,
      xOne: oddValue,
      xX: oddValue,
      xTwo: oddValue,
      twoOne: oddValue,
      twoX: oddValue,
      twoTwo: oddValue,
    }),
    exactScore: exactScoreOddsSchema,
    goalsMatrixStart: z.coerce.number().int().min(1).max(30),
    goalsMatrixRowCount: z.coerce.number().int().min(1).max(15),
    goalsMatrix: z
      .array(
        z.object({
          unter: oddValue,
          exakt: oddValue,
          uber: oddValue,
        }),
      )
      .min(1)
      .max(15),
    bothTeamsToScore: z.object({
      yes: oddValue,
      no: oddValue,
    }),
    handicapMatrixRowCount: z.coerce.number().int().min(1).max(15),
    handicapMatrix: z
      .array(
        z.object({
          homeHandicap: z.coerce.number().int().min(0).max(30),
          awayHandicap: z.coerce.number().int().min(0).max(30),
          home: oddValue,
          draw: oddValue,
          away: oddValue,
        }),
      )
      .min(1)
      .max(30),
    cardsMatrixStart: z.coerce.number().int().min(0).max(30),
    cardsMatrixRowCount: z.coerce.number().int().min(1).max(15),
    cardsMatrix: z
      .array(
        z.object({
          unter: oddValue.optional(),
          exakt: oddValue,
          uber: oddValue,
        }),
      )
      .min(1)
      .max(15),
    cornersMatrixStart: z.coerce.number().int().min(0).max(30),
    cornersMatrixRowCount: z.coerce.number().int().min(1).max(15),
    cornersMatrix: z
      .array(
        z.object({
          unter: oddValue.optional(),
          exakt: oddValue,
          uber: oddValue,
        }),
      )
      .min(1)
      .max(15),
    toQualify: z
      .object({
        home: oddValue,
        away: oddValue,
      })
      .optional(),
  }),
})
  .refine(
    (data) =>
      !data.isKnockout ||
      (data.odds.toQualify !== undefined &&
        data.odds.toQualify.home >= 1.01 &&
        data.odds.toQualify.away >= 1.01),
    {
      message: "Bei KO-Spielen sind Quoten für „Qualifiziert sich“ (Heim/Gast) erforderlich.",
      path: ["odds", "toQualify"],
    },
  )
  .refine(
    (data) => data.odds.handicapMatrix.length === data.odds.handicapMatrixRowCount * 2,
    {
      message: "Handicap: Anzahl der Quotenzeilen muss zur eingetragenen Zeilenanzahl passen.",
      path: ["odds", "handicapMatrix"],
    },
  )
  .refine(
    (data) =>
      data.odds.handicapMatrix.every(
        (row) =>
          (row.homeHandicap > 0 && row.awayHandicap === 0) ||
          (row.homeHandicap === 0 && row.awayHandicap > 0),
      ),
    {
      message: "Handicap: Pro Zeile darf nur eine Seite einen Vorsprung haben.",
      path: ["odds", "handicapMatrix"],
    },
  )
  .refine(
    (data) => data.odds.goalsMatrix.length === data.odds.goalsMatrixRowCount,
    {
      message: "Tore: Anzahl der Quotenzeilen muss zur eingetragenen Zeilenanzahl passen.",
      path: ["odds", "goalsMatrix"],
    },
  )
  .refine(
    (data) => data.odds.goalsMatrixStart + data.odds.goalsMatrixRowCount - 1 <= 50,
    {
      message: "Tore: Die höchste Schwelle (erste Toranzahl + Anzahl Zeilen − 1) darf 50 nicht überschreiten.",
      path: ["odds", "goalsMatrixStart"],
    },
  )
  .refine(
    (data) => data.odds.cardsMatrix.length === data.odds.cardsMatrixRowCount,
    {
      message: "Karten: Anzahl der Quotenzeilen muss zur eingetragenen Zeilenanzahl passen.",
      path: ["odds", "cardsMatrix"],
    },
  )
  .refine(
    (data) =>
      data.odds.cardsMatrixStart + data.odds.cardsMatrixRowCount - 1 <= 50,
    {
      message: "Karten: Die höchste Schwelle (erste N + Anzahl Zeilen − 1) darf 50 nicht überschreiten.",
      path: ["odds", "cardsMatrixStart"],
    },
  )
  .refine(
    (data) => {
      const start = data.odds.cardsMatrixStart;
      const rows = data.odds.cardsMatrix;
      if (rows.length !== data.odds.cardsMatrixRowCount) {
        return true;
      }
      for (let i = 0; i < rows.length; i += 1) {
        const n = start + i;
        if (n === 0) {
          if (rows[i].unter !== undefined) {
            return false;
          }
        } else if (rows[i].unter === undefined) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Karten: Bei Schwelle N = 0 entfällt „Unter“ in dieser Zeile; bei N ≥ 1 sind Unter, Exakt und Über je Zeile erforderlich.",
      path: ["odds", "cardsMatrix"],
    },
  )
  .refine(
    (data) => data.odds.cornersMatrix.length === data.odds.cornersMatrixRowCount,
    {
      message: "Ecken: Anzahl der Quotenzeilen muss zur eingetragenen Zeilenanzahl passen.",
      path: ["odds", "cornersMatrix"],
    },
  )
  .refine(
    (data) =>
      data.odds.cornersMatrixStart + data.odds.cornersMatrixRowCount - 1 <= 50,
    {
      message: "Ecken: Die höchste Schwelle (erste N + Anzahl Zeilen − 1) darf 50 nicht überschreiten.",
      path: ["odds", "cornersMatrixStart"],
    },
  )
  .refine(
    (data) => {
      const start = data.odds.cornersMatrixStart;
      const rows = data.odds.cornersMatrix;
      if (rows.length !== data.odds.cornersMatrixRowCount) {
        return true;
      }
      for (let i = 0; i < rows.length; i += 1) {
        const n = start + i;
        if (n === 0) {
          if (rows[i].unter !== undefined) {
            return false;
          }
        } else if (rows[i].unter === undefined) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Ecken: Bei Schwelle N = 0 entfällt „Unter“ in dieser Zeile; bei N ≥ 1 sind Unter, Exakt und Über je Zeile erforderlich.",
      path: ["odds", "cornersMatrix"],
    },
  );

export const placeBetSchema = z.object({
  selections: z
    .array(
      z.object({
        matchId: z.string().min(10),
        marketOptionId: z.string().min(10),
      }),
    )
    .min(1)
    .max(1),
  stake: z.coerce.number().int().min(1).max(200),
});

export const placeSimpleTipSchema = z.object({
  matchId: z.string().min(10),
  predictedHome: z.coerce.number().int().min(0).max(30),
  predictedAway: z.coerce.number().int().min(0).max(30),
});

export const placeWmWinnerSchema = z.object({
  optionId: z.string().min(4),
});

export const adminWmWinnerUpdateSchema = z.object({
  closesAt: z.iso.datetime().optional(),
  options: z
    .array(
      z.object({
        id: z.string().min(4),
        odds: z.coerce.number().min(1.01).max(1000),
      }),
    )
    .min(1),
});

export const adminUpdateMatchOddsSchema = z.object({
  options: z
    .array(
      z.object({
        id: z.string().min(4),
        odds: z.coerce.number().min(1.01).max(1000),
      }),
    )
    .min(1),
});

export const adminWmWinnerSettleSchema = z.object({
  winningOptionId: z.string().min(4),
});

export const settleMatchSchema = z.object({
  homeHalfTimeScore: z.coerce.number().int().min(0).max(30),
  awayHalfTimeScore: z.coerce.number().int().min(0).max(30),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
  /** Summe Karten (gelb/rot nach interner Zählung beim Eintragen) */
  totalCards: z.coerce.number().int().min(0).max(50),
  /** Summe Eckbälle (einheitliche Zählung) */
  totalCorners: z.coerce.number().int().min(0).max(50),
});

export const adminAdjustPointsSchema = z.object({
  userId: z.string().min(10),
  mode: z.enum(["credit", "debit"]),
  amount: z.coerce.number().int().min(1).max(5000),
  reason: z.string().trim().min(3).max(120),
});
