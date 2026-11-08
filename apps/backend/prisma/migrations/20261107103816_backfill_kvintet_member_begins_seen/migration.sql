-- Members of a kvintet that is already ACTIVE have long since started it: without this the new
-- "Kvintet begins" page would greet them all once after the deploy (the column is NULL).
-- New activations keep NULL, so their members see the page. Safe to run again.
UPDATE "kvintet_member" AS m
SET "beginsSeenAt" = NOW()
FROM "kvintet" AS k
WHERE k."id" = m."kvintetId"
  AND k."status" = 'ACTIVE'
  AND m."beginsSeenAt" IS NULL;
