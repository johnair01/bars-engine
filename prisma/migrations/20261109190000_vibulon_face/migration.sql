-- ember-to-vibeulon Phase 3 (FR-009): the coin's face, null on every vibeulon minted before this.
ALTER TABLE "vibulons" ADD COLUMN "face" JSONB;
