-- CreateTable
CREATE TABLE "bar_share_externals" (
    "id" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toEmail" TEXT,
    "shareToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "instanceId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bar_share_externals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bar_share_externals_shareToken_key" ON "bar_share_externals"("shareToken");

-- CreateIndex
CREATE INDEX "bar_share_externals_shareToken_idx" ON "bar_share_externals"("shareToken");

-- CreateIndex
CREATE INDEX "bar_share_externals_fromUserId_createdAt_idx" ON "bar_share_externals"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "bar_share_externals_expiresAt_idx" ON "bar_share_externals"("expiresAt");

-- AddForeignKey
ALTER TABLE "bar_share_externals" ADD CONSTRAINT "bar_share_externals_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_share_externals" ADD CONSTRAINT "bar_share_externals_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_share_externals" ADD CONSTRAINT "bar_share_externals_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bar_share_externals" ADD CONSTRAINT "bar_share_externals_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
