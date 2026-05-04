-- AlterEnum
ALTER TYPE "MarketType" ADD VALUE 'CARDS_MATRIX';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "totalCards" INTEGER;
