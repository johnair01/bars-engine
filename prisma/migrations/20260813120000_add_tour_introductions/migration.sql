-- Crowdsourced book-tour leads. Backers and readers name a place; the pile
-- becomes the Dream 100. See src/lib/tour-leads/corridor.ts.
--
-- Deliberately stores no contact details for the third party being named:
-- "canIntroduce" keeps the introduction with the submitter, who is the only
-- person in the exchange who has actually consented to be in it.
CREATE TABLE "tour_introductions" (
  "id" TEXT NOT NULL,
  "place" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "canIntroduce" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "submitterName" TEXT,
  "submitterEmail" TEXT NOT NULL,
  "consent" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL DEFAULT 'introductions',
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tour_introductions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tour_introductions_createdAt_idx" ON "tour_introductions"("createdAt");
CREATE INDEX "tour_introductions_city_idx" ON "tour_introductions"("city");
CREATE INDEX "tour_introductions_status_idx" ON "tour_introductions"("status");
CREATE INDEX "tour_introductions_submitterEmail_idx" ON "tour_introductions"("submitterEmail");
