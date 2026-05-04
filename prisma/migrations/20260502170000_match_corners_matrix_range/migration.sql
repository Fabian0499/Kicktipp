-- Konfigurierbare Ecken-Matrix: erste Schwelle + Anzahl Zeilen (Standard 0 + 9)
ALTER TABLE "Match" ADD COLUMN "cornersMatrixStart" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Match" ADD COLUMN "cornersMatrixRowCount" INTEGER NOT NULL DEFAULT 9;
