/**
 * NPC slot tag resolver — runtime per-player injection.
 *
 * Passage content from spoke Adventures may contain semantic slot tags:
 *   {{npc:shaman}}   {{npc:challenger}}  … (face-specific)
 *   {{npc:resource}} {{npc:obstacle}}    (function-specific)
 *
 * resolveNpcSlots() replaces each tag with a concrete NPC from the campaign,
 * using unseen-first then stalest-seen selection tracked at PlayerPlaybook level.
 *
 * NPC selection rule (per seed spec):
 *   1. Prefer NPCs the player has NOT seen in this spoke session
 *   2. Among seen NPCs, prefer stalest last-interaction timestamp
 *   3. Only select from NPCs active in the campaign
 */

import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Slot tag parsing
// ---------------------------------------------------------------------------

/** Regex that matches {{npc:something}} tags in passage text */
const NPC_SLOT_RE = /\{\{npc:([a-z_-]+)\}\}/g

export type NpcSlotTag = {
  raw: string       // e.g. "{{npc:challenger}}"
  semantic: string  // e.g. "challenger"
}

export function parseNpcSlotTags(text: string): NpcSlotTag[] {
  const tags: NpcSlotTag[] = []
  let match
  NPC_SLOT_RE.lastIndex = 0
  while ((match = NPC_SLOT_RE.exec(text)) !== null) {
    tags.push({ raw: match[0], semantic: match[1] })
  }
  return tags
}

// ---------------------------------------------------------------------------
// NPC selection
// ---------------------------------------------------------------------------

interface NpcCandidate {
  id: string
  name: string
  semanticTags: string[]
  lastSeenAt: Date | null
  seenInSession: boolean
}

/**
 * Parse semantic slot tags from NpcConstitution fields.
 * Uses archetypalRole (e.g. "challenger") + function JSON's primary_scene_role.
 */
function extractNpcSemanticTags(npc: { archetypalRole: string; function: string }): string[] {
  const tags: string[] = [npc.archetypalRole.toLowerCase()]
  try {
    const fn = JSON.parse(npc.function) as { primary_scene_role?: string }
    if (fn.primary_scene_role) tags.push(fn.primary_scene_role.toLowerCase())
  } catch { /* skip */ }
  return tags
}

async function selectNpcForSlot(
  semantic: string,
  spokeSessionId: string,
  alreadyAssigned: Set<string>,
): Promise<{ id: string; name: string } | null> {
  // Fetch active NPCs with their encounter history for this session
  const npcs = await db.npcConstitution.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      archetypalRole: true,
      function: true,
      npcEncounters: {
        where: { spokeSessionId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  const candidates: NpcCandidate[] = []
  for (const npc of npcs) {
    if (alreadyAssigned.has(npc.id)) continue

    const semanticTags = extractNpcSemanticTags(npc)
    const matches =
      semanticTags.includes(semantic) ||
      semanticTags.some((t) => t.startsWith(semantic))

    if (!matches) continue

    const seenInSession = npc.npcEncounters.length > 0
    candidates.push({
      id: npc.id,
      name: npc.name,
      semanticTags,
      lastSeenAt: seenInSession ? npc.npcEncounters[0].createdAt : null,
      seenInSession,
    })
  }

  if (candidates.length === 0) return null

  // Sort: unseen first, then stalest-seen (oldest lastSeenAt)
  candidates.sort((a, b) => {
    if (a.seenInSession !== b.seenInSession) {
      return a.seenInSession ? 1 : -1 // unseen first
    }
    if (a.lastSeenAt && b.lastSeenAt) {
      return a.lastSeenAt.getTime() - b.lastSeenAt.getTime() // stalest first
    }
    return 0
  })

  return { id: candidates[0].id, name: candidates[0].name }
}

// ---------------------------------------------------------------------------
// resolveNpcSlots — public API
// ---------------------------------------------------------------------------

export interface NpcSlotResolution {
  /** Passage text with {{npc:...}} tags replaced by NPC names */
  resolvedText: string
  /** Map of slot tag → resolved NPC id (for creating NpcEncounter records) */
  assignments: Map<string, { npcId: string; npcName: string }>
}

/**
 * Resolve all {{npc:...}} slot tags in a passage text.
 *
 * @param text          Raw passage text with slot tags
 * @param campaignRef   Campaign scope for NPC selection
 * @param spokeSessionId Spoke session for unseen-first tracking
 */
export async function resolveNpcSlots(
  text: string,
  _campaignRef: string,
  spokeSessionId: string,
): Promise<NpcSlotResolution> {
  const tags = parseNpcSlotTags(text)
  if (tags.length === 0) {
    return { resolvedText: text, assignments: new Map() }
  }

  const assignments = new Map<string, { npcId: string; npcName: string }>()
  const assigned = new Set<string>() // prevent same NPC for multiple slots
  let resolvedText = text

  for (const tag of tags) {
    // De-duplicate: if we already resolved this exact semantic, reuse the same NPC
    if (assignments.has(tag.semantic)) {
      const existing = assignments.get(tag.semantic)!
      resolvedText = resolvedText.replace(tag.raw, existing.npcName)
      continue
    }

    const npc = await selectNpcForSlot(tag.semantic, spokeSessionId, assigned)
    if (npc) {
      assignments.set(tag.semantic, { npcId: npc.id, npcName: npc.name })
      assigned.add(npc.id)
      resolvedText = resolvedText.replace(tag.raw, npc.name)
    } else {
      // No matching NPC — remove tag gracefully
      resolvedText = resolvedText.replace(tag.raw, 'a stranger')
    }
  }

  return { resolvedText, assignments }
}
