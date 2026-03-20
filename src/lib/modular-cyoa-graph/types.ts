/**
 * CYOA Modular Authoring (CMA) v0 — intermediate representation.
 * @see .specify/specs/cyoa-modular-charge-authoring/ADR-cma-v0.md
 */

export const CMA_NODE_KINDS = [
  'scene',
  'choice',
  'metabolize',
  'commit',
  'branch_guard',
  'merge',
  'end',
] as const

export type CmaNodeKind = (typeof CMA_NODE_KINDS)[number]

export interface CmaEdge {
  id: string
  from: string
  to: string
  label?: string
}

export interface CmaNode {
  id: string
  kind: CmaNodeKind
  title?: string
  metadata?: Record<string, unknown>
}

export interface CmaFragment {
  id: string
  title?: string
  nodes: CmaNode[]
  edges: CmaEdge[]
  /** Entry when subgraph is inlined or referenced */
  entryNodeId: string
}

export interface CmaStory {
  id?: string
  startId: string
  nodes: CmaNode[]
  edges: CmaEdge[]
  fragments?: CmaFragment[]
}
