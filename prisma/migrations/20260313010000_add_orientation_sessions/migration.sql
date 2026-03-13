-- CreateTable: OrientationSession
-- Stores checkpoint-persisted OrientationMetaPacket state for orientation quests.
-- One row per orientation quest session; packetId is the natural key.
-- packetJson holds the full serialised OrientationMetaPacket for session resumption.
-- lastCheckpoint names the transition that triggered the most recent upsert.
-- checkpointNodeId records which quest node the player was at for fine-grained resume.
-- abandonedAt is set when the session goes stale (player did not return in time).

CREATE TABLE "orientation_sessions" (
    "id"               TEXT         NOT NULL,
    "packetId"         TEXT         NOT NULL,
    "playerId"         TEXT         NOT NULL,
    "sessionState"     TEXT         NOT NULL DEFAULT 'active',
    "submissionPath"   TEXT         NOT NULL,
    "packetJson"       TEXT         NOT NULL,
    "lastCheckpoint"   TEXT         NOT NULL DEFAULT 'SESSION_INIT',
    "checkpointAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkpointNodeId" TEXT,
    "abandonedAt"      TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orientation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: natural key uniqueness
CREATE UNIQUE INDEX "orientation_sessions_packetId_key"
    ON "orientation_sessions"("packetId");

-- CreateIndex: player look-ups
CREATE INDEX "ix_orientation_sessions_player"
    ON "orientation_sessions"("playerId");

-- CreateIndex: state-filtered queries (e.g. find all active sessions)
CREATE INDEX "ix_orientation_sessions_state"
    ON "orientation_sessions"("sessionState");

-- CreateIndex: composite player + state (e.g. resume an active session for a player)
CREATE INDEX "ix_orientation_sessions_player_state"
    ON "orientation_sessions"("playerId", "sessionState");

-- CreateIndex: composite player + checkpointAt (e.g. abandonment detection)
CREATE INDEX "ix_orientation_sessions_player_checkpoint_at"
    ON "orientation_sessions"("playerId", "checkpointAt");

-- AddForeignKey: cascade delete when the player is deleted
ALTER TABLE "orientation_sessions"
    ADD CONSTRAINT "orientation_sessions_playerId_fkey"
    FOREIGN KEY ("playerId")
    REFERENCES "players"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
