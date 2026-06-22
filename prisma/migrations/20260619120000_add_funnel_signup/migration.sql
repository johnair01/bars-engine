-- Awaken funnel lead capture: chapter-one email signups + July weekend event RSVPs.
-- Standalone table (no Player FK) so unauthenticated visitors can convert.
CREATE TABLE "funnel_signups" (
    "id"        TEXT NOT NULL,
    "intent"    TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "name"      TEXT,
    "events"    TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source"    TEXT NOT NULL DEFAULT 'awaken',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_signups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "funnel_signups_intent_createdAt_idx"
    ON "funnel_signups"("intent", "createdAt");

CREATE INDEX "funnel_signups_email_idx"
    ON "funnel_signups"("email");
