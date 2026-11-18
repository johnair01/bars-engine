-- CreateTable: assets
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "assets" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT,
    "metadata_json" TEXT,
    "owner_id" TEXT NOT NULL,
    "custom_bar_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "assets_custom_bar_id_idx" ON "assets"("custom_bar_id");

CREATE INDEX IF NOT EXISTS "assets_type_idx" ON "assets"("type");
