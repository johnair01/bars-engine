/**
 * Structural validation for CMA v0 quest graphs (strand falsification tests).
 * @see .specify/specs/cyoa-modular-charge-authoring/ADR-cma-v0.md
 */

import type { CmaNodeKind, CmaStory } from './types'

export type QuestGraphValidationCode =
  | 'MISSING_START'
  | 'UNKNOWN_START'
  | 'DUPLICATE_NODE_ID'
  | 'INVALID_EDGE_REFERENCE'
  | 'NO_END'
  | 'UNREACHABLE_END'
  | 'CHOICE_SINGLE_ARM'
  | 'COASTER_SEQUENCE_BREAK'

export interface QuestGraphIssue {
  code: QuestGraphValidationCode
  message: string
  nodeId?: string
  edgeId?: string
}

export interface ValidateQuestGraphResult {
  ok: boolean
  errors: QuestGraphIssue[]
}

const KIND_SET: Set<CmaNodeKind> = new Set([
  'scene',
  'choice',
  'metabolize',
  'commit',
  'branch_guard',
  'merge',
  'end',
])

function collectReachableFromStart(story: CmaStory): Set<string> {
  const reachable = new Set<string>()
  const queue: string[] = []
  if (story.startId) {
    queue.push(story.startId)
    reachable.add(story.startId)
  }
  const byFrom = new Map<string, typeof story.edges>()
  for (const e of story.edges) {
    const list = byFrom.get(e.from) ?? []
    list.push(e)
    byFrom.set(e.from, list)
  }
  while (queue.length > 0) {
    const id = queue.pop()!
    const outs = byFrom.get(id) ?? []
    for (const e of outs) {
      if (!reachable.has(e.to)) {
        reachable.add(e.to)
        queue.push(e.to)
      }
    }
  }
  return reachable
}

/**
 * Validates a CMA v0 story graph.
 * - NO_END: at least one node with kind `end`
 * - UNREACHABLE_END: every `end` reachable from `startId`
 * - CHOICE_SINGLE_ARM: every `choice` has ≥ 2 outgoing edges
 */
export function validateQuestGraph(story: CmaStory): ValidateQuestGraphResult {
  const errors: QuestGraphIssue[] = []

  if (!story.startId?.trim()) {
    errors.push({
      code: 'MISSING_START',
      message: 'Story needs a startId — this piece doesn’t have an entry yet.',
    })
    return { ok: false, errors }
  }

  const nodeById = new Map<string, (typeof story.nodes)[0]>()
  for (const n of story.nodes) {
    if (!n?.id?.trim()) continue
    if (nodeById.has(n.id)) {
      errors.push({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node id "${n.id}". Each block needs a unique name.`,
        nodeId: n.id,
      })
    } else {
      nodeById.set(n.id, n)
      if (!KIND_SET.has(n.kind)) {
        errors.push({
          code: 'INVALID_EDGE_REFERENCE',
          message: `Node "${n.id}" has unknown kind "${String(n.kind)}".`,
          nodeId: n.id,
        })
      }
    }
  }

  if (!nodeById.has(story.startId)) {
    errors.push({
      code: 'UNKNOWN_START',
      message: `startId "${story.startId}" does not match any node.`,
      nodeId: story.startId,
    })
  }

  for (const e of story.edges) {
    if (!nodeById.has(e.from)) {
      errors.push({
        code: 'INVALID_EDGE_REFERENCE',
        message: `Edge "${e.id}" starts at unknown node "${e.from}".`,
        edgeId: e.id,
        nodeId: e.from,
      })
    }
    if (!nodeById.has(e.to)) {
      errors.push({
        code: 'INVALID_EDGE_REFERENCE',
        message: `Edge "${e.id}" points to unknown node "${e.to}".`,
        edgeId: e.id,
        nodeId: e.to,
      })
    }
  }

  const endNodes = story.nodes.filter((n) => n.kind === 'end')
  if (endNodes.length === 0) {
    errors.push({
      code: 'NO_END',
      message:
        'Stories need a landing — add an **End** block so readers know the path completes.',
    })
  }

  const outgoingCount = new Map<string, number>()
  for (const e of story.edges) {
    outgoingCount.set(e.from, (outgoingCount.get(e.from) ?? 0) + 1)
  }

  for (const n of story.nodes) {
    if (n.kind !== 'choice') continue
    const count = outgoingCount.get(n.id) ?? 0
    if (count < 2) {
      errors.push({
        code: 'CHOICE_SINGLE_ARM',
        message: `Choice "${n.id}" needs at least two paths — add another door or connect this as a linear scene.`,
        nodeId: n.id,
      })
    }
  }

  if (errors.some((e) => e.code === 'UNKNOWN_START' || e.code === 'INVALID_EDGE_REFERENCE')) {
    return { ok: false, errors }
  }

  const reachable = collectReachableFromStart(story)
  for (const end of endNodes) {
    if (!reachable.has(end.id)) {
      errors.push({
        code: 'UNREACHABLE_END',
        message: `End "${end.id}" isn’t reachable from the start — connect a path so readers can arrive here.`,
        nodeId: end.id,
      })
    }
  }

  return { ok: errors.length === 0, errors }
}

/**
 * Validates that the story follows a "grammatical" coaster arc.
 * Mandatory Sequence: LIFT -> DROP -> INVERSION -> BRAKE -> STATION
 */
export function validateCoasterAesthetics(story: CmaStory): ValidateQuestGraphResult {
  const errors: QuestGraphIssue[] = []
  const nodes = story.nodes

  const hasTag = (tag: string) => nodes.some(n => {
    const coasterTag = (n.metadata as any)?.coasterTag || n.id
    return coasterTag.toUpperCase().includes(tag)
  })

  const requiredTags = ['LIFT', 'DROP', 'INVERSION', 'BRAKE', 'STATION']
  for (const tag of requiredTags) {
    if (!hasTag(tag)) {
      errors.push({
        code: 'COASTER_SEQUENCE_BREAK',
        message: `Grammar Error: Missing **${tag}** phase. Every adventure needs a LIFT, DROP, INVERSION, BRAKE, and STATION to be grammatical.`
      })
    }
  }

  // TODO: More complex sequence path validation if needed for M1

  return { ok: errors.length === 0, errors }
}
