-- L3-ready schema additions for narrative sovereignty.
-- Adds nullable narrativeSovereignty JSON field to campaigns,
-- plus CampaignLoreEntry and StoryArcTemplate tables for future
-- L3 narrative world-building and story arc authoring.
--
-- All new columns/tables are nullable or have defaults —
-- fully backward compatible; no data migration required.

-- Add narrativeSovereignty JSON field to campaigns
ALTER TABLE "campaigns" ADD COLUMN "narrativeSovereignty" JSONB;

-- L3: Campaign lore entries (characters, places, factions, events)
CREATE TABLE "campaign_lore_entries" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_lore_entries_pkey" PRIMARY KEY ("id")
);

-- L3: Story arc templates (narrative structure definitions)
CREATE TABLE "story_arc_templates" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "arcType" TEXT NOT NULL DEFAULT 'linear',
    "definition" JSONB NOT NULL DEFAULT '{}',
    "sovereignty" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_arc_templates_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "campaign_lore_entries_campaignId_category_status_idx" ON "campaign_lore_entries"("campaignId", "category", "status");
CREATE INDEX "story_arc_templates_campaignId_status_idx" ON "story_arc_templates"("campaignId", "status");

-- Foreign keys
ALTER TABLE "campaign_lore_entries" ADD CONSTRAINT "campaign_lore_entries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaign_lore_entries" ADD CONSTRAINT "campaign_lore_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "story_arc_templates" ADD CONSTRAINT "story_arc_templates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
