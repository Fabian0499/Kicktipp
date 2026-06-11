import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Ein Client pro Serverless-Instanz (wichtig auf Vercel, sonst zu viele DB-Verbindungen).
globalForPrisma.prisma = db;

/** Für längere Admin-Auswertungen (viele Tipps pro Spiel). */
export const interactiveTransactionOptions = {
  maxWait: 10_000,
  timeout: 120_000,
};
