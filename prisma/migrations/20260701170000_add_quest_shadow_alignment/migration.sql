-- QLA (Quest Lineage & Shadow Alignment): shadow-quest acknowledgement + inventory/goal indexes.

-- Player knowingly keeps a quest out of alignment with a weekly lens goal (shadow quest).
ALTER TABLE "custom_bars" ADD COLUMN "shadowAcknowledgedAt" TIMESTAMP(3);

-- Vault "All BARs" room + owned-inventory listing (getVaultInventory).
CREATE INDEX "custom_bars_creatorId_type_status_idx" ON "custom_bars"("creatorId", "type", "status");

-- Quest ↔ lens-goal lookups (alignment / rollup by goal).
CREATE INDEX "custom_bars_lensGoalId_idx" ON "custom_bars"("lensGoalId");
