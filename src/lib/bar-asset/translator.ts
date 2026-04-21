/**
 * BarAsset Translator — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-002 | Issue: #76
 *
 * Phase 2 — Translation Layer
 *
 * Translates AuthoredContent (title + description + metadata) into a BarAsset
 * using the NL engine. The output is game-ready (maturity='integrated').
 *
 * Gate: Only accepts content with metabolization state maturity >= 'shared_or_acted'.
 * Throws SeedMaturityError if maturity is insufficient.
 *
 * Contract:
 *   Input:  AuthoredContent with maturity >= 'shared_or_acted'
 *   Output: BarAsset (barDef + maturity='integrated')
 *
 * References:
 *   src/lib/bars.ts — BarDef, BarInput (existing game component types)
 *   src/lib/bar-seed-metabolization/types.ts — SeedMetabolizationState, MaturityPhase (existing)
 *   src/lib/bar-asset/types.ts — BarAsset, hasMinimumMaturityForConstructorB, promoteToIntegrated
 *   src/lib/bar-asset/id.ts — buildStructuredBarId, BAR_TYPE_PREFIXES
 *   src/lib/bar-asset/dispatcher.ts — dispatchAI
 *   src/lib/bar-asset/prompts/blessed-object.ts — NL prompt template
 */

import type { BarDef } from '../bars'
import type { SeedMetabolizationState } from '../bar-seed-metabolization/types'
import type { BarAsset } from './types'
import { hasMinimumMaturityForConstructorB, promoteToIntegrated, BAR_TYPE_PREFIXES } from './types'
import { dispatchAI } from './dispatcher'
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/blessed-object'
import { buildStructuredBarId, type BarType } from './id'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class SeedMaturityError extends Error {
  readonly currentMaturity: string
  readonly minimumRequired = 'shared_or_acted'

  constructor(current: string) {
    super(
      `Content maturity '${current}' is below minimum required 'shared_or_acted'. ` +
      `Translation layer does not accept content below 'shared_or_acted' maturity.`,
    )
    this.name = 'SeedMaturityError'
    this.currentMaturity = current
  }
}

export class TranslationError extends Error {
  readonly provider: string
  readonly rawOutput?: string

  constructor(message: string, provider: string, rawOutput?: string) {
    super(message)
    this.name = 'TranslationError'
    this.provider = provider
    this.rawOutput = rawOutput
  }
}

// ---------------------------------------------------------------------------
// Input type (what Constructor A produces)
// ---------------------------------------------------------------------------

/**
 * The minimal input that Constructor A (NL authoring) produces.
 * This is what the translator accepts — not a full BarSeed type,
 * just title + description + metabolization state.
 */
export interface AuthoredContent {
  id: string
  title: string
  description: string
  barType?: string
  metadata?: {
    author?: string
    metabolization?: SeedMetabolizationState
  }
}

// ---------------------------------------------------------------------------
// Core translator
// ---------------------------------------------------------------------------

/**
 * Translate authored content into a BarAsset using the NL engine.
 *
 * @param seed - AuthoredContent with maturity >= 'shared_or_acted'
 * @param creator - Creator segment of the output BarId (default: 'barsengine')
 * @returns BarAsset ready for Constructor C (game renderer)
 */
export async function translateBarSeedToAsset(
  seed: AuthoredContent,
  creator: string = 'barsengine',
): Promise<BarAsset> {
  // Gate: enforce minimum maturity
  const meta = seed.metadata
  if (!hasMinimumMaturityForConstructorB(meta?.metabolization)) {
    const current = meta?.metabolization?.maturity ?? 'undefined'
    throw new SeedMaturityError(current)
  }

  // Build NL prompt
  const prompt = buildUserPrompt(seed)

  // Call NL engine
  const result = await dispatchAI({
    input: prompt,
    system: SYSTEM_PROMPT,
    maxTokens: 1024,
    temperature: 0.8,
  })

  // Parse NL output — expect JSON with { name, description, exits?, props?, mood? }
  let parsed: {
    name?: unknown
    description?: unknown
    exits?: unknown[]
    props?: unknown[]
    mood?: unknown
  }

  try {
    // Strip markdown code fences if present
    const rawJson = result.output
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    parsed = JSON.parse(rawJson)
  } catch {
    throw new TranslationError(
      'NL provider returned non-JSON output',
      result.provider,
      result.output,
    )
  }

  // Validate required fields
  if (!parsed.name && !parsed.description) {
    throw new TranslationError(
      'NL output missing required fields: name and description',
      result.provider,
      result.output,
    )
  }

  // Build barDef from NL output
  const barDef: BarDef = {
    id: seed.id,
    type: (seed.barType as BarDef['type']) ?? 'story',
    title: String(parsed.name ?? seed.title),
    description: String(parsed.description ?? seed.description),
    inputs: [],
    reward: 2,
    unique: false,
  }

  // Determine barType + build structured barId
  const barType: BarType = (BAR_TYPE_PREFIXES as readonly string[]).includes(seed.barType ?? '')
    ? (seed.barType as BarType)
    : 'story'
  const barId = buildStructuredBarId(barType, creator, 1)

  // Build metadata from seed + NL output
  const storyContent = parsed.mood ? `MOOD: ${String(parsed.mood)}` : null

  const metadata: BarAsset['metadata'] = {
    author: meta?.author ?? creator,
    creator,
    translationProvider: result.provider ?? null,
    translationTokens: result.tokensUsed ?? null,
    gameMasterFace: undefined,
    emotionalVector: undefined,
    tags: storyContent ? [storyContent] : [],
  }

  // Promote to integrated BarAsset
  return promoteToIntegrated(barDef, seed.id, metadata)
}