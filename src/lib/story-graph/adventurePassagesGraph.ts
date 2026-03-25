import type { StoryGraphEdge } from './types'
import { isCampaignReaderSpecialTarget } from './campaign-reader-special-targets'
import { validateDirectedGraph } from './validateDirectedGraph'

export type PassageRowInput = {
  nodeId: string
  choicesJson: string
}

function parseChoices(choicesJson: string): { text: string; targetId: string }[] {
  try {
    const raw = JSON.parse(choicesJson) as unknown
    if (!Array.isArray(raw)) return []
    const out: { text: string; targetId: string }[] = []
    for (const c of raw) {
      if (c && typeof c === 'object' && 'targetId' in c && typeof (c as { targetId: unknown }).targetId === 'string') {
        const text = typeof (c as { text?: unknown }).text === 'string' ? (c as { text: string }).text : ''
        out.push({ text, targetId: (c as { targetId: string }).targetId })
      }
    }
    return out
  } catch {
    return []
  }
}

/**
 * Build edges and node id set as if `upsertNodeId` were saved with `newChoices`.
 */
export function buildAdventureGraphModel(
  rows: PassageRowInput[],
  upsertNodeId: string,
  newChoices: { text: string; targetId: string }[]
): { nodeIds: Set<string>; edges: StoryGraphEdge[] } {
  const nodeIds = new Set<string>()
  const edges: StoryGraphEdge[] = []

  const upsertTrim = upsertNodeId.trim()
  const merged = new Map<string, { text: string; targetId: string }[]>()

  for (const r of rows) {
    const id = r.nodeId.trim()
    if (!id) continue
    nodeIds.add(id)
    if (id === upsertTrim) continue
    merged.set(id, parseChoices(r.choicesJson))
  }
  merged.set(upsertTrim, newChoices)

  if (!nodeIds.has(upsertTrim)) {
    nodeIds.add(upsertTrim)
  }

  for (const [fromId, choices] of merged) {
    for (const c of choices) {
      const to = c.targetId?.trim() ?? ''
      if (!to) continue
      edges.push({ fromId, toId: to, label: c.text?.trim() || undefined })
    }
  }

  return { nodeIds, edges }
}

/**
 * Validates post-upsert graph for a campaign adventure (dangling targets + optional reachability).
 */
export function validateAdventurePassagesGraph(
  rows: PassageRowInput[],
  upsertNodeId: string,
  newChoices: { text: string; targetId: string }[],
  startNodeId: string | null | undefined
) {
  const { nodeIds, edges } = buildAdventureGraphModel(rows, upsertNodeId, newChoices)
  return validateDirectedGraph(nodeIds, edges, {
    startId: startNodeId,
    reportUnreachable: true,
    isTargetAllowed: isCampaignReaderSpecialTarget,
  })
}
