-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "privacyNoticeSeenAt" TIMESTAMP(3);

-- Stored locations were exact to about 11 m; matching needs a radius of 5 km or more, so keep
-- two decimals (about 1 km). Not reversible. Safe to run again.
UPDATE "profile"
SET "latitude" = ROUND("latitude"::numeric, 2)::double precision,
    "longitude" = ROUND("longitude"::numeric, 2)::double precision
WHERE "latitude" IS NOT NULL OR "longitude" IS NOT NULL;
