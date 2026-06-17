-- AlterTable
ALTER TABLE "entitlements" ADD COLUMN     "subscriptionId" TEXT;

-- AlterTable
ALTER TABLE "redemption_codes" ADD COLUMN     "subscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "entitlements_subscriptionId_idx" ON "entitlements"("subscriptionId");
