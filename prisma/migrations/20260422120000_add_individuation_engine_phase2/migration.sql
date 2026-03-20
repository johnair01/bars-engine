-- Individuation Engine Phase 2 (IE-8–10): Daemon codex, scene biases, charge archetypeKey

ALTER TABLE "daemons" ADD COLUMN "voice" TEXT;
ALTER TABLE "daemons" ADD COLUMN "desire" TEXT;
ALTER TABLE "daemons" ADD COLUMN "fear" TEXT;
ALTER TABLE "daemons" ADD COLUMN "shadow" TEXT;
ALTER TABLE "daemons" ADD COLUMN "evolutionLog" TEXT NOT NULL DEFAULT '[]';

ALTER TABLE "custom_bars" ADD COLUMN "archetypeKey" TEXT;

ALTER TABLE "alchemy_scene_templates" ADD COLUMN "kotterStageBias" TEXT;
ALTER TABLE "alchemy_scene_templates" ADD COLUMN "campaignFrontBias" TEXT;
