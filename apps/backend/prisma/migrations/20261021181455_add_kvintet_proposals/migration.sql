-- CreateEnum
CREATE TYPE "kvintet_status" AS ENUM ('FORMING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "profile_tag_kind" AS ENUM ('TEACH', 'LEARN', 'INTEREST');

-- CreateEnum
CREATE TYPE "meeting_frequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "userId" TEXT NOT NULL,
    "position" TEXT,
    "meetingFrequency" "meeting_frequency",

    CONSTRAINT "profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "profile_tag" (
    "userId" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,
    "kind" "profile_tag_kind" NOT NULL,

    CONSTRAINT "profile_tag_pkey" PRIMARY KEY ("userId","tagId","kind")
);

-- CreateTable
CREATE TABLE "kvintet" (
    "id" UUID NOT NULL,
    "status" "kvintet_status" NOT NULL DEFAULT 'FORMING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "kvintet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kvintet_member" (
    "kvintetId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kvintet_member_pkey" PRIMARY KEY ("kvintetId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- CreateIndex
CREATE INDEX "kvintet_status_createdAt_idx" ON "kvintet"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "kvintet_member_userId_key" ON "kvintet_member"("userId");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_tag" ADD CONSTRAINT "profile_tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_tag" ADD CONSTRAINT "profile_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kvintet" ADD CONSTRAINT "kvintet_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kvintet_member" ADD CONSTRAINT "kvintet_member_kvintetId_fkey" FOREIGN KEY ("kvintetId") REFERENCES "kvintet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kvintet_member" ADD CONSTRAINT "kvintet_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reference data. Lives in a migration so it reaches production with the normal deploy.
INSERT INTO "category" ("slug", "sortOrder") VALUES
    ('technology', 1),
    ('business', 2),
    ('languages', 3),
    ('personal-development', 4),
    ('leisure', 5)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "tag" ("slug") VALUES
    ('python'),
    ('sql'),
    ('excel'),
    ('ux-design'),
    ('statistics'),
    ('data-analysis'),
    ('roadmapping'),
    ('negotiation'),
    ('interviewing'),
    ('public-speaking'),
    ('copywriting'),
    ('social-media'),
    ('spanish'),
    ('startups'),
    ('running'),
    ('board-games'),
    ('hiking'),
    ('travel'),
    ('music'),
    ('cooking')
ON CONFLICT ("slug") DO NOTHING;
