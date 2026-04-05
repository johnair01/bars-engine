-- Non-destructive: does not delete or change row data.
-- Prisma `upsert` on Nation.name requires a unique constraint on `nations.name`.
-- Some databases lost `nations_name_key` (drift, manual change, or partial restore).
-- `IF NOT EXISTS` skips if the index is already there.

CREATE UNIQUE INDEX IF NOT EXISTS "nations_name_key" ON "nations"("name");
