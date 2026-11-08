-- Members who already have a chat would otherwise see all of its history as unread after the
-- deploy (the column defaults to 0). Start them at the newest message; new members keep 0.
UPDATE "kvintet_member" AS m
SET "lastReadMessageId" = COALESCE(
  (SELECT MAX(x."id") FROM "message" AS x WHERE x."kvintetId" = m."kvintetId"),
  0
);
