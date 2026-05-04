CREATE TABLE "UserMatchBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 100,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMatchBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMatchBudget_userId_matchId_key" ON "UserMatchBudget"("userId", "matchId");
CREATE INDEX "UserMatchBudget_matchId_idx" ON "UserMatchBudget"("matchId");

ALTER TABLE "UserMatchBudget" ADD CONSTRAINT "UserMatchBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserMatchBudget" ADD CONSTRAINT "UserMatchBudget_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserMatchBudget" ("id", "userId", "matchId", "allocated", "spent", "createdAt", "updatedAt")
SELECT
  'umb_' || md5(u."id" || ':' || m."id"),
  u."id",
  m."id",
  100,
  0,
  NOW(),
  NOW()
FROM "User" u
CROSS JOIN "Match" m
WHERE m."isPublished" = true
  AND m."settledAt" IS NULL
  AND u."status" <> 'BLOCKED'
ON CONFLICT ("userId", "matchId") DO NOTHING;

UPDATE "UserMatchBudget" umb
SET "spent" = LEAST(100, COALESCE(b.total_stake, 0)),
    "updatedAt" = NOW()
FROM (
  SELECT "userId", "matchId", SUM("stake")::int AS total_stake
  FROM "Bet"
  GROUP BY "userId", "matchId"
) b
WHERE umb."userId" = b."userId"
  AND umb."matchId" = b."matchId";

INSERT INTO "PointTransaction" ("id", "userId", "amount", "type", "description", "createdAt")
SELECT
  'pt_alloc_' || md5(umb."userId" || ':' || umb."matchId"),
  umb."userId",
  umb."allocated",
  'CREDIT',
  'Spielbudget freigegeben (Bestand): ' || m."homeTeam" || ' vs. ' || m."awayTeam",
  NOW()
FROM "UserMatchBudget" umb
JOIN "Match" m ON m."id" = umb."matchId";
