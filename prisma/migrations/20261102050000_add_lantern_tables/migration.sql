-- Lantern Hall, port 1 (six-faces-council council/callsheets/lantern-hall.md). One new table, nothing else touched.

-- CreateTable
CREATE TABLE "lantern_tables" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "intake" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lantern_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lantern_tables_player_id_updated_at_idx" ON "lantern_tables"("player_id", "updated_at");
