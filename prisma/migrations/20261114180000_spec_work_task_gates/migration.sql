ALTER TABLE "work_tickets" ADD COLUMN "spec_task_key" TEXT;
CREATE INDEX "work_tickets_spec_task_key_idx" ON "work_tickets"("spec_task_key");

CREATE TABLE "spec_work_tasks" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "revision" TEXT NOT NULL,
  "ticket_id" TEXT NOT NULL,
  "dependencies" TEXT[] NOT NULL,
  "gate" TEXT NOT NULL DEFAULT 'open',
  "blocker_card_id" TEXT,
  "verified_at" TIMESTAMP(3),
  "verified_by" TEXT,
  "evidence" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL
);
