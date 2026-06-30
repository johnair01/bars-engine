-- PMF (Promise Move Forge): a published Promise Move is a type='promise_move'
-- CustomBar; its forge-specific payload (scope, standard of care, boundary,
-- repair, consent ask, delivery, skill level, examples, reservations,
-- availability, free-text unpacking) is stored as JSON in custom_bars.promiseMove.
ALTER TABLE "custom_bars" ADD COLUMN "promiseMove" TEXT;

-- PMF: consent-forward requests to receive a published Promise Move.
CREATE TABLE "promise_requests" (
  "id" TEXT NOT NULL,
  "barId" TEXT NOT NULL,
  "requesterId" TEXT,
  "requesterName" TEXT,
  "requesterEmail" TEXT,
  "note" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "consentState" TEXT NOT NULL DEFAULT 'awaiting',
  "shareToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3),
  CONSTRAINT "promise_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "promise_requests_barId_createdAt_idx" ON "promise_requests"("barId", "createdAt");
CREATE INDEX "promise_requests_requesterId_createdAt_idx" ON "promise_requests"("requesterId", "createdAt");

ALTER TABLE "promise_requests" ADD CONSTRAINT "promise_requests_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promise_requests" ADD CONSTRAINT "promise_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
