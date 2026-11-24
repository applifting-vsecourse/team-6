-- Story #176: new matching data is filed under `subject` (a keyed hash computed by the app, the
-- secret is not in the database) instead of a user id.
--
-- Additive only: nothing is dropped or rewritten, so existing rows, users and the running backend
-- are unaffected. Rows written before this have only `userId` (legacy); the app reads them through
-- the same hash, and the column is dropped in a later migration once they are backfilled or aged out.

ALTER TABLE "feed_snapshot" ADD COLUMN "subject" TEXT;
ALTER TABLE "membership_log" ADD COLUMN "subject" TEXT;

CREATE INDEX "feed_snapshot_subject_id_idx" ON "feed_snapshot"("subject", "id");
CREATE INDEX "membership_log_subject_idx" ON "membership_log"("subject");
