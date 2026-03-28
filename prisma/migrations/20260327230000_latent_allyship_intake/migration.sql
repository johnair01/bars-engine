-- ECI Phase A: persist allyship interview paths from event_invite CYOA (emergent campaign intake).

CREATE TABLE "latent_allyship_intakes" (
    "id" TEXT NOT NULL,
    "customBarId" TEXT NOT NULL,
    "playerId" TEXT,
    "clientSessionId" TEXT,
    "storyId" TEXT NOT NULL,
    "endingPassageId" TEXT NOT NULL,
    "pathJson" TEXT NOT NULL,
    "senderNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "latent_allyship_intakes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "latent_allyship_intakes_customBarId_createdAt_idx" ON "latent_allyship_intakes"("customBarId", "createdAt");

CREATE INDEX "latent_allyship_intakes_playerId_idx" ON "latent_allyship_intakes"("playerId");

CREATE INDEX "latent_allyship_intakes_customBarId_clientSessionId_idx" ON "latent_allyship_intakes"("customBarId", "clientSessionId");

ALTER TABLE "latent_allyship_intakes" ADD CONSTRAINT "latent_allyship_intakes_customBarId_fkey" FOREIGN KEY ("customBarId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "latent_allyship_intakes" ADD CONSTRAINT "latent_allyship_intakes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
