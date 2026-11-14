-- Friendcraft: the deck pages' default text, editable by a site admin or a Friendcraft steward.
-- One nullable JSON column on the instance; null keeps the built-in text. Nothing else is touched.
ALTER TABLE "instances" ADD COLUMN "friendcraft_copy" JSONB;
