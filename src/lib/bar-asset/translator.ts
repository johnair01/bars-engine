/**
 * BarAsset Translator — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Constructor B: translates a BarSeed into a BarAsset for game rendering.
 *
 * Gate: Only accepts BarSeed with metabolization.maturity >= 'shared_or_acted'.
 * Throws SeedMaturityError if maturity is insufficient.
 *
 * Contract:
 *   Input:  BarSeed with maturity >= 'shared_or_acted'
 *   Output: BarAsset (barDef + maturity='integrated')
 *
 * References:
 *   src/lib/bars.ts — BarDef, BarInput (existing game component types)
 *   src/lib/bar-seed-metabolization/types.ts — SeedMetabolizationState, MaturityPhase
 *   src/lib/bar-asset/types.ts — BarAsset, hasMinimumMaturityForConstructorB, promoteToIntegrated
 *   src/lib/bar-asset/id.ts — buildStructuredBarId, BAR_TYPE_PREFIXES
 *   src/lib/bar-asset/dispatcher.ts — dispatchAI
 *   src/lib/bar-asset/prompts/blessed-object.ts — NL prompt template
 */

import type { SeedMetabolizationState } from '../bar-seed-metabolization/types'
import type { BarDef } from '../bars'
import type { BarAsset } from './types'
import { hasMinimumMaturityForConstructorB, promoteToIntegrated, BAR_TYPE_PREFIXES } from './types'
import { dispatchAI } from './dispatcher'
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts/blessed-object'
import { buildStructuredBarId } from './id'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class SeedMaturityError extends Error {
  readonly currentMaturity: string
  readonly minimumRequired = 'shared_or_acted'

  constructor(current: string) {
    super(
      `BarSeed maturity '${current}' is below minimum required 'shared_or_acted'. ` +
      `Translation layer does not accept BarSeed below 'shared_or_acted' maturity.`
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
// Core translator
// ---------------------------------------------------------------------------

/**
 * Translate a BarSeed into a BarAsset using the NL engine.
 *
 * @param seed       — BarSeed with maturity >= 'shared_or_acted'
 * @param creator   — creator segment of the output BarId (default: 'barsengine')
 * @returns BarAsset ready for Constructor C (game renderer)
 */
export async function translateBarSeedToAsset(
  seed: { id: string; title: string; description: string; metadata?: { metabolization?: SeedMetabolizationState; author?: string; contentType?: string } },
  creator: string = 'barsengine',
): Promise<BarAsset> {
  // Gate: enforce minimum maturity
  const metabolization = seed.metadata?.metabolization
  if (!metabolization || !hasMinimumMaturityForConstructorB(metabolization)) {
    const current = metabolization?.maturity ?? 'unknown'
    throw new SeedMaturityError(current)
  }

  // Call NL engine
  const userPrompt = buildUserPrompt(seed)
  const result = await dispatchAI({
    system: SYSTEM_PROMPT,
    input: userPrompt,
    maxTokens: 1024,
    temperature: 0.8,
  })

  // Parse JSON from NL output — strip markdown code fences if present
  let rawJson = result.output.trim()
  if (rawJson.startsWith('```')) {
    rawJson = rawJson.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '')
  }

  let parsed: {
    name?: unknown
    description?: unknown
    exits?: unknown[]
    props?: unknown[]
    mood?: unknown
  }
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    throw new TranslationError('NL provider returned non-JSON output', result.provider ?? 'unknown', result.output)
  }

  // Validate required fields
  if (!parsed.name && !parsed.description) {
    throw new TranslationError(
      'NL output missing required fields: name and description',
      result.provider ?? 'unknown',
      result.output,
    )
  }

  // Build barDef from NL output
  const barDef: BarDef = {
    id: seed.id,
    type: (seed.metadata?.contentType as BarDef['type']) ?? 'story',
    title: String(parsed.name ?? seed.title),
    description: String(parsed.description ?? seed.description),
    inputs: [],
    reward: 2,
    unique: false,
  }

  // Determine storyPath from barType + barId
  const barType = (BAR_TYPE_PREFIXES as readonly string[]).includes(creator)
    ? creator
    : 'blessed'
  const barId = buildStructuredBarId(barType as any, 'barsengine', 1)

  // Build metadata from seed + NL output
  const meta = seed.metadata ?? {}
  const metadata: BarAsset['metadata'] = {
    author: meta.author ?? undefined,
    tags: [],
    gameMasterFace: undefined,
    emotionalVector: undefined,
    translationProvider: result.provider ?? null,
    translationTokens: result.tokensUsed ?? null,
  }

  // Promote to integrated BarAsset
  const sourceSeedId = seed.id
  const asset = promoteToIntegrated(barDef, sourceSeedId, metadata)

  // Attach storyContent for Constructor C (game renderer) via metadata
  // storyPath convention: {barType}/{barId}/start
  const storyContent = parsed.mood ? `🜄 MOOD: ${String(parsed.mood)}` : null

  return {
    ...asset,
    metadata: {
      ...asset.metadata,
      // storyPath for game routing
      author: `${barType}/${barId}/start`,
      // storyContent for the room renderer
      tags: storyContent ? [storyContent] : [],
    },
  }
}
