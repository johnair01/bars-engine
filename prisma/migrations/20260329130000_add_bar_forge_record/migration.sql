-- BAR Forge: API-persisted BAR analyses + optional quest links (Custom GPT / metabolization).

CREATE TABLE "bar_forge_records" (
    "id" TEXT NOT NULL,
    "bar" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "wavePhase" TEXT NOT NULL,
    "polarity" JSONB NOT NULL,
    "primaryQuestId" TEXT,
    "secondaryQuestIds" JSONB NOT NULL,
    "source" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_forge_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bar_forge_records_createdAt_idx" ON "bar_forge_records"("createdAt");

ALTER TABLE "bar_forge_records" ADD CONSTRAINT "bar_forge_records_primaryQuestId_fkey" FOREIGN KEY ("primaryQuestId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
