-- Myths Read diagnostic persistence for the Mastering the Game of Allyship
-- Chapter 0 funnel. Standalone enough for anonymous visitors; optionally links
-- to a Player and to the seeded BAR created from the charge capture.
CREATE TABLE "myth_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "source" TEXT NOT NULL DEFAULT 'mastering-allyship-ch0',
    "responses" JSONB NOT NULL,
    "mythScores" JSONB NOT NULL,
    "topMyths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rootBeliefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendedDestinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capturedCharge" JSONB,
    "seedBarDrafts" JSONB,
    "ctaPrimary" TEXT NOT NULL DEFAULT 'deck',
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "createdBarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "myth_reads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "myth_reads_userId_createdAt_idx" ON "myth_reads"("userId", "createdAt");
CREATE INDEX "myth_reads_email_idx" ON "myth_reads"("email");
CREATE INDEX "myth_reads_source_createdAt_idx" ON "myth_reads"("source", "createdAt");

ALTER TABLE "myth_reads"
    ADD CONSTRAINT "myth_reads_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "myth_reads"
    ADD CONSTRAINT "myth_reads_createdBarId_fkey"
    FOREIGN KEY ("createdBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
