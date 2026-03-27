-- DSW Phase 2: structured wizard echo (milestone / quest ids) alongside honor donation note
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "dsw_meta" JSONB;
