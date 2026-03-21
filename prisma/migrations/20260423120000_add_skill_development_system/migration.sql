-- CreateTable: Skill Development System
-- PlayerAttribute, PlayerFaceAltitude, Skill, PlayerSkill

CREATE TABLE "player_attributes" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_attributes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "player_face_altitudes" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "currentFace" TEXT NOT NULL DEFAULT 'shaman',
    "altitudeLevel" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_face_altitudes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "archetypeKey" TEXT NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unlockCondition" TEXT NOT NULL,
    "faceAffinity" TEXT,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "player_skills" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unlocked',
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_attributes_playerId_attributeKey_key" ON "player_attributes"("playerId", "attributeKey");
CREATE UNIQUE INDEX "player_face_altitudes_playerId_key" ON "player_face_altitudes"("playerId");
CREATE UNIQUE INDEX "skills_key_key" ON "skills"("key");
CREATE INDEX "skills_archetypeKey_attributeKey_idx" ON "skills"("archetypeKey", "attributeKey");
CREATE UNIQUE INDEX "player_skills_playerId_skillId_key" ON "player_skills"("playerId", "skillId");

-- AddForeignKey
ALTER TABLE "player_attributes" ADD CONSTRAINT "player_attributes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_face_altitudes" ADD CONSTRAINT "player_face_altitudes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_skills" ADD CONSTRAINT "player_skills_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_skills" ADD CONSTRAINT "player_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
