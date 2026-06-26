-- LENS1/first-slice: first-class Lens + BAR lens/garden soft pointers.
CREATE TABLE "lenses" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "parentLensId" TEXT,
  "periodKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lenses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lenses_playerId_type_periodKey_key" ON "lenses"("playerId", "type", "periodKey");
CREATE INDEX "lenses_playerId_type_idx" ON "lenses"("playerId", "type");

ALTER TABLE "custom_bars" ADD COLUMN "lensId" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "gardenId" TEXT;
