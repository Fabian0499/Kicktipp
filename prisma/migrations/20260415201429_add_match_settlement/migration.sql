-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "awayScore" INTEGER,
ADD COLUMN     "homeScore" INTEGER,
ADD COLUMN     "settledAt" TIMESTAMP(3);
