-- Non-destructive: Prisma upsert on Archetype.name needs uniqueness on archetypes.name.
-- Table was historically "playbooks" with playbooks_name_key; after rename, index should be on archetypes.
CREATE UNIQUE INDEX IF NOT EXISTS "archetypes_name_key" ON "archetypes"("name");
