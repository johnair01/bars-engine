-- Satisfaction becomes a modifier on the channel: the stored value is (channel, polarity)
-- plus optional words, and the channel is one of the five.
-- satisfactionPayoff stays as the optional words. Both new columns are nullable so rows
-- written before today keep their free text and read as "no channel recorded yet".
ALTER TABLE "lens_goals"
  ADD COLUMN "satisfactionChannel" TEXT,
  ADD COLUMN "satisfactionPolarity" TEXT;
