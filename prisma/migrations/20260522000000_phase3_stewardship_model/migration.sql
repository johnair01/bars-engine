-- Phase 3: Scoped Stewardship Model
-- Model B-2: CampaignMembership with StewardScope
-- See .specify/specs/phase-3-stewardship/SPEC.md

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'STEWARD', 'OWNER');

-- CreateEnum
CREATE TYPE "StewardScope" AS ENUM ('FULL', 'DECK', 'SPOKE_1', 'SPOKE_2', 'SPOKE_3', 'SPOKE_4', 'SPOKE_5', 'SPOKE_6', 'SPOKE_7', 'SPOKE_8');

-- AlterEnum: Add ABANDONED to CampaignStatus
ALTER TYPE "CampaignStatus" ADD VALUE 'ABANDONED';

-- AlterTable: Add abandonment tracking to campaigns
ALTER TABLE "campaigns" ADD COLUMN "abandonment_flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "campaigns" ADD COLUMN "decomposition_at" TIMESTAMP(3);

-- CreateTable: CampaignMembership (core stewardship table)
CREATE TABLE "campaign_memberships" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "stewardScope" "StewardScope",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_memberships_playerId_idx" ON "campaign_memberships"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_memberships_campaignId_playerId_key" ON "campaign_memberships"("campaignId", "playerId");

-- AddForeignKey
ALTER TABLE "campaign_memberships" ADD CONSTRAINT "campaign_memberships_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_memberships" ADD CONSTRAINT "campaign_memberships_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
