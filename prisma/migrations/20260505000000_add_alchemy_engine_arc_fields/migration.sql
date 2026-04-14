-- Alchemy Engine vertical slice: arc phase, face, WAVE move, arc window timestamps
ALTER TABLE "alchemy_player_states" ADD COLUMN "arcPhase" TEXT,
ADD COLUMN "waveMove" TEXT,
ADD COLUMN "face" TEXT,
ADD COLUMN "arcStartedAt" TIMESTAMP(3),
ADD COLUMN "arcCompletedAt" TIMESTAMP(3);
