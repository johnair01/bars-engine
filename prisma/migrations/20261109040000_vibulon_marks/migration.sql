-- A vibeulon keeps the energy that made it, and one mark for each act done to it. Marks have no foreign key so they
-- outlive a burned coin. Additive only: nothing already minted is rewritten.
ALTER TABLE "vibulons" ADD COLUMN "energy" JSONB;

CREATE TABLE "vibulon_marks" (
    "id" TEXT NOT NULL,
    "vibulonId" TEXT NOT NULL,
    "act" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "barId" TEXT,
    "toId" TEXT,
    "note" TEXT,
    "originSource" TEXT NOT NULL,
    "originId" TEXT NOT NULL,
    "originTitle" TEXT NOT NULL,
    "energy" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibulon_marks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vibulon_marks_vibulonId_idx" ON "vibulon_marks"("vibulonId");
