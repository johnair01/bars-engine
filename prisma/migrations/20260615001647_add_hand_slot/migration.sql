-- CreateTable
CREATE TABLE "hand_slots" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "barId" TEXT,
    "isCarrying" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hand_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hand_slots_barId_idx" ON "hand_slots"("barId");

-- CreateIndex
CREATE UNIQUE INDEX "hand_slots_playerId_slotIndex_key" ON "hand_slots"("playerId", "slotIndex");

-- AddForeignKey
ALTER TABLE "hand_slots" ADD CONSTRAINT "hand_slots_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hand_slots" ADD CONSTRAINT "hand_slots_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

