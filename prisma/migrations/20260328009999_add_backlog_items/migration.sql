-- CreateTable: backlog_items
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "backlog_items" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "area" TEXT NOT NULL DEFAULT 'other',
    "status" TEXT NOT NULL DEFAULT 'new',
    "linkedDocNodeId" TEXT,
    "linkedDocQuestId" TEXT,

    CONSTRAINT "backlog_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "backlog_items_status_idx" ON "backlog_items"("status");
