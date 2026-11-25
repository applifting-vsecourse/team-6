-- A description is now required. Kvintets started without one keep their title as the description.
UPDATE "kvintet" SET "description" = "title" WHERE "description" IS NULL OR btrim("description") = '';

-- AlterTable
ALTER TABLE "kvintet" ALTER COLUMN "description" SET NOT NULL;
