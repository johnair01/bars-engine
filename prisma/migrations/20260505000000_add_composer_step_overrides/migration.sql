-- AlterTable: Add composerStepOverrides JSON column to instances (Campaign model)
-- GM-overridable CYOA Composer step ordering per campaign.
-- JSON shape: { steps: [{ key: string, enabled: boolean, order: number }] }
ALTER TABLE "instances" ADD COLUMN "composerStepOverrides" JSONB;

-- AlterTable: Add composerStepOverrides JSON column to adventure_templates
-- Default CYOA Composer step ordering for adventures using this template.
-- Campaign-level overrides take precedence when set.
ALTER TABLE "adventure_templates" ADD COLUMN "composerStepOverrides" JSONB;
