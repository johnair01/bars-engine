-- Phase 2a.1: Add Campaign inheritance fields

-- Add inheritedWorld JSON field (read-only snapshot of inherited world)
ALTER TABLE "campaigns" ADD COLUMN "inheritedWorld" JSONB;

-- Add campaignFlavorLayers JSON field (customizable flavor layers)
ALTER TABLE "campaigns" ADD COLUMN "campaignFlavorLayers" JSONB;

-- Create indexes for future filtering on these fields
CREATE INDEX "campaigns_inheritedWorld_idx" ON "campaigns" USING GIN ("inheritedWorld");
CREATE INDEX "campaigns_campaignFlavorLayers_idx" ON "campaigns" USING GIN ("campaignFlavorLayers");
