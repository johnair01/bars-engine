-- AlterTable: add intensity register and contextLines to CustomBar
-- intensity: everyday | capable | skilled | defining (Hearts Blazing-derived move intensity)
-- contextLines: JSON { solo, interpersonal, narrative } — I/We/Its expressions for group play
ALTER TABLE "custom_bars" ADD COLUMN "intensity" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "contextLines" TEXT;
