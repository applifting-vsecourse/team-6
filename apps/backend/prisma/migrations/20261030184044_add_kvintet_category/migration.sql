-- CreateTable
CREATE TABLE "kvintet_category" (
    "kvintetId" UUID NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "kvintet_category_pkey" PRIMARY KEY ("kvintetId","categoryId")
);

-- CreateIndex
CREATE INDEX "kvintet_category_categoryId_idx" ON "kvintet_category"("categoryId");

-- AddForeignKey
ALTER TABLE "kvintet_category" ADD CONSTRAINT "kvintet_category_kvintetId_fkey" FOREIGN KEY ("kvintetId") REFERENCES "kvintet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kvintet_category" ADD CONSTRAINT "kvintet_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill (data, written by hand): every existing kvintet keeps its single category.
INSERT INTO "kvintet_category" ("kvintetId", "categoryId")
SELECT "id", "categoryId" FROM "kvintet"
ON CONFLICT DO NOTHING;
