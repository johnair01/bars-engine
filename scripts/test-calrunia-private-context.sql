\set ON_ERROR_STOP on
-- Run only against a disposable local database at the pre-migration schema.
BEGIN;
INSERT INTO "custom_bars" ("id", "creatorId", "title", "description", "type", "visibility", "status", "agentMetadata")
VALUES ('calrunia-private-test', 'test-admin', 'kernel', 'kernel', 'bar', 'private', 'active',
        '{"source":"calrunia_return_v1","charge":{"q1":{"words":"private context"}},"notes":[1,2]}');
\ir ../prisma/migrations/20261113000100_calrunia_bar_private_context/migration.sql
DO $$
DECLARE metadata TEXT; context JSONB; owner_count INTEGER; other_count INTEGER;
BEGIN
  SELECT "agentMetadata" INTO metadata FROM "custom_bars" WHERE "id" = 'calrunia-private-test';
  SELECT "data" INTO context FROM "calrunia_bar_private_contexts" WHERE "bar_id" = 'calrunia-private-test';
  IF metadata::jsonb->>'source' <> 'calrunia_return_v2' OR metadata LIKE '%private context%' OR context->'charge'->'q1'->>'words' <> 'private context' THEN
    RAISE EXCEPTION 'private-context migration did not preserve and isolate the snapshot';
  END IF;
  SELECT count(*) INTO owner_count FROM "custom_bars" WHERE "id" = 'calrunia-private-test' AND "creatorId" = 'test-admin';
  SELECT count(*) INTO other_count FROM "custom_bars" WHERE "id" = 'calrunia-private-test' AND "creatorId" = 'another-player';
  IF owner_count <> 1 OR other_count <> 0 THEN RAISE EXCEPTION 'owner lookup predicate failed'; END IF;
  DELETE FROM "custom_bars" WHERE "id" = 'calrunia-private-test';
  IF EXISTS (SELECT 1 FROM "calrunia_bar_private_contexts" WHERE "bar_id" = 'calrunia-private-test') THEN
    RAISE EXCEPTION 'hard delete did not remove private context';
  END IF;
END $$;
ROLLBACK;
