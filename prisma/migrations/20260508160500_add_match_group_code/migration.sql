-- Add optional world-cup group code (A-L) to matches
ALTER TABLE "Match" ADD COLUMN "groupCode" TEXT;
