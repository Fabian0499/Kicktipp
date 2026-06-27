-- K.-o.-Auswertung: Ergebnis nach 90 Min. getrennt von Verlängerung / Elfmeter-Metadaten
CREATE TYPE "KnockoutDecidedBy" AS ENUM ('REGULATION', 'EXTRA_TIME', 'PENALTIES');

ALTER TABLE "Match" ADD COLUMN "homeScoreAfterExtraTime" INTEGER;
ALTER TABLE "Match" ADD COLUMN "awayScoreAfterExtraTime" INTEGER;
ALTER TABLE "Match" ADD COLUMN "knockoutDecidedBy" "KnockoutDecidedBy";
ALTER TABLE "Match" ADD COLUMN "knockoutAdvancingIsHome" BOOLEAN;
