/**
 * NarrativeTemplate Preview — Data Types + Wuxing Palette Mapping
 *
 * Provides:
 * 1. Preview data types for rendering NarrativeTemplate cards/previews
 *    in the CYOA Composer and admin template browsers.
 * 2. Wuxing palette mapping utility that resolves a template's
 *    EmotionalVector → ElementKey → ELEMENT_TOKENS color palette.
 *
 * Design:
 * - EmotionalVector.channelFrom determines the "source" element/palette.
 * - EmotionalVector.channelTo determines the "destination" element/palette.
 * - Altitude maps to CardAltitude for glow/border treatment.
 * - The preview carries both source and destination palettes so UI can
 *   render gradient transitions (e.g. source → destination color flow).
 *
 * @see src/lib/ui/card-tokens.ts — ELEMENT_TOKENS, ALTITUDE_TOKENS (source of truth)
 * @see src/lib/quest-grammar/elements.ts — channel ↔ element mapping
 * @see src/lib/quest-grammar/types.ts — EmotionalVector, EmotionalChannel
 * @see src/lib/alchemy/wuxing.ts — Wuxing cycle routing
 */

import type { AlchemyAltitude } from '@/lib/alchemy/types'
import type { EmotionalChannel, EmotionalVector, GameMasterFace, MoveFamily } from '@/lib/quest-grammar/types'
import type { ElementKey, CardAltitude } from '@/lib/ui/card-tokens'
import { ELEMENT_TOKENS, ALTITUDE_TOKENS, elementCssVars, altitudeCssVars } from '@/lib/ui/card-tokens'
import { channelToElement } from '@/lib/quest-grammar/elements'
import type { NarrativeTemplateKind } from './types'

// ---------------------------------------------------------------------------
// Resolved Wuxing Palette — the color token slice for one element+altitude
// ---------------------------------------------------------------------------

/** Resolved palette for a single Wuxing element at a given altitude. */
export interface WuxingPalette {
  /** Wuxing element key resolved from the emotional channel. */
  element: ElementKey
  /** Emotional channel this palette was resolved from. */
  channel: EmotionalChannel
  /** Altitude (dissatisfied/neutral/satisfied). */
  altitude: CardAltitude
  /** CJK sigil for the element (火/水/木/金/土). */
  sigil: string
  /** Frame border hex color (e.g. '#c1392b' for fire). */
  frame: string
  /** Glow box-shadow hex color. */
  glow: string
  /** Gem/rarity indicator hex color. */
  gem: string
  /** Tailwind background class. */
  bg: string
  /** Tailwind border class. */
  border: string
  /** Tailwind text accent class. */
  textAccent: string
  /** Tailwind badge background class. */
  badgeBg: string
  /** Gradient start hex. */
  gradFrom: string
  /** Gradient end hex. */
  gradTo: string
  /** Glow radius CSS value from altitude. */
  glowRadius: string
  /** Border opacity 0–1 from altitude. */
  borderOpacity: number
  /** Border width CSS value from altitude. */
  borderWidth: string
}

// ---------------------------------------------------------------------------
// Template Preview Palette — source + destination for vector transitions
// ---------------------------------------------------------------------------

/**
 * Full palette pair for a narrative template's emotional vector.
 * Source = channelFrom, Destination = channelTo.
 *
 * When channelFrom === channelTo (Transcend move), source and destination
 * will be the same element but may differ in altitude treatment.
 */
export interface TemplatePreviewPalette {
  /** Source palette (channelFrom + altitudeFrom). */
  source: WuxingPalette
  /** Destination palette (channelTo + altitudeTo). */
  destination: WuxingPalette
  /** Move family derived from the vector (Transcend = same channel, Translate = different). */
  moveFamily: MoveFamily
  /** CSS custom properties for the source element (--element-frame, --element-glow, --element-gem). */
  sourceCssVars: Record<string, string>
  /** CSS custom properties for the destination element. */
  destinationCssVars: Record<string, string>
  /** CSS custom properties for source altitude (--glow-radius, --border-width, --border-opacity). */
  sourceAltitudeCssVars: Record<string, string>
  /** CSS custom properties for destination altitude. */
  destinationAltitudeCssVars: Record<string, string>
}

// ---------------------------------------------------------------------------
// NarrativeTemplate Preview Data — lightweight card/list rendering shape
// ---------------------------------------------------------------------------

/**
 * Preview data for rendering a NarrativeTemplate in card/list views.
 * Combines template metadata with resolved Wuxing palette.
 */
export interface NarrativeTemplatePreview {
  /** Template ID. */
  id: string
  /** Unique key. */
  key: string
  /** Display name. */
  name: string
  /** Short description. */
  description: string | null
  /** Template kind discriminator. */
  kind: NarrativeTemplateKind
  /** Number of steps/beats. */
  stepCount: number
  /** Quest model: personal (Epiphany) or communal (Kotter). */
  questModel: 'personal' | 'communal'
  /** GM face affinities — which faces align with this template. */
  faceAffinities: GameMasterFace[]
  /** Template status. */
  status: 'active' | 'archived'
  /** Resolved Wuxing palette (null when no emotional vector is provided). */
  palette: TemplatePreviewPalette | null
}

// ---------------------------------------------------------------------------
// Palette resolution utilities
// ---------------------------------------------------------------------------

/**
 * Map an AlchemyAltitude to CardAltitude.
 * They share the same literal values, but this makes the mapping explicit.
 */
function altitudeToCardAltitude(altitude: AlchemyAltitude): CardAltitude {
  return altitude as CardAltitude
}

/**
 * Resolve a single Wuxing palette from an emotional channel + altitude.
 *
 * Looks up the element via channelToElement(), then pulls the color tokens
 * from ELEMENT_TOKENS and altitude treatment from ALTITUDE_TOKENS.
 */
export function resolveWuxingPalette(
  channel: EmotionalChannel,
  altitude: AlchemyAltitude,
): WuxingPalette {
  const element = channelToElement(channel)
  const tokens = ELEMENT_TOKENS[element]
  const cardAltitude = altitudeToCardAltitude(altitude)
  const altTokens = ALTITUDE_TOKENS[cardAltitude]

  return {
    element,
    channel,
    altitude: cardAltitude,
    sigil: tokens.sigil,
    frame: tokens.frame,
    glow: tokens.glow,
    gem: tokens.gem,
    bg: tokens.bg,
    border: tokens.border,
    textAccent: tokens.textAccent,
    badgeBg: tokens.badgeBg,
    gradFrom: tokens.gradFrom,
    gradTo: tokens.gradTo,
    glowRadius: altTokens.glowRadius,
    borderOpacity: altTokens.borderOpacity,
    borderWidth: altTokens.borderWidth,
  }
}

/**
 * Resolve the full preview palette for an EmotionalVector.
 *
 * Maps channelFrom → source element palette, channelTo → destination element palette,
 * and derives the move family (Transcend when same channel, Translate otherwise).
 *
 * @param vector - The emotional vector (channelFrom/altitudeFrom → channelTo/altitudeTo)
 * @returns TemplatePreviewPalette with source/destination palettes and CSS vars
 */
export function resolveTemplatePreviewPalette(
  vector: EmotionalVector,
): TemplatePreviewPalette {
  const source = resolveWuxingPalette(vector.channelFrom, vector.altitudeFrom)
  const destination = resolveWuxingPalette(vector.channelTo, vector.altitudeTo)

  const moveFamily: MoveFamily =
    vector.channelFrom === vector.channelTo ? 'Transcend' : 'Translate'

  return {
    source,
    destination,
    moveFamily,
    sourceCssVars: elementCssVars(source.element),
    destinationCssVars: elementCssVars(destination.element),
    sourceAltitudeCssVars: altitudeCssVars(source.altitude),
    destinationAltitudeCssVars: altitudeCssVars(destination.altitude),
  }
}

/**
 * Build a NarrativeTemplatePreview from a template summary + optional emotional vector.
 *
 * @param template - Template metadata (from NarrativeTemplateSummary or NarrativeTemplateRow)
 * @param vector - Optional emotional vector; when provided, resolves Wuxing palette
 * @returns Preview data with resolved palette (or null palette when no vector)
 */
export function buildNarrativeTemplatePreview(
  template: {
    id: string
    key: string
    name: string
    description?: string | null
    kind: NarrativeTemplateKind
    stepCount: number
    questModel: 'personal' | 'communal'
    faceAffinities: GameMasterFace[]
    status: 'active' | 'archived'
  },
  vector?: EmotionalVector | null,
): NarrativeTemplatePreview {
  return {
    id: template.id,
    key: template.key,
    name: template.name,
    description: template.description ?? null,
    kind: template.kind,
    stepCount: template.stepCount,
    questModel: template.questModel,
    faceAffinities: template.faceAffinities,
    status: template.status,
    palette: vector ? resolveTemplatePreviewPalette(vector) : null,
  }
}

// ---------------------------------------------------------------------------
// Build preview from CompletedBuildReceipt (hub ledger — no fan-out queries)
// ---------------------------------------------------------------------------

/**
 * Build a NarrativeTemplatePreview from a CompletedBuildReceipt.
 *
 * The hub ledger is self-contained: the receipt carries templateKind,
 * templateKey, face, and emotionalVector — enough to resolve a full
 * preview with Wuxing palette without any DB fan-out queries.
 *
 * Fields not present in the receipt (id, name, description, stepCount)
 * are synthesized from available data:
 * - `id` = buildId (unique identifier available in receipt)
 * - `name` = templateKey humanized (capitalize + replace hyphens)
 * - `stepCount` = 0 (unknown from receipt alone; hidden in sealed cards)
 *
 * @param receipt - CompletedBuildReceipt from CampaignHubStateV1.completedBuilds
 * @returns NarrativeTemplatePreview with resolved Wuxing palette from the receipt's emotionalVector
 */
export function buildPreviewFromReceipt(
  receipt: {
    buildId: string
    face: GameMasterFace
    templateKind: string
    templateKey: string
    emotionalVector: EmotionalVector
  },
): NarrativeTemplatePreview {
  // Map receipt templateKind string to NarrativeTemplateKind union
  const validKinds: NarrativeTemplateKind[] = ['EPIPHANY', 'KOTTER', 'ORIENTATION', 'CUSTOM']
  const kind: NarrativeTemplateKind = validKinds.includes(receipt.templateKind as NarrativeTemplateKind)
    ? (receipt.templateKind as NarrativeTemplateKind)
    : 'CUSTOM'

  // Derive quest model from template kind (Kotter = communal, else personal)
  const questModel: 'personal' | 'communal' = kind === 'KOTTER' ? 'communal' : 'personal'

  // Humanize template key for display name (e.g. 'epiphany-bridge-default' → 'Epiphany Bridge Default')
  const name = receipt.templateKey
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return buildNarrativeTemplatePreview(
    {
      id: receipt.buildId,
      key: receipt.templateKey,
      name,
      description: null,
      kind,
      stepCount: 0,
      questModel,
      faceAffinities: [receipt.face],
      status: 'active',
    },
    receipt.emotionalVector,
  )
}

// ---------------------------------------------------------------------------
// Convenience: resolve palette from raw channel/altitude strings
// ---------------------------------------------------------------------------

/**
 * Resolve a Wuxing palette from lowercase channel name + altitude.
 * Convenience for cases where the channel comes as a lowercase string
 * (e.g. from wuxing.ts or alchemy check-in data).
 *
 * @param channel - Lowercase channel name ('fear' | 'anger' | 'sadness' | 'joy' | 'neutrality')
 * @param altitude - Altitude string ('dissatisfied' | 'neutral' | 'satisfied')
 * @returns WuxingPalette or null if channel is unrecognized
 */
export function resolveWuxingPaletteFromLowercase(
  channel: string,
  altitude: AlchemyAltitude,
): WuxingPalette | null {
  const LOWER_TO_CHANNEL: Record<string, EmotionalChannel> = {
    fear: 'Fear',
    anger: 'Anger',
    sadness: 'Sadness',
    joy: 'Joy',
    neutrality: 'Neutrality',
  }
  const upper = LOWER_TO_CHANNEL[channel]
  if (!upper) return null
  return resolveWuxingPalette(upper, altitude)
}
