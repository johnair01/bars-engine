/**
 * Campaign Skin Token Types — JSON structure definitions for CampaignTheme fields.
 *
 * These types define the shape of Json columns in the CampaignTheme Prisma model.
 * They map to the UI Covenant's three-channel encoding system:
 *   Channel 1: Element → Color (typed columns: accentPrimary, titleColor, etc.)
 *   Channel 2: Altitude → Border (borderTokens Json)
 *   Channel 3: Stage → Density (densityTokens Json)
 *
 * The L2 wizard writes these; buildSkinVars() reads them into CSS custom properties.
 *
 * @see UI_COVENANT.md — three-channel encoding system
 * @see src/lib/ui/card-tokens.ts — game-internal token definitions
 * @see src/lib/ui/build-skin-vars.ts — merge pipeline
 */

// ─── Channel 2: Altitude → Border Tokens ────────────────────────────────────

/**
 * Border/altitude tokens for campaign surfaces.
 * Stored in CampaignTheme.borderTokens (Json).
 *
 * Maps to CSS vars:
 *   --cs-border-radius → borderRadius
 *   --cs-border-width  → borderWidth
 *   --cs-glow-radius   → glowRadius
 *   --cs-glow-color    → glowColor
 */
export type CampaignBorderTokens = {
  /** CSS border-radius value (e.g. "8px", "0.5rem", "12px") */
  borderRadius?: string
  /** CSS border-width value (e.g. "1px", "2px") */
  borderWidth?: string
  /** CSS box-shadow blur radius for glow effect (e.g. "0px", "4px", "12px") */
  glowRadius?: string
  /** CSS color for glow/box-shadow (hex or rgba) */
  glowColor?: string
}

// ─── Channel 3: Stage → Density Tokens ──────────────────────────────────────

/**
 * Density/stage tokens for campaign layout.
 * Stored in CampaignTheme.densityTokens (Json).
 *
 * Controls information density and spacing on campaign surfaces.
 *
 * Maps to CSS vars:
 *   --cs-card-padding     → cardPadding
 *   --cs-section-spacing  → sectionSpacing
 *   --cs-content-density  → contentDensity (semantic key)
 */
export type CampaignDensityTokens = {
  /** CSS padding for card surfaces (e.g. "1rem", "1.5rem", "2rem") */
  cardPadding?: string
  /** CSS gap/margin between content sections (e.g. "1rem", "1.5rem", "2rem") */
  sectionSpacing?: string
  /** Semantic density level: compact=dense info, balanced=default, spacious=breathing room */
  contentDensity?: 'compact' | 'balanced' | 'spacious'
}

// ─── L3: Narrative Config (Reserved) ────────────────────────────────────────

/**
 * Narrative theming config — L3 deferred.
 * Stored in CampaignTheme.narrativeConfig (Json).
 *
 * Placeholder type accommodating future narrative sovereignty:
 *   - Story arc tinting (quest colors shift with narrative phase)
 *   - NPC portrait overrides per campaign
 *   - CYOA branching skin variants
 *   - Bingo card visual themes
 */
export type CampaignNarrativeConfig = {
  /** Future: story arc phase → accent color overrides */
  arcTinting?: Record<string, string>
  /** Future: NPC portrait URL overrides keyed by NPC ID */
  npcPortraits?: Record<string, string>
  /** Future: CYOA branch visual variant key */
  cyoaSkinVariant?: string
  /** Catch-all for forward compatibility */
  [key: string]: unknown
}

// ─── CSS Var Override Schema ────────────────────────────────────────────────

/**
 * Allowed CSS custom properties in CampaignTheme.cssVarOverrides.
 * This is the power-user layer — highest merge priority.
 *
 * All properties follow the --cs-* namespace to avoid clashing
 * with game-internal --element-* and --glow-* vars.
 */
export const CAMPAIGN_CSS_VAR_KEYS = [
  // Background
  '--cs-bg',
  '--cs-bg-deep',
  '--cs-bg-gradient',
  // Color palette
  '--cs-title',
  '--cs-accent-1',
  '--cs-accent-2',
  '--cs-accent-3',
  '--cs-green',
  // Surfaces
  '--cs-surface',
  '--cs-surface-hover',
  // Borders
  '--cs-border',
  '--cs-border-hover',
  '--cs-border-radius',
  '--cs-border-width',
  '--cs-glow-radius',
  '--cs-glow-color',
  // Text
  '--cs-text-primary',
  '--cs-text-secondary',
  '--cs-text-muted',
  // CTA Primary
  '--cs-cta-bg',
  '--cs-cta-text',
  '--cs-cta-hover',
  // CTA Secondary
  '--cs-cta-secondary-bg',
  '--cs-cta-secondary-text',
  '--cs-cta-secondary-border',
  '--cs-cta-secondary-hover',
  // Density
  '--cs-card-padding',
  '--cs-section-spacing',
] as const

export type CampaignCssVarKey = (typeof CAMPAIGN_CSS_VAR_KEYS)[number]

// ─── Default Token Values ───────────────────────────────────────────────────

/** Default border tokens — neutral altitude feel */
export const DEFAULT_BORDER_TOKENS: Required<CampaignBorderTokens> = {
  borderRadius: '8px',
  borderWidth: '1px',
  glowRadius: '0px',
  glowColor: 'transparent',
}

/** Default density tokens — balanced layout */
export const DEFAULT_DENSITY_TOKENS: Required<CampaignDensityTokens> = {
  cardPadding: '1.5rem',
  sectionSpacing: '1.5rem',
  contentDensity: 'balanced',
}

// ─── Approved Font Keys ─────────────────────────────────────────────────────

/**
 * Approved font keys for the L2 wizard.
 * Maps to font-family classes loaded via next/font or global CSS.
 */
export const APPROVED_DISPLAY_FONTS = [
  { key: 'press-start-2p', label: 'Press Start 2P', category: 'pixel' },
  { key: 'inter',          label: 'Inter',          category: 'sans' },
  { key: 'dm-sans',        label: 'DM Sans',        category: 'sans' },
  { key: 'space-grotesk',  label: 'Space Grotesk',  category: 'sans' },
  { key: 'playfair',       label: 'Playfair Display', category: 'serif' },
  { key: 'lora',           label: 'Lora',           category: 'serif' },
] as const

export const APPROVED_BODY_FONTS = [
  { key: 'inter',     label: 'Inter',     category: 'sans' },
  { key: 'dm-sans',   label: 'DM Sans',   category: 'sans' },
  { key: 'lora',      label: 'Lora',      category: 'serif' },
  { key: 'system-ui', label: 'System',    category: 'system' },
] as const
