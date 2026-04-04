-- Campaign Self-Serve: approval workflow fields.
-- NOTE: This migration is a no-op. The initial campaign_self_serve migration
-- (20260404000000) already created the campaigns table with the final enum
-- values (DRAFT, PENDING_REVIEW, APPROVED, REJECTED, LIVE, ARCHIVED) and
-- the approval columns (submittedAt, reviewedById, reviewedAt, rejectionReason).
-- This migration is preserved for migration history ordering only.

-- No-op: all changes already applied by 20260404000000_add_campaign_self_serve
