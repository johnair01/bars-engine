/**
 * Campaign theme presets — reusable L2 visual theme configurations.
 *
 * Presets serve the "template + customize" pattern: the L2 wizard lets
 * stewards pick a preset, then tweak individual values. The preset is
 * the starting point, not a straitjacket.
 *
 * Bruised Banana is the reference implementation — its preset mirrors
 * BRUISED_BANANA_SKIN from campaign-skin.ts exactly so the DB-driven
 * path produces identical output to the hardcoded path.
 *
 * @see src/lib/ui/campaign-skin.ts   (static CampaignSkin objects)
 * @see src/lib/ui/build-skin-vars.ts (ThemeData type + merge logic)
 * @see UI_COVENANT.md                (three-channel encoding — game internals only)
 */

import type { ThemeData } from './build-skin-vars'

// ---------------------------------------------------------------------------
// Preset type
// ---------------------------------------------------------------------------

export interface ThemePreset {
  /** Machine key (matches campaign slug for reference implementations) */
  key: string
  /** Human-readable label for the wizard picker */
  label: string
  /** Short description of the visual feel */
  description: string
  /** Design language keywords (for search/filtering in future) */
  tags: string[]
  /** The full ThemeData to persist into CampaignTheme */
  theme: ThemeData
  /** Font display class (Tailwind) — matches CampaignSkin.fontClass */
  fontClass: string
}

// ---------------------------------------------------------------------------
// Bruised Banana — reference implementation
// ---------------------------------------------------------------------------

/**
 * Canonical Bruised Banana poster aesthetic.
 *
 * Deep indigo background, pixel yellow titles, lavender/cyan/pink accents.
 * Retro arcade vibe via Press Start 2P pixel font.
 *
 * These values are the single source of truth. The hardcoded
 * BRUISED_BANANA_SKIN in campaign-skin.ts must stay in sync with this
 * until the migration to fully DB-driven skins is complete.
 */
export const BB_THEME_DATA: ThemeData = {
  bgGradient: 'linear-gradient(180deg, #1a1a5e 0%, #2b2b8a 30%, #1a1a5e 100%)',
  bgDeep: '#12124a',
  titleColor: '#f0d000',
  accentPrimary: '#c8a0ff',    // lavender
  accentSecondary: '#00d4ff',  // cyan
  accentTertiary: '#ff69b4',   // pink
  greenAccent: '#4ade80',
  surfaceColor: 'rgba(10, 10, 40, 0.6)',
  surfaceHoverColor: 'rgba(20, 20, 60, 0.7)',
  borderColor: 'rgba(200, 160, 255, 0.15)',
  borderHoverColor: 'rgba(200, 160, 255, 0.3)',
  textPrimary: '#e8e6e0',
  textSecondary: '#9090c0',
  textMuted: '#6060a0',
  ctaBg: '#f0d000',
  ctaText: '#12124a',
  ctaHoverBg: '#ffe033',
  fontDisplayKey: 'press-start-2p',
  fontBodyKey: null,
  posterImageUrl: null,
  borderTokens: { borderRadius: '4px', borderWidth: '1px', glowRadius: '0px', glowColor: 'transparent' },
  densityTokens: { cardPadding: '1.5rem', sectionSpacing: '1.5rem', contentDensity: 'balanced' },
  // Full CSS var set — matches campaign-skin.ts BRUISED_BANANA_SKIN exactly
  cssVarOverrides: {
    '--cs-bg': '#1a1a5e',
    '--cs-bg-deep': '#12124a',
    '--cs-bg-gradient': 'linear-gradient(180deg, #1a1a5e 0%, #2b2b8a 30%, #1a1a5e 100%)',
    '--cs-title': '#f0d000',
    '--cs-accent-1': '#c8a0ff',
    '--cs-accent-2': '#00d4ff',
    '--cs-accent-3': '#ff69b4',
    '--cs-green': '#4ade80',
    '--cs-surface': 'rgba(10, 10, 40, 0.6)',
    '--cs-surface-hover': 'rgba(20, 20, 60, 0.7)',
    '--cs-border': 'rgba(200, 160, 255, 0.15)',
    '--cs-border-hover': 'rgba(200, 160, 255, 0.3)',
    '--cs-text-primary': '#e8e6e0',
    '--cs-text-secondary': '#9090c0',
    '--cs-text-muted': '#6060a0',
    '--cs-cta-bg': '#f0d000',
    '--cs-cta-text': '#12124a',
    '--cs-cta-hover': '#ffe033',
    '--cs-cta-secondary-bg': 'rgba(200, 160, 255, 0.15)',
    '--cs-cta-secondary-text': '#c8a0ff',
    '--cs-cta-secondary-border': 'rgba(200, 160, 255, 0.4)',
    '--cs-cta-secondary-hover': 'rgba(200, 160, 255, 0.25)',
  },
}

export const BRUISED_BANANA_PRESET: ThemePreset = {
  key: 'bruised-banana',
  label: 'Bruised Banana',
  description: 'Deep indigo + pixel yellow, retro arcade poster aesthetic',
  tags: ['retro', 'arcade', 'dark', 'indigo', 'yellow', 'poster'],
  theme: BB_THEME_DATA,
  fontClass: 'font-pixel',
}

// ---------------------------------------------------------------------------
// Minimal Dark — safe default for new campaigns
// ---------------------------------------------------------------------------

export const MINIMAL_DARK_THEME_DATA: ThemeData = {
  bgGradient: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
  bgDeep: '#0f0f23',
  titleColor: '#e8e6e0',
  accentPrimary: '#6366f1',    // indigo-500
  accentSecondary: '#8b5cf6',  // violet-500
  accentTertiary: '#ec4899',   // pink-500
  greenAccent: '#4ade80',
  surfaceColor: 'rgba(15, 15, 35, 0.6)',
  surfaceHoverColor: 'rgba(25, 25, 50, 0.7)',
  borderColor: 'rgba(99, 102, 241, 0.15)',
  borderHoverColor: 'rgba(99, 102, 241, 0.3)',
  textPrimary: '#e8e6e0',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  ctaBg: '#6366f1',
  ctaText: '#ffffff',
  ctaHoverBg: '#818cf8',
  fontDisplayKey: null,
  fontBodyKey: null,
  posterImageUrl: null,
  borderTokens: null,
  densityTokens: null,
  cssVarOverrides: {
    '--cs-bg': '#1a1a2e',
    '--cs-bg-deep': '#0f0f23',
    '--cs-bg-gradient': 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
    '--cs-title': '#e8e6e0',
    '--cs-accent-1': '#6366f1',
    '--cs-accent-2': '#8b5cf6',
    '--cs-accent-3': '#ec4899',
    '--cs-green': '#4ade80',
    '--cs-surface': 'rgba(15, 15, 35, 0.6)',
    '--cs-surface-hover': 'rgba(25, 25, 50, 0.7)',
    '--cs-border': 'rgba(99, 102, 241, 0.15)',
    '--cs-border-hover': 'rgba(99, 102, 241, 0.3)',
    '--cs-text-primary': '#e8e6e0',
    '--cs-text-secondary': '#9ca3af',
    '--cs-text-muted': '#6b7280',
    '--cs-cta-bg': '#6366f1',
    '--cs-cta-text': '#ffffff',
    '--cs-cta-hover': '#818cf8',
    '--cs-cta-secondary-bg': 'rgba(99, 102, 241, 0.15)',
    '--cs-cta-secondary-text': '#818cf8',
    '--cs-cta-secondary-border': 'rgba(99, 102, 241, 0.4)',
    '--cs-cta-secondary-hover': 'rgba(99, 102, 241, 0.25)',
  },
}

export const MINIMAL_DARK_PRESET: ThemePreset = {
  key: 'minimal-dark',
  label: 'Minimal Dark',
  description: 'Clean dark background with subtle indigo accents — safe default',
  tags: ['minimal', 'dark', 'default', 'clean'],
  theme: MINIMAL_DARK_THEME_DATA,
  fontClass: '',
}

// ---------------------------------------------------------------------------
// Warm Earth — warm tones for community-focused campaigns
// ---------------------------------------------------------------------------

export const WARM_EARTH_THEME_DATA: ThemeData = {
  bgGradient: 'linear-gradient(180deg, #1a1208 0%, #2d1f0e 50%, #1a1208 100%)',
  bgDeep: '#0f0a04',
  titleColor: '#d4a017',
  accentPrimary: '#d4a017',    // ochre-amber
  accentSecondary: '#b5651d',  // terracotta
  accentTertiary: '#27ae60',   // jade
  greenAccent: '#4ade80',
  surfaceColor: 'rgba(26, 18, 8, 0.6)',
  surfaceHoverColor: 'rgba(45, 31, 14, 0.7)',
  borderColor: 'rgba(212, 160, 23, 0.15)',
  borderHoverColor: 'rgba(212, 160, 23, 0.3)',
  textPrimary: '#e8e6e0',
  textSecondary: '#b0a890',
  textMuted: '#7a7260',
  ctaBg: '#d4a017',
  ctaText: '#0f0a04',
  ctaHoverBg: '#e8b82a',
  fontDisplayKey: null,
  fontBodyKey: null,
  posterImageUrl: null,
  borderTokens: null,
  densityTokens: null,
  cssVarOverrides: {
    '--cs-bg': '#1a1208',
    '--cs-bg-deep': '#0f0a04',
    '--cs-bg-gradient': 'linear-gradient(180deg, #1a1208 0%, #2d1f0e 50%, #1a1208 100%)',
    '--cs-title': '#d4a017',
    '--cs-accent-1': '#d4a017',
    '--cs-accent-2': '#b5651d',
    '--cs-accent-3': '#27ae60',
    '--cs-green': '#4ade80',
    '--cs-surface': 'rgba(26, 18, 8, 0.6)',
    '--cs-surface-hover': 'rgba(45, 31, 14, 0.7)',
    '--cs-border': 'rgba(212, 160, 23, 0.15)',
    '--cs-border-hover': 'rgba(212, 160, 23, 0.3)',
    '--cs-text-primary': '#e8e6e0',
    '--cs-text-secondary': '#b0a890',
    '--cs-text-muted': '#7a7260',
    '--cs-cta-bg': '#d4a017',
    '--cs-cta-text': '#0f0a04',
    '--cs-cta-hover': '#e8b82a',
    '--cs-cta-secondary-bg': 'rgba(212, 160, 23, 0.15)',
    '--cs-cta-secondary-text': '#d4a017',
    '--cs-cta-secondary-border': 'rgba(212, 160, 23, 0.4)',
    '--cs-cta-secondary-hover': 'rgba(212, 160, 23, 0.25)',
  },
}

export const WARM_EARTH_PRESET: ThemePreset = {
  key: 'warm-earth',
  label: 'Warm Earth',
  description: 'Ochre, terracotta, and jade — grounded community aesthetic',
  tags: ['warm', 'earth', 'community', 'natural', 'ochre'],
  theme: WARM_EARTH_THEME_DATA,
  fontClass: '',
}

// ---------------------------------------------------------------------------
// Ocean Depths — cool blues for awareness/outreach campaigns
// ---------------------------------------------------------------------------

export const OCEAN_DEPTHS_THEME_DATA: ThemeData = {
  bgGradient: 'linear-gradient(180deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
  bgDeep: '#060f1c',
  titleColor: '#38bdf8',
  accentPrimary: '#38bdf8',    // sky-400
  accentSecondary: '#06b6d4',  // cyan-500
  accentTertiary: '#a78bfa',   // violet-400
  greenAccent: '#4ade80',
  surfaceColor: 'rgba(10, 22, 40, 0.6)',
  surfaceHoverColor: 'rgba(13, 33, 55, 0.7)',
  borderColor: 'rgba(56, 189, 248, 0.15)',
  borderHoverColor: 'rgba(56, 189, 248, 0.3)',
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  ctaBg: '#38bdf8',
  ctaText: '#0a1628',
  ctaHoverBg: '#7dd3fc',
  fontDisplayKey: null,
  fontBodyKey: null,
  posterImageUrl: null,
  borderTokens: { borderRadius: '12px', borderWidth: '1px', glowRadius: '6px', glowColor: 'rgba(56, 189, 248, 0.12)' },
  densityTokens: { cardPadding: '1.5rem', sectionSpacing: '2rem', contentDensity: 'spacious' },
  cssVarOverrides: {
    '--cs-bg': '#0a1628',
    '--cs-bg-deep': '#060f1c',
    '--cs-bg-gradient': 'linear-gradient(180deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
    '--cs-title': '#38bdf8',
    '--cs-accent-1': '#38bdf8',
    '--cs-accent-2': '#06b6d4',
    '--cs-accent-3': '#a78bfa',
    '--cs-green': '#4ade80',
    '--cs-surface': 'rgba(10, 22, 40, 0.6)',
    '--cs-surface-hover': 'rgba(13, 33, 55, 0.7)',
    '--cs-border': 'rgba(56, 189, 248, 0.15)',
    '--cs-border-hover': 'rgba(56, 189, 248, 0.3)',
    '--cs-text-primary': '#e2e8f0',
    '--cs-text-secondary': '#94a3b8',
    '--cs-text-muted': '#64748b',
    '--cs-cta-bg': '#38bdf8',
    '--cs-cta-text': '#0a1628',
    '--cs-cta-hover': '#7dd3fc',
    '--cs-cta-secondary-bg': 'rgba(56, 189, 248, 0.15)',
    '--cs-cta-secondary-text': '#7dd3fc',
    '--cs-cta-secondary-border': 'rgba(56, 189, 248, 0.4)',
    '--cs-cta-secondary-hover': 'rgba(56, 189, 248, 0.25)',
  },
}

export const OCEAN_DEPTHS_PRESET: ThemePreset = {
  key: 'ocean-depths',
  label: 'Ocean Depths',
  description: 'Cool blues and cyans — aquatic depth, ideal for awareness campaigns',
  tags: ['cool', 'blue', 'ocean', 'awareness', 'calm'],
  theme: OCEAN_DEPTHS_THEME_DATA,
  fontClass: '',
}

// ---------------------------------------------------------------------------
// Ember Forge — warm reds/oranges for direct action campaigns
// ---------------------------------------------------------------------------

export const EMBER_FORGE_THEME_DATA: ThemeData = {
  bgGradient: 'linear-gradient(180deg, #1a0a0a 0%, #2d1010 50%, #1a0a0a 100%)',
  bgDeep: '#0f0505',
  titleColor: '#f97316',
  accentPrimary: '#f97316',    // orange-500
  accentSecondary: '#ef4444',  // red-500
  accentTertiary: '#fbbf24',   // amber-400
  greenAccent: '#4ade80',
  surfaceColor: 'rgba(26, 10, 10, 0.6)',
  surfaceHoverColor: 'rgba(45, 16, 16, 0.7)',
  borderColor: 'rgba(249, 115, 22, 0.15)',
  borderHoverColor: 'rgba(249, 115, 22, 0.3)',
  textPrimary: '#fef2f2',
  textSecondary: '#d4a093',
  textMuted: '#9a7068',
  ctaBg: '#f97316',
  ctaText: '#0f0505',
  ctaHoverBg: '#fb923c',
  fontDisplayKey: null,
  fontBodyKey: null,
  posterImageUrl: null,
  borderTokens: { borderRadius: '6px', borderWidth: '2px', glowRadius: '4px', glowColor: 'rgba(249, 115, 22, 0.15)' },
  densityTokens: { cardPadding: '1.25rem', sectionSpacing: '1.5rem', contentDensity: 'compact' },
  cssVarOverrides: {
    '--cs-bg': '#1a0a0a',
    '--cs-bg-deep': '#0f0505',
    '--cs-bg-gradient': 'linear-gradient(180deg, #1a0a0a 0%, #2d1010 50%, #1a0a0a 100%)',
    '--cs-title': '#f97316',
    '--cs-accent-1': '#f97316',
    '--cs-accent-2': '#ef4444',
    '--cs-accent-3': '#fbbf24',
    '--cs-green': '#4ade80',
    '--cs-surface': 'rgba(26, 10, 10, 0.6)',
    '--cs-surface-hover': 'rgba(45, 16, 16, 0.7)',
    '--cs-border': 'rgba(249, 115, 22, 0.15)',
    '--cs-border-hover': 'rgba(249, 115, 22, 0.3)',
    '--cs-text-primary': '#fef2f2',
    '--cs-text-secondary': '#d4a093',
    '--cs-text-muted': '#9a7068',
    '--cs-cta-bg': '#f97316',
    '--cs-cta-text': '#0f0505',
    '--cs-cta-hover': '#fb923c',
    '--cs-cta-secondary-bg': 'rgba(249, 115, 22, 0.15)',
    '--cs-cta-secondary-text': '#fb923c',
    '--cs-cta-secondary-border': 'rgba(249, 115, 22, 0.4)',
    '--cs-cta-secondary-hover': 'rgba(249, 115, 22, 0.25)',
  },
}

export const EMBER_FORGE_PRESET: ThemePreset = {
  key: 'ember-forge',
  label: 'Ember Forge',
  description: 'Warm oranges and reds — fiery intensity for direct action',
  tags: ['warm', 'fire', 'orange', 'red', 'action', 'intense'],
  theme: EMBER_FORGE_THEME_DATA,
  fontClass: '',
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All available theme presets, keyed by preset key */
export const THEME_PRESETS: Record<string, ThemePreset> = {
  'bruised-banana': BRUISED_BANANA_PRESET,
  'minimal-dark': MINIMAL_DARK_PRESET,
  'warm-earth': WARM_EARTH_PRESET,
  'ocean-depths': OCEAN_DEPTHS_PRESET,
  'ember-forge': EMBER_FORGE_PRESET,
}

/** Ordered list for picker UI (BB first as reference, then by visual variety) */
export const THEME_PRESET_LIST: ThemePreset[] = [
  BRUISED_BANANA_PRESET,
  MINIMAL_DARK_PRESET,
  WARM_EARTH_PRESET,
  OCEAN_DEPTHS_PRESET,
  EMBER_FORGE_PRESET,
]

/**
 * Look up a theme preset by key.
 * Returns undefined for unknown keys — caller should fall back to MINIMAL_DARK.
 */
export function getThemePreset(key: string): ThemePreset | undefined {
  return THEME_PRESETS[key]
}

/**
 * Get all presets as an array, optionally filtered by tags.
 * Useful for the L2 wizard preset picker with search/filter.
 */
export function getPresetsByTags(tags: string[]): ThemePreset[] {
  if (tags.length === 0) return THEME_PRESET_LIST
  const tagSet = new Set(tags.map((t) => t.toLowerCase()))
  return THEME_PRESET_LIST.filter((preset) =>
    preset.tags.some((t) => tagSet.has(t)),
  )
}

/**
 * Default preset key for new campaigns when no preset is selected.
 */
export const DEFAULT_PRESET_KEY = 'minimal-dark'
