-- Work queues, slice 1 (six-faces-council council/callsheets/work-queues.md). Two new tables, nothing else touched.

-- CreateTable
CREATE TABLE "work_tickets" (
    "id" TEXT NOT NULL,
    "source_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "basis" JSONB NOT NULL,
    "lanes" TEXT[],
    "lane" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'ready',
    "claimed_by" TEXT,
    "lease_until" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "done_at" TIMESTAMP(3),

    CONSTRAINT "work_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_lanes" (
    "lane" TEXT NOT NULL,
    "dry" BOOLEAN NOT NULL DEFAULT false,
    "dry_until" TIMESTAMP(3),
    "note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_lanes_pkey" PRIMARY KEY ("lane")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_tickets_source_key_key" ON "work_tickets"("source_key");

-- CreateIndex
CREATE INDEX "work_tickets_lane_state_created_at_idx" ON "work_tickets"("lane", "state", "created_at");
