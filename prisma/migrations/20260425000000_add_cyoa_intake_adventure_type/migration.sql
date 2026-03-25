-- Add adventureType column back to adventures table (was dropped in 20260314000000_drop_adventure_type
-- but schema.prisma retained the field for CHARACTER_CREATOR and now CYOA_INTAKE).
-- Valid values: CHARACTER_CREATOR | CYOA_INTAKE | null
ALTER TABLE "adventures" ADD COLUMN IF NOT EXISTS "adventureType" TEXT;

-- Ensure playbookTemplate column is also present (used by both CHARACTER_CREATOR and CYOA_INTAKE).
ALTER TABLE "adventures" ADD COLUMN IF NOT EXISTS "playbookTemplate" TEXT;
