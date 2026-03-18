-- AlterTable
ALTER TABLE "custom_bars" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "mergedIntoId" TEXT,
ADD COLUMN "mergedFromIds" TEXT;

-- AlterTable
ALTER TABLE "bar_shares" ADD COLUMN "viewedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "bar_topics" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bar_topic_assignments" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_topic_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bar_topics_playerId_idx" ON "bar_topics"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "bar_topic_assignments_topicId_barId_key" ON "bar_topic_assignments"("topicId", "barId");

-- CreateIndex
CREATE INDEX "bar_topic_assignments_topicId_idx" ON "bar_topic_assignments"("topicId");

-- CreateIndex
CREATE INDEX "bar_topic_assignments_barId_idx" ON "bar_topic_assignments"("barId");

-- AddForeignKey
ALTER TABLE "bar_topics" ADD CONSTRAINT "bar_topics_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_topic_assignments" ADD CONSTRAINT "bar_topic_assignments_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "bar_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_topic_assignments" ADD CONSTRAINT "bar_topic_assignments_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
