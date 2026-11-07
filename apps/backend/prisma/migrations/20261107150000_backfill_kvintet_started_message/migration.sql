-- Active kvintets now open their chat with a SYSTEM line (body is a code the client translates).
-- Add it to the ones that are already active and still have an empty chat. Chats that already
-- have messages are left alone: the list is ordered by id, so a new row would land below the
-- conversation instead of above it.
INSERT INTO "message" ("kvintetId", "kind", "body", "createdAt")
SELECT k."id", 'SYSTEM', 'kvintet_started', COALESCE(k."activatedAt", k."createdAt")
FROM "kvintet" AS k
WHERE k."status" = 'ACTIVE'
  AND NOT EXISTS (SELECT 1 FROM "message" AS x WHERE x."kvintetId" = k."id");
