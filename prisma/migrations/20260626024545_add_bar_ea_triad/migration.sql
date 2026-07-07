-- LENS P2/P3: EA triad on the BAR (plant-gate unpacking mechanics).
ALTER TABLE "custom_bars" ADD COLUMN "experienceIntent" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "dissatisfaction" TEXT;
ALTER TABLE "custom_bars" ADD COLUMN "satisfaction" TEXT;
