-- CreateTable
CREATE TABLE "bar_social_links" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "metadata_json" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bar_social_links_barId_idx" ON "bar_social_links"("barId");

-- AddForeignKey
ALTER TABLE "bar_social_links" ADD CONSTRAINT "bar_social_links_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
