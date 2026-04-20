/**
 * BarAsset Translator — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Constructor B: translates a BarSeed into a BarAsset for game rendering.
 *
 * Gate: Only accepts BarSeed with maturity >= 'shared_or_acted'.
 * Throws SeedMaturityError if maturity is insufficient.
 *
 * Contract:
 *   Input:  BarSeed with maturity >= 'shared_or_acted'
 *   Output: BarAsset (barDef + maturity='integrated')
 *
 * References:
 *   src/lib/bars.ts — BarDef, BarInput (existing game component types)
 *   src/lib/bar-seed-metabolization/types.ts — SeedMetabolizationState (existing)
 *   src/lib/bar-asset/types.ts — BarAsset, hasMinimumMaturityForConstructorB (Phase 1)
 *   src/lib/bar-asset/id.ts — buildStructuredBarId (Phase 1)
 *   src/lib/bar-asset/dispatcher.ts — dispatchAI (this phase)
 *   src/lib/bar-asset/prompts/blessed-object.ts — NL prompt template (this phase)
 */

import type { BarSeed } from '../bar-seed-metabolization/types'
import type { BarDef } from '../bars'
import type { BarAsset } from './types'
import { hasMinimumMaturityForConstructorB } from './types'
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
 * The NL engine (Constructor A) reads the BarSeed title/description,
 * generates a dungeon room description, and the translator packages it
 * as a BarAsset with maturity='integrated'.
 *
 * @param seed - BarSeed with maturity >= 'shared_or_acted'
 * @param creator - Creator segment of the output BarId (default: 'barsengine')
 * @returns BarAsset ready for Constructor C (game renderer)
 */
export async function translateBarSeedToAsset(
  seed: BarSeed,
  creator: string = 'barsengine',
): Promise<BarAsset> {
  // Gate: enforce minimum maturity
  const state = seed.metadata?.metabolization
  if (state) {
    if (!hasMinimumMaturityForConstructorB(state)) {
      throw new SeedMaturityError(state.maturity)
    }
  }

  // Call NL engine
  const userPrompt = buildUserPrompt(seed)
  const result = await dispatchAI({
    system: SYSTEM_PROMPT,
    input: userPrompt,
    maxTokens: 1024,
    temperature: 0.8,
  })

  // Parse JSON from NL output
  let parsed: {
    name?: unknown
    description?: unknown
    exits?: unknown[]
    props?: unknown[]
    mood?: unknown
  }
  try {
    parsed = JSON.parse(result.output)
  } catch {
    throw new TranslationError('NL provider returned non-JSON output', result.provider, result.output)
  }

  // Validate required fields
  const missing = ['name', 'description', 'exits', 'props', 'mood'].filter(
    (f) => !(f in parsed)
  )
  if (missing.length > 0) {
    throw new TranslationError(
      `NL output missing required fields: ${missing.join(', ')}`,
      result.provider,
      result.output
    )
  }

  // Build exits array
  const exits = (parsed.exits ?? []).map((e) => {
    const raw = e as Record<string, unknown>
    return {
      direction: String(raw.direction ?? ''),
      leadsTo: String(raw.leadsTo ?? ''),
      barrier: raw.barrier == null ? null : String(raw.barrier),
    }
  })

  // Build props array
  const props = (parsed.props ?? []).map((p) => {
    const raw = p as Record<string, unknown>
    return {
      name: String(raw.name ?? ''),
      description: String(raw.description ?? ''),
    }
  })

  // Determine barType from seed.barType or default to 'blessed'
  const barType = (seed.barType ?? 'blessed') as BarType

  // Derive sequence from metadata or default to 1
  const sequence = ((seed.metadata as Record<string, unknown>)?.sequence as number) ?? 1

  // Build the structured bar id
  const barId = buildStructuredBarId(barType, creator, sequence)

  // Build BarDef — what Constructor C actually renders
  const barDef: BarDef = {
    id: barId,
    type: 'story',
    title: String(parsed.name ?? seed.title),
    description: String(parsed.description ?? seed.description),
    inputs: [
      { key: 'characterName', label: 'Character Name', type: 'text', required: true },
    ],
    reward: 2,
    unique: false,
    storyPath: `${barType}/${barId}/start`,
  }

  // Promote to integrated BarAsset
  const asset: BarAsset = {
    barDef,
    maturity: 'integrated',
    integratedAt: new Date().toISOString(),
    sourceSeedId: seed.id,
    metadata: {
      author: seed.metadata?.author as string | undefined,
      tags: undefined,
      gameMasterFace: undefined,
      emotionalVector: undefined,
      translationProvider: result.provider,
      translationTokens: result.tokensUsed ?? null,
    },
  }

  return asset
}
