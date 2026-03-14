/**
 * Sage Coordination Protocol — DC-5
 * Per .specify/specs/deftness-uplevel-character-daemons-agents/sage-coordination-protocol/spec.md
 *
 * Suggests backlog item assignments to Game Master faces and detects convergence points.
 */

export type GameMasterFace = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'

export interface BacklogItemForCoordination {
  id: string
  name: string
  category: string
  dependencies: string
}

export interface AssignmentSuggestion {
  itemId: string
  suggestedOwner: GameMasterFace
  rationale: string
}

export interface ConvergenceGroup {
  itemIds: string[]
  suggestedOrder: string[]
  reason: string
}

export interface SageCoordinationSuggestions {
  assignments: AssignmentSuggestion[]
  convergenceGroups: ConvergenceGroup[]
}

/** Keyword sets per face — from agent-domain-backlog-ownership spec */
const FACE_KEYWORDS: Record<GameMasterFace, string[]> = {
  shaman: ['daemon', 'character', 'talisman', 'blessed', 'identity', 'ritual', 'mythic', 'belonging'],
  challenger: ['nation move', 'quest completion', 'show up', 'gameboard', 'action', 'edge', 'proving', 'validation'],
  regent: ['schema', 'playbook', 'campaign structure', 'rules', 'order', 'structure', 'roles', 'prisma'],
  architect: ['quest grammar', 'cyoa', 'character creation', 'compilation', 'strategy', 'blueprint', 'design'],
  diplomat: ['copy', 'community', 'campaign narrative', 'feedback', 'relational', 'care', 'connector'],
  sage: ['backlog coordination', 'deftness', 'cross-cutting', 'integration', 'meta', 'coordination'],
}

function scoreItemForFace(item: BacklogItemForCoordination, face: GameMasterFace): number {
  if (face === 'sage') return 0 // Sage is coordinator; rarely owns individual items
  const text = `${item.name} ${item.category} ${item.dependencies}`.toLowerCase()
  const keywords = FACE_KEYWORDS[face]
  let score = 0
  for (const kw of keywords) {
    if (text.includes(kw)) score += 1
  }
  return score
}

function suggestOwnerForItem(item: BacklogItemForCoordination): { face: GameMasterFace; rationale: string } {
  const faces: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat']
  let best: GameMasterFace = 'architect' // default
  let bestScore = 0
  const scores: Record<string, number> = {}
  for (const face of faces) {
    const s = scoreItemForFace(item, face)
    scores[face] = s
    if (s > bestScore) {
      bestScore = s
      best = face
    }
  }
  const rationale = bestScore > 0
    ? `Matches ${best} domain (${Object.entries(scores).filter(([, v]) => v > 0).map(([f, v]) => `${f}:${v}`).join(', ')})`
    : 'No strong domain match; default Architect'
  return { face: best, rationale }
}

/**
 * Suggest which face should own each open backlog item.
 * Uses keyword heuristic from agent-domain-backlog-ownership spec.
 */
export function getSageCoordinationSuggestions(
  backlogItems: BacklogItemForCoordination[]
): SageCoordinationSuggestions {
  const assignments: AssignmentSuggestion[] = backlogItems.map((item) => {
    const { face, rationale } = suggestOwnerForItem(item)
    return { itemId: item.id, suggestedOwner: face, rationale }
  })

  // Convergence detection: items that share dependencies
  const depToItems = new Map<string, string[]>()
  for (const item of backlogItems) {
    const deps = (item.dependencies || '')
      .split(/[,\s]+/)
      .map((d) => d.trim())
      .filter((d) => d && d !== '-')
    for (const dep of deps) {
      if (!depToItems.has(dep)) depToItems.set(dep, [])
      if (!depToItems.get(dep)!.includes(item.id)) depToItems.get(dep)!.push(item.id)
    }
  }

  const convergenceGroups: ConvergenceGroup[] = []
  const seen = new Set<string>()
  for (const [, itemIds] of depToItems) {
    if (itemIds.length < 2) continue
    const key = [...itemIds].sort().join(',')
    if (seen.has(key)) continue
    seen.add(key)
    convergenceGroups.push({
      itemIds,
      suggestedOrder: itemIds,
      reason: `Share dependencies; consider sequencing or parallel work`,
    })
  }

  return { assignments, convergenceGroups }
}
