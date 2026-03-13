'use server'

import { generateObject } from 'ai'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getOpenAI } from '@/lib/openai'
import { generateObjectWithRetry } from '@/lib/ai-with-cache'
import { isBackendAvailable, identifyViaAgent } from '@/lib/agent-client'
import { CANONICAL_ARCHETYPE_NAMES } from '@/lib/canonical-archetypes'

const EXTRACT_321_TAXONOMY_ENABLED = process.env.EXTRACT_321_TAXONOMY_ENABLED !== 'false'

const extractionSchema = z.object({
  nationName: z.string().nullable().describe('Canonical nation name if detected, else null'),
  archetypeName: z.string().nullable().describe('Canonical archetype name (e.g. The Bold Heart) if detected, else null'),
  confidence: z.number().min(0).max(1).describe('Confidence 0-1'),
})

export type Extract321TaxonomyResult = {
  nationName?: string | null
  archetypeName?: string | null
  confidence?: number
}

/**
 * Extract nation and archetype from free-type 321 identity text.
 * Uses AI to parse; results inform BAR metadata (allowedNations, allowedTrigrams).
 * Start with AI to learn patterns; document for future deterministic model.
 */
export async function extractNationArchetypeFromText(
  freeText: string
): Promise<Extract321TaxonomyResult> {
  const trimmed = (freeText || '').trim()
  if (!trimmed) return {}

  if (!EXTRACT_321_TAXONOMY_ENABLED) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[extract-321-taxonomy] Disabled via EXTRACT_321_TAXONOMY_ENABLED')
    }
    return {}
  }

  // ---------------------------------------------------------------------------
  // Tier 1: Try Agent (Shaman identify) — richer I Ching context
  // ---------------------------------------------------------------------------
  if (process.env.AGENT_ROUTING_ENABLED !== 'false') {
    try {
      const backendUp = await isBackendAvailable()
      if (backendUp) {
        const agentResult = await identifyViaAgent({ freeText: trimmed })
        const output = agentResult.output as {
          nation_name?: string | null
          nationName?: string | null
          archetype_name?: string | null
          archetypeName?: string | null
          confidence?: number
        }
        if (output) {
          const result: Extract321TaxonomyResult = {
            confidence: output.confidence,
          }
          const nationName = output.nation_name ?? output.nationName
          const archetypeName = output.archetype_name ?? output.archetypeName
          if (nationName) result.nationName = nationName
          if (archetypeName) result.archetypeName = archetypeName
          return result
        }
      }
    } catch (agentErr) {
      console.warn('[extract-321-taxonomy] Agent path failed, falling through to direct AI:', agentErr)
    }
  }

  // ---------------------------------------------------------------------------
  // Tier 2: Direct OpenAI (existing behavior)
  // ---------------------------------------------------------------------------
  try {
    const [nations, playbooks] = await Promise.all([
      db.nation.findMany({ where: { archived: false }, select: { name: true } }),
      db.archetype.findMany({ select: { name: true } }),
    ])
    const nationNames = nations.map((n) => n.name).join(', ')
    const archetypeNames = [...CANONICAL_ARCHETYPE_NAMES, ...playbooks.map((p) => p.name)]
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ')

    const system = `You extract nation and archetype from free-form text about a person's charge or identity.

Canonical nations: ${nationNames}
Canonical archetypes: ${archetypeNames}

Return the best match for each, or null if unclear. Use exact names from the lists. Confidence 0-1 based on how clearly the text maps.`

    const prompt = `Extract nation and archetype from this free-type identity text:\n\n"${trimmed}"`

    const modelId = process.env.EXTRACT_321_TAXONOMY_MODEL || 'gpt-4o-mini'

    const { object } = await generateObjectWithRetry<z.infer<typeof extractionSchema>>(async () => {
      const res = await generateObject({
        model: getOpenAI()(modelId),
        schema: extractionSchema,
        system,
        prompt,
      })
      return { object: res.object as z.infer<typeof extractionSchema> }
    })

    const result: Extract321TaxonomyResult = {
      confidence: object.confidence,
    }
    if (object.nationName) result.nationName = object.nationName
    if (object.archetypeName) result.archetypeName = object.archetypeName

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[extract-321-taxonomy]', { input: trimmed.slice(0, 50), result })
    }

    return result
  } catch (e) {
    console.error('[extract-321-taxonomy]', e)
    return {}
  }
}
