-- Exact Score: Sammel-/3:3-Zeile von Auswahl „3:3“ auf Label „X:X“ umbenennen (bestehende Daten)

UPDATE "MarketOption" mo
SET outcome = 'X:X'
FROM "MatchMarket" mm
WHERE mo."marketId" = mm.id
  AND mm.type::text = 'EXACT_SCORE'
  AND mo.outcome = '3:3';

UPDATE "Bet"
SET "outcomeLabel" = 'X:X'
WHERE "marketType"::text = 'EXACT_SCORE'
  AND "outcomeLabel" = '3:3';
