'use server'

/**
 * Campaign theme actions — L2 visual theming CRUD.
 *
 * Steward+ users can:
 *   - Apply a theme preset to a campaign (template + customize pattern)
 *   - Update individual theme fields (color picker, font selector)
 *   - Save full CSS var overrides (power-user layer)
 *   - Read back the current theme for preview
 *
 * The CampaignTheme record is 1:1 with Campaign. Creating a theme
 * upserts — if one exists, it updates; if not, it creates.
 *
 * @see src/lib/ui/theme-presets.ts  (preset registry)
 * @see src/lib/ui/build-skin-vars.ts (ThemeData type + merge logic)
 * @see src/lib/ui/campaign-skin.ts   (static skin fallback)
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import type { CampaignStatus } from '@prisma/client'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { validateEdit } from '@/lib/campaign-lifecycle'
import { getThemePreset, DEFAULT_PRESET_KEY } from '@/lib/ui/theme-presets'
import type { ThemeData } from '@/lib/ui/build-skin-vars'
import type { CampaignBorderTokens, CampaignDensityTokens } from '@/lib/ui/campaign-skin-tokens'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

async function isGlobalAdmin(playerId: string): Promise<boolean> {
  const row = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  return !!row
}

async function isStewardPlusForCampaign(
  playerId: string,
  campaignId: string,
): Promise<boolean> {
  if (await isGlobalAdmin(playerId)) return true

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { instanceId: true },
  })
  if (!campaign) return false

  const membership = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: {
        instanceId: campaign.instanceId,
        playerId,
      },
    },
  })

  return membership?.roleKey === 'owner' || membership?.roleKey === 'steward'
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult =
  | { success: true; message: string }
  | { error: string }

export type SaveCampaignThemeInput = {
  campaignId: string
  /** Optional preset key — applies preset values as base, then field overrides on top */
  presetKey?: string
  /** Individual field overrides (any subset of ThemeData) */
  bgGradient?: string | null
  bgDeep?: string | null
  titleColor?: string | null
  accentPrimary?: string | null
  accentSecondary?: string | null
  accentTertiary?: string | null
  greenAccent?: string | null
  surfaceColor?: string | null
  surfaceHoverColor?: string | null
  borderColor?: string | null
  borderHoverColor?: string | null
  textPrimary?: string | null
  textSecondary?: string | null
  textMuted?: string | null
  ctaBg?: string | null
  ctaText?: string | null
  ctaHoverBg?: string | null
  fontDisplayKey?: string | null
  fontBodyKey?: string | null
  posterImageUrl?: string | null
  /** Channel 2: Border/altitude tokens */
  borderTokens?: CampaignBorderTokens | null
  /** Channel 3: Density/stage tokens */
  densityTokens?: CampaignDensityTokens | null
  /** Full CSS var overrides — power-user layer (highest priority) */
  cssVarOverrides?: Record<string, string> | null
}

export type SaveCampaignThemeResult =
  | { success: true; themeId: string }
  | { error: string }

export type CampaignThemeRecord = {
  id: string
  campaignId: string
  // Background
  bgGradient: string | null
  bgDeep: string | null
  // Color palette
  titleColor: string | null
  accentPrimary: string | null
  accentSecondary: string | null
  accentTertiary: string | null
  greenAccent: string | null
  // Surface colors
  surfaceColor: string | null
  surfaceHoverColor: string | null
  // Border colors
  borderColor: string | null
  borderHoverColor: string | null
  // Text colors
  textPrimary: string | null
  textSecondary: string | null
  textMuted: string | null
  // CTA tokens
  ctaBg: string | null
  ctaText: string | null
  ctaHoverBg: string | null
  // Typography
  fontDisplayKey: string | null
  fontBodyKey: string | null
  posterImageUrl: string | null
  // Three-channel encoding Json
  borderTokens: CampaignBorderTokens | null
  densityTokens: CampaignDensityTokens | null
  // Override layers
  cssVarOverrides: Record<string, string> | null
  narrativeConfig: unknown
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// saveCampaignTheme — Steward+ creates or updates the L2 visual theme
// ---------------------------------------------------------------------------

/**
 * Upsert a CampaignTheme record for the given campaign.
 *
 * Flow:
 *   1. Auth + Steward+ guard
 *   2. Campaign must be editable (DRAFT or REJECTED)
 *   3. If presetKey is provided, start from preset values
 *   4. Layer any explicit field overrides on top
 *   5. Upsert the CampaignTheme record
 *
 * This implements the "template + customize" pattern: pick a preset,
 * then tweak. Or skip the preset and set every field manually.
 */
export async function saveCampaignTheme(
  input: SaveCampaignThemeInput,
): Promise<SaveCampaignThemeResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const allowed = await isStewardPlusForCampaign(playerId, input.campaignId)
  if (!allowed) {
    return { error: 'Not authorized — steward or higher role required' }
  }

  // Fetch campaign for status check
  const campaign = await db.campaign.findUnique({
    where: { id: input.campaignId },
    select: { status: true, slug: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  // Editable guard (DRAFT or REJECTED)
  const editCheck = validateEdit(campaign.status as CampaignStatus)
  if (!editCheck.valid) return { error: editCheck.reason }

  // --- Build theme data: preset base + field overrides ---
  let base: ThemeData = {
    bgGradient: null,
    bgDeep: null,
    titleColor: null,
    accentPrimary: null,
    accentSecondary: null,
    accentTertiary: null,
    greenAccent: null,
    surfaceColor: null,
    surfaceHoverColor: null,
    borderColor: null,
    borderHoverColor: null,
    textPrimary: null,
    textSecondary: null,
    textMuted: null,
    ctaBg: null,
    ctaText: null,
    ctaHoverBg: null,
    fontDisplayKey: null,
    fontBodyKey: null,
    posterImageUrl: null,
    borderTokens: null,
    densityTokens: null,
    cssVarOverrides: null,
  }

  // Apply preset as base if provided
  if (input.presetKey) {
    const preset = getThemePreset(input.presetKey)
    if (!preset) {
      return { error: `Unknown theme preset: "${input.presetKey}"` }
    }
    base = { ...preset.theme }
  }

  // Layer explicit field overrides on top (undefined = keep base, null = clear)
  const pick = <T>(inputVal: T | undefined, baseVal: T): T =>
    inputVal !== undefined ? inputVal : baseVal
  const pickJson = (inputVal: unknown, baseVal: unknown) =>
    inputVal !== undefined
      ? (inputVal as Prisma.InputJsonValue ?? Prisma.DbNull)
      : (baseVal as Prisma.InputJsonValue ?? Prisma.DbNull)

  const data = {
    // Background
    bgGradient: pick(input.bgGradient, base.bgGradient),
    bgDeep: pick(input.bgDeep, base.bgDeep),
    // Color palette
    titleColor: pick(input.titleColor, base.titleColor),
    accentPrimary: pick(input.accentPrimary, base.accentPrimary),
    accentSecondary: pick(input.accentSecondary, base.accentSecondary),
    accentTertiary: pick(input.accentTertiary, base.accentTertiary),
    greenAccent: pick(input.greenAccent, base.greenAccent),
    // Surface
    surfaceColor: pick(input.surfaceColor, base.surfaceColor),
    surfaceHoverColor: pick(input.surfaceHoverColor, base.surfaceHoverColor),
    // Borders
    borderColor: pick(input.borderColor, base.borderColor),
    borderHoverColor: pick(input.borderHoverColor, base.borderHoverColor),
    // Text
    textPrimary: pick(input.textPrimary, base.textPrimary),
    textSecondary: pick(input.textSecondary, base.textSecondary),
    textMuted: pick(input.textMuted, base.textMuted),
    // CTA
    ctaBg: pick(input.ctaBg, base.ctaBg),
    ctaText: pick(input.ctaText, base.ctaText),
    ctaHoverBg: pick(input.ctaHoverBg, base.ctaHoverBg),
    // Typography
    fontDisplayKey: pick(input.fontDisplayKey, base.fontDisplayKey),
    fontBodyKey: pick(input.fontBodyKey, base.fontBodyKey),
    posterImageUrl: pick(input.posterImageUrl, base.posterImageUrl),
    // Three-channel encoding Json
    borderTokens: pickJson(input.borderTokens, base.borderTokens),
    densityTokens: pickJson(input.densityTokens, base.densityTokens),
    // Override layer
    cssVarOverrides: pickJson(input.cssVarOverrides, base.cssVarOverrides),
  }

  // --- Upsert the theme record ---
  const theme = await db.campaignTheme.upsert({
    where: { campaignId: input.campaignId },
    update: {
      ...data,
      // Preserve narrativeConfig on update (L3 reserved)
    },
    create: {
      campaignId: input.campaignId,
      ...data,
      narrativeConfig: Prisma.DbNull, // L3 reserved
    },
  })

  revalidatePath(`/campaigns/${campaign.slug}`)
  revalidatePath(`/campaign/${campaign.slug}`)

  return { success: true, themeId: theme.id }
}

// ---------------------------------------------------------------------------
// applyThemePreset — Convenience: apply a full preset (no overrides)
// ---------------------------------------------------------------------------

/**
 * Apply a theme preset to a campaign, replacing the entire theme.
 * Shortcut for saveCampaignTheme({ campaignId, presetKey }).
 */
export async function applyThemePreset(
  campaignId: string,
  presetKey: string,
): Promise<SaveCampaignThemeResult> {
  return saveCampaignTheme({ campaignId, presetKey })
}

// ---------------------------------------------------------------------------
// getCampaignTheme — Read the current theme for a campaign
// ---------------------------------------------------------------------------

export async function getCampaignTheme(
  campaignId: string,
): Promise<{ theme: CampaignThemeRecord | null } | { error: string }> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const allowed = await isStewardPlusForCampaign(playerId, campaignId)
  if (!allowed) return { error: 'Not authorized' }

  const theme = await db.campaignTheme.findUnique({
    where: { campaignId },
  })

  return {
    theme: theme
      ? {
          ...theme,
          borderTokens: (theme.borderTokens as CampaignBorderTokens) ?? null,
          densityTokens: (theme.densityTokens as CampaignDensityTokens) ?? null,
          cssVarOverrides: (theme.cssVarOverrides as Record<string, string>) ?? null,
        }
      : null,
  }
}

// ---------------------------------------------------------------------------
// resetCampaignTheme — Delete the theme record (reverts to static skin)
// ---------------------------------------------------------------------------

export async function resetCampaignTheme(
  campaignId: string,
): Promise<ActionResult> {
  const playerId = await getPlayerId()
  if (!playerId) return { error: 'Not authenticated' }

  const allowed = await isStewardPlusForCampaign(playerId, campaignId)
  if (!allowed) return { error: 'Not authorized — steward or higher role required' }

  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true, slug: true },
  })
  if (!campaign) return { error: 'Campaign not found' }

  const editCheck = validateEdit(campaign.status as CampaignStatus)
  if (!editCheck.valid) return { error: editCheck.reason }

  // Delete theme if it exists
  await db.campaignTheme.deleteMany({
    where: { campaignId },
  })

  revalidatePath(`/campaigns/${campaign.slug}`)
  revalidatePath(`/campaign/${campaign.slug}`)

  return { success: true, message: 'Campaign theme reset to default' }
}

// ---------------------------------------------------------------------------
// getDefaultPresetKey — Returns the default preset key for new campaigns
// ---------------------------------------------------------------------------

export async function getDefaultPresetKey(): Promise<string> {
  return DEFAULT_PRESET_KEY
}
