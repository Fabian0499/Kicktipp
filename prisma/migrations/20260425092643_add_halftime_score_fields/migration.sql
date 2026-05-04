-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MarketType" ADD VALUE 'HALF_TIME_ONE_X_TWO';
ALTER TYPE "MarketType" ADD VALUE 'HALF_TIME_FULL_TIME';
ALTER TYPE "MarketType" ADD VALUE 'OVER_UNDER_1_5';
ALTER TYPE "MarketType" ADD VALUE 'OVER_UNDER_3_5';
ALTER TYPE "MarketType" ADD VALUE 'OVER_UNDER_4_5';
ALTER TYPE "MarketType" ADD VALUE 'OVER_UNDER_5_5';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "awayHalfTimeScore" INTEGER,
ADD COLUMN     "homeHalfTimeScore" INTEGER;
