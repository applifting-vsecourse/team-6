-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "tourCompletedAt" TIMESTAMP(3);

-- Existing users have long since found their way around: without this the new product tour
-- would greet them all once after the deploy (the column is NULL). Profiles created later
-- keep NULL, so new users get the tour. Safe to run again.
UPDATE "profile" SET "tourCompletedAt" = NOW() WHERE "tourCompletedAt" IS NULL;
