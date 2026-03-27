import type { StoryGraphEdge } from './types'
import { isCampaignReaderSpecialTarget } from './campaign-reader-special-targets'
import { validateDirectedGraph } from './validateDirectedGraph'

export type PassageRowInput = {
  nodeId: string
  choicesJson: string
}

export function parsePassageChoicesJson(choicesJson: string): { text: string; targetId: string }[] {
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
    merged.set(id, parsePassageChoicesJson(r.choicesJson))
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

/** All passages as stored — for admin graph map and full-graph validation. */
export function buildFullAdventureGraph(rows: PassageRowInput[]): {
  nodeIds: Set<string>
  edges: StoryGraphEdge[]
} {
  const nodeIds = new Set<string>()
  const edges: StoryGraphEdge[] = []
  for (const r of rows) {
    const id = r.nodeId.trim()
    if (!id) continue
    nodeIds.add(id)
  }
  for (const r of rows) {
    const fromId = r.nodeId.trim()
    if (!fromId) continue
    for (const c of parsePassageChoicesJson(r.choicesJson)) {
      const to = c.targetId?.trim() ?? ''
      if (!to) continue
      edges.push({ fromId, toId: to, label: c.text?.trim() || undefined })
    }
  }
  return { nodeIds, edges }
}

export function validateFullAdventurePassagesGraph(
  rows: PassageRowInput[],
  startNodeId: string | null | undefined
) {
  const { nodeIds, edges } = buildFullAdventureGraph(rows)
  return validateDirectedGraph(nodeIds, edges, {
    startId: startNodeId,
    reportUnreachable: true,
    isTargetAllowed: isCampaignReaderSpecialTarget,
  })
}

export type PassageNodeGraphSummary = {
  nodeId: string
  choiceCount: number
  brokenOutgoingCount: number
  inDegree: number
}

/**
 * Per-node stats + full-graph validation for admin “node map” (UGA Phase 2).
 */
export function summarizeAdventurePassageGraph(
  rows: PassageRowInput[],
  startNodeId: string | null | undefined
): {
  nodes: PassageNodeGraphSummary[]
  validation: ReturnType<typeof validateDirectedGraph>
} {
  const { nodeIds, edges } = buildFullAdventureGraph(rows)
  const validation = validateDirectedGraph(nodeIds, edges, {
    startId: startNodeId,
    reportUnreachable: true,
    isTargetAllowed: isCampaignReaderSpecialTarget,
  })

  const inDegree = new Map<string, number>()
  for (const id of nodeIds) inDegree.set(id, 0)
  for (const e of edges) {
    const to = e.toId.trim()
    if (nodeIds.has(to)) {
      inDegree.set(to, (inDegree.get(to) ?? 0) + 1)
    }
  }

  const nodes: PassageNodeGraphSummary[] = []
  for (const r of rows) {
    const id = r.nodeId.trim()
    if (!id) continue
    const choices = parsePassageChoicesJson(r.choicesJson)
    let brokenOutgoingCount = 0
    for (const c of choices) {
      const t = c.targetId?.trim() ?? ''
      if (!t) {
        brokenOutgoingCount++
        continue
      }
      if (!nodeIds.has(t) && !isCampaignReaderSpecialTarget(t)) {
        brokenOutgoingCount++
      }
    }
    nodes.push({
      nodeId: id,
      choiceCount: choices.length,
      brokenOutgoingCount,
      inDegree: inDegree.get(id) ?? 0,
    })
  }
  nodes.sort((a, b) => a.nodeId.localeCompare(b.nodeId))
  return { nodes, validation }
}

/** Simulate DB state after admin “create passage” + optional linkFrom wiring. */
export function simulateRowsAfterCreatePassage(
  existingRows: PassageRowInput[],
  newNodeId: string,
  newChoicesJson: string,
  linkFrom: { mode: 'after' | 'branch'; sourceNodeId: string; choiceIndex?: number } | null
): PassageRowInput[] {
  const trimmedNew = newNodeId.trim()
  const rows: PassageRowInput[] = existingRows.map((r) => ({
    nodeId: r.nodeId,
    choicesJson: r.choicesJson,
  }))
  rows.push({ nodeId: trimmedNew, choicesJson: newChoicesJson })

  if (!linkFrom) return rows

  const src = linkFrom.sourceNodeId.trim()
  const idx = rows.findIndex((r) => r.nodeId.trim() === src)
  if (idx < 0) return rows

  let choices = parsePassageChoicesJson(rows[idx].choicesJson)
  if (linkFrom.mode === 'after') {
    const has = choices.some((c) => c.targetId.trim() === trimmedNew)
    if (!has) {
      choices = [...choices, { text: 'Continue', targetId: trimmedNew }]
    }
  } else if (linkFrom.mode === 'branch' && typeof linkFrom.choiceIndex === 'number') {
    if (linkFrom.choiceIndex >= 0 && linkFrom.choiceIndex < choices.length) {
      choices = choices.map((c, i) =>
        i === linkFrom.choiceIndex ? { ...c, targetId: trimmedNew } : c
      )
    }
  }
  rows[idx] = { nodeId: rows[idx].nodeId, choicesJson: JSON.stringify(choices) }
  return rows
}
