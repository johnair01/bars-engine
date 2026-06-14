-- CreateTable
CREATE TABLE "book_entitlements" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "bookKey" TEXT NOT NULL DEFAULT 'mtgoa',
    "source" TEXT NOT NULL DEFAULT 'gumroad',
    "licenseKey" TEXT,
    "gumroadSaleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "metadata" TEXT,

    CONSTRAINT "book_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_entitlements_playerId_bookKey_key" ON "book_entitlements"("playerId", "bookKey");

-- CreateIndex
CREATE UNIQUE INDEX "book_entitlements_bookKey_licenseKey_key" ON "book_entitlements"("bookKey", "licenseKey");

-- AddForeignKey
ALTER TABLE "book_entitlements" ADD CONSTRAINT "book_entitlements_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
