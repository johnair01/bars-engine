-- Extend CampaignTheme with full L2 visual theming fields.
-- Adds surface/text/CTA color columns, border/density token Json fields,
-- body font key, and green accent — enabling the L2 wizard to set all
-- campaign skin properties via typed fields instead of raw CSS overrides.
--
-- Three-channel encoding (UI Covenant):
--   Channel 1 (Element → Color): accentPrimary, titleColor, greenAccent, etc.
--   Channel 2 (Altitude → Border): borderTokens Json
--   Channel 3 (Stage → Density): densityTokens Json
--
-- All new columns are nullable — backward compatible with existing themes.

-- Color palette
ALTER TABLE "campaign_themes" ADD COLUMN "greenAccent" TEXT;

-- Surface colors
ALTER TABLE "campaign_themes" ADD COLUMN "surfaceColor" TEXT;
ALTER TABLE "campaign_themes" ADD COLUMN "surfaceHoverColor" TEXT;

-- Border colors
ALTER TABLE "campaign_themes" ADD COLUMN "borderColor" TEXT;
ALTER TABLE "campaign_themes" ADD COLUMN "borderHoverColor" TEXT;

-- Text colors
ALTER TABLE "campaign_themes" ADD COLUMN "textPrimary" TEXT;
ALTER TABLE "campaign_themes" ADD COLUMN "textSecondary" TEXT;
ALTER TABLE "campaign_themes" ADD COLUMN "textMuted" TEXT;

-- CTA / Button tokens
ALTER TABLE "campaign_themes" ADD COLUMN "ctaBg" TEXT;
ALTER TABLE "campaign_themes" ADD COLUMN "ctaText" TEXT;
ALTER TABLE "campaign_themes" ADD COLUMN "ctaHoverBg" TEXT;

-- Body font
ALTER TABLE "campaign_themes" ADD COLUMN "fontBodyKey" TEXT;

-- Three-channel encoding Json fields
ALTER TABLE "campaign_themes" ADD COLUMN "borderTokens" JSONB;
ALTER TABLE "campaign_themes" ADD COLUMN "densityTokens" JSONB;
