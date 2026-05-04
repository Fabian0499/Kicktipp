-- Ecken-Matrix (0–8): CORNERS:U/E/O; Auswertung über totalCorners
ALTER TYPE "MarketType" ADD VALUE 'CORNERS_MATRIX';

ALTER TABLE "Match" ADD COLUMN "totalCorners" INTEGER;
