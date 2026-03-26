-- Campaign marketplace slots (player mall stalls) — CMS spec kit
CREATE TABLE "player_marketplace_profiles" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "campaignRef" TEXT NOT NULL,
    "maxSlots" INTEGER NOT NULL DEFAULT 8,
    "paidExtensions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_marketplace_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_stall_slots" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "listedCustomBarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_stall_slots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "player_marketplace_profiles_playerId_campaignRef_key" ON "player_marketplace_profiles"("playerId", "campaignRef");

CREATE INDEX "player_marketplace_profiles_campaignRef_idx" ON "player_marketplace_profiles"("campaignRef");

CREATE UNIQUE INDEX "marketplace_stall_slots_listedCustomBarId_key" ON "marketplace_stall_slots"("listedCustomBarId");

CREATE UNIQUE INDEX "marketplace_stall_slots_profileId_slotIndex_key" ON "marketplace_stall_slots"("profileId", "slotIndex");

CREATE INDEX "marketplace_stall_slots_profileId_idx" ON "marketplace_stall_slots"("profileId");

ALTER TABLE "player_marketplace_profiles" ADD CONSTRAINT "player_marketplace_profiles_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "marketplace_stall_slots" ADD CONSTRAINT "marketplace_stall_slots_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "player_marketplace_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "marketplace_stall_slots" ADD CONSTRAINT "marketplace_stall_slots_listedCustomBarId_fkey" FOREIGN KEY ("listedCustomBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
