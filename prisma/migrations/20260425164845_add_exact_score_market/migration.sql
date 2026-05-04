-- AlterEnum
ALTER TYPE "MarketType" ADD VALUE 'EXACT_SCORE';

-- CreateTable
CREATE TABLE "SimpleTip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "predictedHome" INTEGER NOT NULL,
    "predictedAway" INTEGER NOT NULL,
    "stake" INTEGER NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "payout" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimpleTip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimpleTip_userId_createdAt_idx" ON "SimpleTip"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SimpleTip_matchId_idx" ON "SimpleTip"("matchId");

-- AddForeignKey
ALTER TABLE "SimpleTip" ADD CONSTRAINT "SimpleTip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimpleTip" ADD CONSTRAINT "SimpleTip_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
