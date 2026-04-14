-- AlterTable: Add portraysFace to NpcConstitution
-- Nullable GameMasterFace string (shaman|challenger|regent|architect|diplomat|sage)
-- Fixed per NPC; Sage NPCs compute effectiveFace at runtime
ALTER TABLE "npc_constitutions" ADD COLUMN "portraysFace" TEXT;
