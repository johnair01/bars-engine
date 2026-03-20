-- CreateTable: Npc321InnerWorkMerge (321 SN Phase 7 — NPC teaching from inner work)
CREATE TABLE "npc_321_inner_work_merges" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "humanPlayerId" TEXT NOT NULL,
    "npcPlayerId" TEXT NOT NULL,
    "shadow321SessionId" TEXT NOT NULL,
    "finalShadowName" TEXT NOT NULL,
    "nameResolution" TEXT NOT NULL,
    "suggestionCount" INTEGER,
    "metadataKeys" JSONB NOT NULL,
    "chargeExcerpt" TEXT,

    CONSTRAINT "npc_321_inner_work_merges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "npc_321_inner_work_merges_shadow321SessionId_npcPlayerId_key" ON "npc_321_inner_work_merges"("shadow321SessionId", "npcPlayerId");

-- CreateIndex
CREATE INDEX "npc_321_inner_work_merges_npcPlayerId_createdAt_idx" ON "npc_321_inner_work_merges"("npcPlayerId", "createdAt");

-- CreateIndex
CREATE INDEX "npc_321_inner_work_merges_humanPlayerId_createdAt_idx" ON "npc_321_inner_work_merges"("humanPlayerId", "createdAt");

-- CreateIndex
CREATE INDEX "npc_321_inner_work_merges_shadow321SessionId_idx" ON "npc_321_inner_work_merges"("shadow321SessionId");

-- AddForeignKey
ALTER TABLE "npc_321_inner_work_merges" ADD CONSTRAINT "npc_321_inner_work_merges_humanPlayerId_fkey" FOREIGN KEY ("humanPlayerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_321_inner_work_merges" ADD CONSTRAINT "npc_321_inner_work_merges_npcPlayerId_fkey" FOREIGN KEY ("npcPlayerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "npc_321_inner_work_merges" ADD CONSTRAINT "npc_321_inner_work_merges_shadow321SessionId_fkey" FOREIGN KEY ("shadow321SessionId") REFERENCES "shadow_321_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
