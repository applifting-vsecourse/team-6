-- Kvintets started by old instances during the #66 deploy only have categoryId: keep their category.
INSERT INTO "kvintet_category" ("kvintetId", "categoryId")
SELECT "id", "categoryId" FROM "kvintet"
ON CONFLICT DO NOTHING;

-- DropForeignKey
ALTER TABLE "kvintet" DROP CONSTRAINT "kvintet_categoryId_fkey";

-- AlterTable
ALTER TABLE "kvintet" DROP COLUMN "categoryId";
