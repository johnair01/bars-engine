/**
 * Story Map — fetch Adventure graph data for visualization.
 * Spec: .specify/specs/story-quest-map-exploration/spec.md (Map A)
 */

import { db } from '@/lib/db'

export type StoryMapNode = {
  id: string
  nodeId: string
  text: string
  isStart: boolean
  isCurrent: boolean
}

export type StoryMapEdge = {
  id: string
  source: string
  target: string
  label?: string
}

export type StoryMapData = {
  adventureId: string
  adventureTitle: string
  startNodeId: string
  currentNodeId: string | null
  nodes: StoryMapNode[]
  edges: StoryMapEdge[]
}

/** Parse Passage.choices JSON. Returns [{ text, targetId }]. */
function parseChoices(choicesJson: string): { text: string; targetId: string }[] {
  try {
    const arr = JSON.parse(choicesJson || '[]')
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (c): c is { text: string; targetId: string } =>
        c && typeof c.text === 'string' && typeof c.targetId === 'string'
    )
  } catch {
    return []
  }
}

/**
 * Fetch Adventure + Passages + PlayerAdventureProgress and build graph.
 */
export async function getStoryMapData(
  adventureId: string,
  playerId: string | null
): Promise<StoryMapData | null> {
  const adventure = await db.adventure.findUnique({
    where: { id: adventureId, status: 'ACTIVE' },
    include: { passages: true },
  })
  if (!adventure) return null

  const progress =
    playerId != null
      ? await db.playerAdventureProgress.findUnique({
          where: { playerId_adventureId: { playerId, adventureId } },
          select: { currentNodeId: true },
        })
      : null

  const startNodeId = adventure.startNodeId ?? adventure.passages[0]?.nodeId ?? 'Start'
  const currentNodeId = progress?.currentNodeId ?? null

  const passageMap = new Map(adventure.passages.map((p) => [p.nodeId, p]))
  const nodeIds = new Set(adventure.passages.map((p) => p.nodeId))

  const nodes: StoryMapNode[] = adventure.passages.map((p) => ({
    id: p.nodeId,
    nodeId: p.nodeId,
    text: p.text.replace(/\s+/g, ' ').slice(0, 80) + (p.text.length > 80 ? '…' : ''),
    isStart: p.nodeId === startNodeId,
    isCurrent: p.nodeId === currentNodeId,
  }))

  const edgeIds = new Set<string>()
  const edges: StoryMapEdge[] = []

  for (const p of adventure.passages) {
    const choices = parseChoices(p.choices)
    for (let i = 0; i < choices.length; i++) {
      const c = choices[i]
      if (!nodeIds.has(c.targetId)) continue
      const edgeId = `${p.nodeId}->${c.targetId}-${i}`
      if (edgeIds.has(edgeId)) continue
      edgeIds.add(edgeId)
      edges.push({
        id: edgeId,
        source: p.nodeId,
        target: c.targetId,
        label: c.text.slice(0, 30) + (c.text.length > 30 ? '…' : ''),
      })
    }
  }

  return {
    adventureId: adventure.id,
    adventureTitle: adventure.title,
    startNodeId,
    currentNodeId,
    nodes,
    edges,
  }
}
