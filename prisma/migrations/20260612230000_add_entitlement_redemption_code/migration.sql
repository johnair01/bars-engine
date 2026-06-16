-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "grantType" TEXT NOT NULL DEFAULT 'perpetual',
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'gumroad',
    "externalOrderId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemption_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "grantType" TEXT NOT NULL DEFAULT 'perpetual',
    "grantDurationDays" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'gumroad',
    "externalOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unredeemed',
    "redeemedByPlayerId" TEXT,
    "entitlementId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "redemption_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "entitlements_playerId_status_idx" ON "entitlements"("playerId", "status");

-- CreateIndex
CREATE INDEX "entitlements_sku_status_idx" ON "entitlements"("sku", "status");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_playerId_sku_externalOrderId_key" ON "entitlements"("playerId", "sku", "externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "redemption_codes_code_key" ON "redemption_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "redemption_codes_externalOrderId_key" ON "redemption_codes"("externalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "redemption_codes_entitlementId_key" ON "redemption_codes"("entitlementId");

-- CreateIndex
CREATE INDEX "redemption_codes_sku_status_idx" ON "redemption_codes"("sku", "status");

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
