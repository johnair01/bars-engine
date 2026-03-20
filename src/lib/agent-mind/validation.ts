/**
 * Canonical nation + archetype validation for agent mind (FO).
 */

import { NATIONS, type Nation } from '@/lib/game/nations'
import { resolvePlaybookArchetypeKey } from '@/lib/narrative-transformation/moves/archetype-profiles'
import { ARCHETYPE_PROFILES } from '@/lib/archetype-influence-overlay/profiles'

export type ResolvedAgentIdentity = {
  nation: Nation
  archetype_slug: string
  archetype_display: string
}

function findNation(raw: string): Nation | undefined {
  const t = raw.trim()
  const lower = t.toLowerCase()
  if (NATIONS[lower]) return NATIONS[lower]
  return Object.values(NATIONS).find((n) => n.name.toLowerCase() === lower)
}

/** Resolve nation from id or name; throws if invalid. */
export function resolveNationOrThrow(raw: string): Nation {
  const n = findNation(raw)
  if (!n) {
    throw new Error(
      `Invalid nation "${raw}". Expected one of: ${Object.values(NATIONS)
        .map((x) => x.name)
        .join(', ')}`
    )
  }
  return n
}

/** Resolve archetype to playbook slug + display name; throws if invalid. */
export function resolveArchetypeOrThrow(raw: string): { slug: string; display: string } {
  const trimmed = raw.trim()
  const slugified = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-')
  const slug =
    resolvePlaybookArchetypeKey(trimmed) ??
    resolvePlaybookArchetypeKey(slugified) ??
    resolvePlaybookArchetypeKey(slugified.replace(/^the-/, ''))
  if (!slug) {
    throw new Error(
      `Invalid archetype "${raw}". Use a playbook slug (e.g. bold-heart) or signal key (e.g. truth_seer).`
    )
  }
  const profile = ARCHETYPE_PROFILES.find((p) => p.archetype_id === slug)
  const display = profile?.archetype_name.replace(/^The\s+/i, '') ?? slug
  return { slug, display }
}

export function resolveAgentIdentity(nationRaw: string, archetypeRaw: string): ResolvedAgentIdentity {
  const nation = resolveNationOrThrow(nationRaw)
  const { slug, display } = resolveArchetypeOrThrow(archetypeRaw)
  return {
    nation,
    archetype_slug: slug,
    archetype_display: display,
  }
}
