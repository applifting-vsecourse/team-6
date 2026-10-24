-- CreateEnum
CREATE TYPE "message_kind" AS ENUM ('USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "kvintetId" UUID NOT NULL,
    "authorId" TEXT,
    "kind" "message_kind" NOT NULL DEFAULT 'USER',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_kvintetId_id_idx" ON "message"("kvintetId", "id");

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_kvintetId_fkey" FOREIGN KEY ("kvintetId") REFERENCES "kvintet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
