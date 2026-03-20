-- AlterTable: Shadow321Session name resolution (321 Suggest Name Phase 6)
ALTER TABLE "shadow_321_sessions" ADD COLUMN "finalShadowName" TEXT;
ALTER TABLE "shadow_321_sessions" ADD COLUMN "nameResolution" TEXT;
ALTER TABLE "shadow_321_sessions" ADD COLUMN "suggestionCount" INTEGER;
