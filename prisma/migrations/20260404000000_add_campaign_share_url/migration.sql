-- Add shareable URL field to campaigns
-- Populated upon campaign approval (null while DRAFT/PENDING_REVIEW)
ALTER TABLE "campaigns" ADD COLUMN "shareUrl" TEXT;
