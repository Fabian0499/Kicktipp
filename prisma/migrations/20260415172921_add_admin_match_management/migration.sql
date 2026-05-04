-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('ONE_X_TWO', 'OVER_UNDER_2_5', 'BOTH_TEAMS_TO_SCORE', 'DOUBLE_CHANCE');

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchMarket" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "type" "MarketType" NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchMarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketOption" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_startsAt_idx" ON "Match"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchMarket_matchId_type_key" ON "MatchMarket"("matchId", "type");

-- CreateIndex
CREATE INDEX "MarketOption_marketId_idx" ON "MarketOption"("marketId");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMarket" ADD CONSTRAINT "MatchMarket_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketOption" ADD CONSTRAINT "MarketOption_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "MatchMarket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
