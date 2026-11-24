-- Story #176: matching data must not be linkable to a user. The tables lose their user reference;
-- `subject` is a keyed hash computed by the app (the secret is not in the database).
--
-- Existing rows keep their grouping (rows of one person share a subject) with a random token that
-- is generated here and discarded, so the old user ids are not recoverable. Rows written from now
-- on use the app's keyed hash, so a person's old and new rows are not linked to each other.
-- NOTE: this drops columns, which is not additive; it is deliberate, as keeping `userId` around
-- would keep the link.

-- One explicit transaction: without it a failure halfway leaves the tables half converted.
BEGIN;

ALTER TABLE "feed_snapshot" ADD COLUMN "subject" TEXT;
ALTER TABLE "membership_log" ADD COLUMN "subject" TEXT;

CREATE TEMPORARY TABLE "matching_subject" ON COMMIT DROP AS
SELECT "userId", replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') AS "subject"
FROM (
  SELECT "userId" FROM "feed_snapshot" WHERE "userId" IS NOT NULL
  UNION
  SELECT "userId" FROM "membership_log" WHERE "userId" IS NOT NULL
) AS "ids";

UPDATE "feed_snapshot" f SET "subject" = m."subject"
FROM "matching_subject" m WHERE f."userId" = m."userId";
UPDATE "membership_log" l SET "subject" = m."subject"
FROM "matching_subject" m WHERE l."userId" = m."userId";

ALTER TABLE "feed_snapshot" DROP CONSTRAINT "feed_snapshot_userId_fkey";
ALTER TABLE "membership_log" DROP CONSTRAINT "membership_log_userId_fkey";
DROP INDEX "feed_snapshot_userId_id_idx";
DROP INDEX "membership_log_userId_idx";
ALTER TABLE "feed_snapshot" DROP COLUMN "userId";
ALTER TABLE "membership_log" DROP COLUMN "userId";

CREATE INDEX "feed_snapshot_subject_id_idx" ON "feed_snapshot"("subject", "id");
CREATE INDEX "membership_log_subject_idx" ON "membership_log"("subject");

COMMIT;
