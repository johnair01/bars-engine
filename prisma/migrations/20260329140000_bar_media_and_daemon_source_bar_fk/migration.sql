-- CreateTable
CREATE TABLE "bar_media" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bar_media_barId_idx" ON "bar_media"("barId");

-- AddForeignKey
ALTER TABLE "bar_media" ADD CONSTRAINT "bar_media_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (Daemon.sourceBarId → CustomBar)
ALTER TABLE "daemons" ADD CONSTRAINT "daemons_sourceBarId_fkey" FOREIGN KEY ("sourceBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
