-- Campaign Hub/Spoke Architecture: BAR Seed Fields
-- Sub-AC 2a: Ensure custom_bars has fields required for a seed
-- (title, type, status already exist from init_postgres migration)
-- This migration adds spokeSessionId to custom_bars and creates the
-- dependent campaign spoke tables if they don't yet exist.
--
-- All statements use IF NOT EXISTS / idempotent DO-EXCEPTION pattern
-- so this migration is safe to apply on existing databases where these
-- tables were created via db push.

-- =====================================================================
-- 1. CampaignDeckCard — one hexagram card per campaign
-- =====================================================================
CREATE TABLE IF NOT EXISTS "campaign_deck_cards" (
    "id"                TEXT NOT NULL,
    "campaignRef"       TEXT NOT NULL,
    "hexagramId"        INTEGER NOT NULL,
    "theme"             TEXT,
    "domain"            TEXT,
    "cyoaAdventureId"   TEXT,
    "questId"           TEXT,
    "createdByPlayerId" TEXT NOT NULL,
    "status"            TEXT NOT NULL DEFAULT 'draft',
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_deck_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_deck_cards_campaignRef_hexagramId_key"
    ON "campaign_deck_cards"("campaignRef", "hexagramId");
CREATE INDEX IF NOT EXISTS "campaign_deck_cards_campaignRef_status_idx"
    ON "campaign_deck_cards"("campaignRef", "status");

DO $$ BEGIN
  ALTER TABLE "campaign_deck_cards"
    ADD CONSTRAINT "campaign_deck_cards_createdByPlayerId_fkey"
    FOREIGN KEY ("createdByPlayerId") REFERENCES "players"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 2. CampaignPeriod — one draw cycle (8 portals) per kotter stage
-- =====================================================================
CREATE TABLE IF NOT EXISTS "campaign_periods" (
    "id"           TEXT NOT NULL,
    "campaignRef"  TEXT NOT NULL,
    "instanceId"   TEXT,
    "periodNumber" INTEGER NOT NULL,
    "kotterStage"  TEXT,
    "status"       TEXT NOT NULL DEFAULT 'active',
    "drawnCardIds" TEXT NOT NULL DEFAULT '[]',
    "startedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt"      TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_periods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_periods_campaignRef_periodNumber_key"
    ON "campaign_periods"("campaignRef", "periodNumber");
CREATE INDEX IF NOT EXISTS "campaign_periods_campaignRef_status_idx"
    ON "campaign_periods"("campaignRef", "status");

DO $$ BEGIN
  ALTER TABLE "campaign_periods"
    ADD CONSTRAINT "campaign_periods_instanceId_fkey"
    FOREIGN KEY ("instanceId") REFERENCES "instances"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 3. CampaignPortal — one spoke slot per period (slotIndex 0-7)
-- =====================================================================
CREATE TABLE IF NOT EXISTS "campaign_portals" (
    "id"              TEXT NOT NULL,
    "periodId"        TEXT NOT NULL,
    "campaignRef"     TEXT NOT NULL,
    "slotIndex"       INTEGER NOT NULL,
    "hexagramId"      INTEGER,
    "deckCardId"      TEXT,
    "cyoaAdventureId" TEXT,
    "questId"         TEXT,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_portals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_portals_periodId_slotIndex_key"
    ON "campaign_portals"("periodId", "slotIndex");
CREATE INDEX IF NOT EXISTS "campaign_portals_campaignRef_periodId_idx"
    ON "campaign_portals"("campaignRef", "periodId");

DO $$ BEGIN
  ALTER TABLE "campaign_portals"
    ADD CONSTRAINT "campaign_portals_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "campaign_periods"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "campaign_portals"
    ADD CONSTRAINT "campaign_portals_deckCardId_fkey"
    FOREIGN KEY ("deckCardId") REFERENCES "campaign_deck_cards"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 4. SpokeSession — a player's journey through one portal's CYOA
-- Includes intakeCheckInId column (later added by 20260424000000 migration;
-- included here for idempotent fresh-DB setup).
-- =====================================================================
CREATE TABLE IF NOT EXISTS "spoke_sessions" (
    "id"               TEXT NOT NULL,
    "portalId"         TEXT NOT NULL,
    "playerId"         TEXT NOT NULL,
    "campaignRef"      TEXT NOT NULL,
    "moveType"         TEXT,
    "gmFace"           TEXT,
    "status"           TEXT NOT NULL DEFAULT 'in_progress',
    "barSeedIds"       TEXT NOT NULL DEFAULT '[]',
    "generatedQuestId" TEXT,
    "moveChosenAt"     TIMESTAMP(3),
    "faceChosenAt"     TIMESTAMP(3),
    "completedAt"      TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intakeCheckInId"  TEXT,
    CONSTRAINT "spoke_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "spoke_sessions_portalId_playerId_idx"
    ON "spoke_sessions"("portalId", "playerId");
CREATE INDEX IF NOT EXISTS "spoke_sessions_playerId_status_idx"
    ON "spoke_sessions"("playerId", "status");
CREATE INDEX IF NOT EXISTS "spoke_sessions_intakeCheckInId_idx"
    ON "spoke_sessions"("intakeCheckInId");

DO $$ BEGIN
  ALTER TABLE "spoke_sessions"
    ADD CONSTRAINT "spoke_sessions_portalId_fkey"
    FOREIGN KEY ("portalId") REFERENCES "campaign_portals"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "spoke_sessions"
    ADD CONSTRAINT "spoke_sessions_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "spoke_sessions"
    ADD CONSTRAINT "spoke_sessions_intakeCheckInId_fkey"
    FOREIGN KEY ("intakeCheckInId") REFERENCES "alchemy_check_ins"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 5. custom_bars.spokeSessionId — FK to SpokeSession
-- When set: this BAR seed was emitted from a spoke CYOA (status='seed').
-- Covers "spokeCyoaId" field requirement for Campaign Hub/Spoke seeds.
-- =====================================================================
ALTER TABLE "custom_bars" ADD COLUMN IF NOT EXISTS "spokeSessionId" TEXT;

CREATE INDEX IF NOT EXISTS "custom_bars_spokeSessionId_idx"
    ON "custom_bars"("spokeSessionId");

DO $$ BEGIN
  ALTER TABLE "custom_bars"
    ADD CONSTRAINT "custom_bars_spokeSessionId_fkey"
    FOREIGN KEY ("spokeSessionId") REFERENCES "spoke_sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
