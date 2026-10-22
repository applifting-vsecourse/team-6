-- AlterTable
ALTER TABLE "profile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "kvintet_vote" (
    "kvintetId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kvintet_vote_pkey" PRIMARY KEY ("kvintetId","userId")
);

-- AddForeignKey
ALTER TABLE "kvintet_vote" ADD CONSTRAINT "kvintet_vote_kvintetId_fkey" FOREIGN KEY ("kvintetId") REFERENCES "kvintet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kvintet_vote" ADD CONSTRAINT "kvintet_vote_kvintetId_userId_fkey" FOREIGN KEY ("kvintetId", "userId") REFERENCES "kvintet_member"("kvintetId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
