-- CreateEnum
CREATE TYPE "CampaignDeckTopology" AS ENUM ('CAMPAIGN_DECK_52', 'CAMPAIGN_DECK_64');

-- AlterTable
ALTER TABLE "instances" ADD COLUMN "campaign_deck_topology" "CampaignDeckTopology" NOT NULL DEFAULT 'CAMPAIGN_DECK_52';
