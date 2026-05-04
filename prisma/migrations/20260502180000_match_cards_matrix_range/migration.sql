-- Konfigurierbare Karten-Matrix: erste Schwelle + Anzahl Zeilen (Standard 0 + 9)
ALTER TABLE "Match" ADD COLUMN "cardsMatrixStart" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Match" ADD COLUMN "cardsMatrixRowCount" INTEGER NOT NULL DEFAULT 9;
