-- CreateTable
CREATE TABLE "compost_ledgers" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_ids" TEXT NOT NULL,
    "salvage_payload" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'composted',

    CONSTRAINT "compost_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compost_ledgers_playerId_createdAt_idx" ON "compost_ledgers"("playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "compost_ledgers" ADD CONSTRAINT "compost_ledgers_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
