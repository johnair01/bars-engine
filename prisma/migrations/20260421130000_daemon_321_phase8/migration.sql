-- AlterTable: Daemon SN Phase 8 — 321 session link, inner work digest, NPC promotion
ALTER TABLE "daemons" ADD COLUMN "shadow321SessionId" TEXT;
ALTER TABLE "daemons" ADD COLUMN "innerWorkDigest" JSONB;
ALTER TABLE "daemons" ADD COLUMN "promotedToPlayerId" TEXT;

CREATE UNIQUE INDEX "daemons_promotedToPlayerId_key" ON "daemons"("promotedToPlayerId");

CREATE INDEX "daemons_shadow321SessionId_idx" ON "daemons"("shadow321SessionId");

ALTER TABLE "daemons" ADD CONSTRAINT "daemons_shadow321SessionId_fkey" FOREIGN KEY ("shadow321SessionId") REFERENCES "shadow_321_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "daemons" ADD CONSTRAINT "daemons_promotedToPlayerId_fkey" FOREIGN KEY ("promotedToPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
