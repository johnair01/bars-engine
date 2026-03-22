-- Demo Orientation Preview (DOP) — shareable pre-signup links
-- See .specify/specs/demo-orientation-preview/spec.md

CREATE TABLE "demo_orientation_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "publicSlug" TEXT,
    "adventureId" TEXT NOT NULL,
    "startNodeId" TEXT NOT NULL,
    "campaignRef" TEXT,
    "instanceId" TEXT,
    "inviteId" TEXT,
    "maxSteps" INTEGER,
    "endNodeId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_orientation_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "demo_orientation_links_token_key" ON "demo_orientation_links"("token");
CREATE UNIQUE INDEX "demo_orientation_links_publicSlug_key" ON "demo_orientation_links"("publicSlug");
CREATE INDEX "demo_orientation_links_adventureId_idx" ON "demo_orientation_links"("adventureId");

ALTER TABLE "demo_orientation_links" ADD CONSTRAINT "demo_orientation_links_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "adventures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demo_orientation_links" ADD CONSTRAINT "demo_orientation_links_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "demo_orientation_links" ADD CONSTRAINT "demo_orientation_links_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
