-- CGLA H1 — bridge TTV tasks into the BAR system.
-- A committed TapTheVeinTask projects into a CustomBar; store the soft pointer.
ALTER TABLE "tap_the_vein_tasks" ADD COLUMN "barId" TEXT;
