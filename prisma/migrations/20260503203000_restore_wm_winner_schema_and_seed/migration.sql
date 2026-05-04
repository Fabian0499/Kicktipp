-- Reparatur: WM-Sieger-Tabellen + Stammdaten (nach versehentlichem DROP oder fehlendem Event)
-- Idempotent: mehrfaches Ausführen ist unkritisch.

CREATE TABLE IF NOT EXISTS "WmWinnerEvent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "winnerOptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WmWinnerEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WmWinnerEvent_key_key" ON "WmWinnerEvent"("key");
CREATE INDEX IF NOT EXISTS "WmWinnerEvent_key_idx" ON "WmWinnerEvent"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "WmWinnerEvent_winnerOptionId_key" ON "WmWinnerEvent"("winnerOptionId");

CREATE TABLE IF NOT EXISTS "WmWinnerOption" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "isField" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "WmWinnerOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WmWinnerOption_eventId_sortOrder_key" ON "WmWinnerOption"("eventId", "sortOrder");
CREATE INDEX IF NOT EXISTS "WmWinnerOption_eventId_idx" ON "WmWinnerOption"("eventId");

CREATE TABLE IF NOT EXISTS "WmWinnerPick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "stake" INTEGER NOT NULL,
    "oddsSnapshot" DOUBLE PRECISION NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'OPEN',
    "payoutAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WmWinnerPick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WmWinnerPick_userId_eventId_key" ON "WmWinnerPick"("userId", "eventId");
CREATE INDEX IF NOT EXISTS "WmWinnerPick_eventId_idx" ON "WmWinnerPick"("eventId");
CREATE INDEX IF NOT EXISTS "WmWinnerPick_userId_idx" ON "WmWinnerPick"("userId");

DO $$
BEGIN
  ALTER TABLE "WmWinnerOption"
    ADD CONSTRAINT "WmWinnerOption_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "WmWinnerEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WmWinnerEvent"
    ADD CONSTRAINT "WmWinnerEvent_winnerOptionId_fkey"
    FOREIGN KEY ("winnerOptionId") REFERENCES "WmWinnerOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WmWinnerPick"
    ADD CONSTRAINT "WmWinnerPick_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WmWinnerPick"
    ADD CONSTRAINT "WmWinnerPick_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "WmWinnerEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WmWinnerPick"
    ADD CONSTRAINT "WmWinnerPick_optionId_fkey"
    FOREIGN KEY ("optionId") REFERENCES "WmWinnerOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "WmWinnerEvent" ("id", "key", "title", "closesAt", "createdAt", "updatedAt")
VALUES (
    'wm2026evt',
    'WM_2026',
    'WM Sieger 2026',
    TIMESTAMP '2026-06-11 15:00:00',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "WmWinnerOption" ("id", "eventId", "label", "sortOrder", "odds", "isField") VALUES
('wm2026o01', 'wm2026evt', 'Spanien', 1, 8.0, false),
('wm2026o02', 'wm2026evt', 'Frankreich', 2, 8.0, false),
('wm2026o03', 'wm2026evt', 'England', 3, 8.0, false),
('wm2026o04', 'wm2026evt', 'Brasilien', 4, 8.0, false),
('wm2026o05', 'wm2026evt', 'Argentinien', 5, 8.0, false),
('wm2026o06', 'wm2026evt', 'Portugal', 6, 8.0, false),
('wm2026o07', 'wm2026evt', 'Deutschland', 7, 8.0, false),
('wm2026o08', 'wm2026evt', 'Alle anderen Mannschaften', 8, 15.0, true)
ON CONFLICT ("eventId", "sortOrder") DO NOTHING;
