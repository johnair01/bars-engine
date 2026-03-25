import type { StoryGraphEdge, StoryGraphValidationIssue, ValidateDirectedGraphOptions, ValidateDirectedGraphResult } from './types'

/**
 * Validates a directed graph: every edge's `toId` must exist in `nodeIds`,
 * except targets allowed by `isTargetAllowed` (e.g. signup shortcuts).
 */
export function validateDirectedGraph(
  nodeIds: ReadonlySet<string>,
  edges: StoryGraphEdge[],
  options: ValidateDirectedGraphOptions & {
    isTargetAllowed?: (toId: string) => boolean
  } = {}
): ValidateDirectedGraphResult {
  const errors: StoryGraphValidationIssue[] = []
  const warnings: StoryGraphValidationIssue[] = []
  const { startId, reportUnreachable = true } = options
  const isTargetAllowed = options.isTargetAllowed ?? (() => false)

  for (const e of edges) {
    const to = e.toId?.trim() ?? ''
    if (!to) {
      errors.push({
        code: 'EMPTY_TARGET',
        message: `Choice from "${e.fromId}" has an empty target.`,
        fromId: e.fromId,
      })
      continue
    }
    if (!nodeIds.has(to) && !isTargetAllowed(to)) {
      errors.push({
        code: 'DANGLING_TARGET',
        message: `No passage for target "${to}" (from "${e.fromId}"${e.label ? ` — "${e.label}"` : ''}). Create that passage or pick an existing node id.`,
        fromId: e.fromId,
        toId: to,
      })
    }
  }

  if (startId?.trim()) {
    const s = startId.trim()
    if (!nodeIds.has(s) && !isTargetAllowed(s)) {
      errors.push({
        code: 'UNKNOWN_START',
        message: `Start node "${s}" is not in this adventure's passages.`,
        nodeId: s,
      })
    } else if (reportUnreachable && nodeIds.size > 0) {
      const reachable = collectReachableFrom(s, edges, isTargetAllowed, nodeIds)
      for (const id of nodeIds) {
        if (!reachable.has(id)) {
          warnings.push({
            code: 'UNREACHABLE_NODE',
            message: `Passage "${id}" is not reachable from start "${s}".`,
            nodeId: id,
          })
        }
      }
    }
  } else if (startId !== undefined && startId !== null && !String(startId).trim()) {
    errors.push({
      code: 'MISSING_START',
      message: 'Adventure has no start node id set.',
    })
  }

  return { ok: errors.length === 0, errors, warnings }
}

function collectReachableFrom(
  start: string,
  edges: StoryGraphEdge[],
  isTargetAllowed: (toId: string) => boolean,
  nodeIds: ReadonlySet<string>
): Set<string> {
  const reachable = new Set<string>()
  if (nodeIds.has(start)) reachable.add(start)

  const byFrom = new Map<string, StoryGraphEdge[]>()
  for (const e of edges) {
    const list = byFrom.get(e.fromId) ?? []
    list.push(e)
    byFrom.set(e.fromId, list)
  }

  const queue: string[] = nodeIds.has(start) ? [start] : []
  while (queue.length > 0) {
    const id = queue.pop()!
    const outs = byFrom.get(id) ?? []
    for (const e of outs) {
      const to = e.toId.trim()
      if (!to || !nodeIds.has(to)) {
        if (isTargetAllowed(to)) continue
        continue
      }
      if (!reachable.has(to)) {
        reachable.add(to)
        queue.push(to)
      }
    }
  }
  return reachable
}
