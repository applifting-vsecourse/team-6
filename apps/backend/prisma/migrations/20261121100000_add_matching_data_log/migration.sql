-- CreateEnum
CREATE TYPE "membership_source" AS ENUM ('STARTED', 'JOINED');

-- CreateTable
CREATE TABLE "feed_snapshot" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fallback" BOOLEAN NOT NULL,
    "items" JSONB NOT NULL,

    CONSTRAINT "feed_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_log" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "kvintetId" UUID NOT NULL,
    "source" "membership_source" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "snapshotId" INTEGER,
    "position" INTEGER,
    "listSize" INTEGER,
    "score" DOUBLE PRECISION,

    CONSTRAINT "membership_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kvintet_log" (
    "kvintetId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "kvintet_log_pkey" PRIMARY KEY ("kvintetId")
);

-- CreateIndex
CREATE INDEX "feed_snapshot_userId_id_idx" ON "feed_snapshot"("userId", "id");

-- CreateIndex
CREATE INDEX "membership_log_userId_idx" ON "membership_log"("userId");

-- CreateIndex
CREATE INDEX "membership_log_kvintetId_idx" ON "membership_log"("kvintetId");

-- AddForeignKey
ALTER TABLE "feed_snapshot" ADD CONSTRAINT "feed_snapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_log" ADD CONSTRAINT "membership_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_log" ADD CONSTRAINT "membership_log_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "feed_snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing kvintets and members start the log, so their leave and start are recorded too.
-- The earliest member of a kvintet is taken to be the one who started it.
INSERT INTO "kvintet_log" ("kvintetId", "createdAt", "activatedAt")
SELECT "id", "createdAt", "activatedAt" FROM "kvintet";

INSERT INTO "membership_log" ("userId", "kvintetId", "source", "joinedAt")
SELECT "userId", "kvintetId",
  CASE WHEN ROW_NUMBER() OVER (PARTITION BY "kvintetId" ORDER BY "joinedAt") = 1
    THEN 'STARTED'::"membership_source" ELSE 'JOINED'::"membership_source" END,
  "joinedAt"
FROM "kvintet_member";
