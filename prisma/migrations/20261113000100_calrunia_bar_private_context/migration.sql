-- Keep a player's encounter intake outside the shareable BAR row.
CREATE TABLE "calrunia_bar_private_contexts" (
  "bar_id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calrunia_bar_private_contexts_pkey" PRIMARY KEY ("bar_id"),
  CONSTRAINT "calrunia_bar_private_contexts_bar_id_fkey" FOREIGN KEY ("bar_id") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Move v1 snapshots atomically. Invalid candidate data aborts the migration rather
-- than silently deleting a player's context; unrelated metadata is left alone.
DO $$
DECLARE r RECORD; meta JSONB;
BEGIN
  FOR r IN SELECT "id", "agentMetadata" FROM "custom_bars" WHERE "agentMetadata" LIKE '%calrunia_return_v1%' LOOP
    BEGIN
      meta := r."agentMetadata"::jsonb;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid Calrunia return metadata on BAR %', r."id";
    END;
    IF meta->>'source' = 'calrunia_return_v1' THEN
      IF jsonb_typeof(meta->'charge') IS DISTINCT FROM 'object' OR jsonb_typeof(meta->'notes') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Invalid Calrunia return context on BAR %', r."id";
      END IF;
      INSERT INTO "calrunia_bar_private_contexts" ("bar_id", "data") VALUES (r."id", jsonb_build_object('charge', meta->'charge', 'notes', meta->'notes'));
      UPDATE "custom_bars" SET "agentMetadata" = (meta - 'charge' - 'notes' || '{"source":"calrunia_return_v2"}'::jsonb)::text WHERE "id" = r."id";
    END IF;
  END LOOP;
END $$;
