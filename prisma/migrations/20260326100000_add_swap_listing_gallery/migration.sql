-- AlterTable
ALTER TABLE "custom_bars" ADD COLUMN "swap_listing_hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "custom_bars_collapsedFromInstanceId_type_idx" ON "custom_bars"("collapsedFromInstanceId", "type");
