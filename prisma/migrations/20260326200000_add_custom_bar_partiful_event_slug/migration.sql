-- AlterTable (EIP: event invite BAR — Partiful RSVP + event-scoped initiation)
ALTER TABLE "bars" ADD COLUMN IF NOT EXISTS "partifulUrl" TEXT;
ALTER TABLE "bars" ADD COLUMN IF NOT EXISTS "eventSlug" TEXT;
