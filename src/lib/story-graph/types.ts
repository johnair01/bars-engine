/** One directed edge in an adventure / CYOA graph. */
export type StoryGraphEdge = {
  fromId: string
  toId: string
  /** Choice label for admin messages (optional). */
  label?: string
}

export type StoryGraphValidationIssue = {
  code: 'DANGLING_TARGET' | 'EMPTY_TARGET' | 'MISSING_START' | 'UNKNOWN_START' | 'UNREACHABLE_NODE'
  message: string
  fromId?: string
  toId?: string
  nodeId?: string
}

export type ValidateDirectedGraphOptions = {
  /** If set, error when start is missing from nodeIds. */
  startId?: string | null
  /** If true (default), report nodes not reachable from startId as warnings-only issues. */
  reportUnreachable?: boolean
}

export type ValidateDirectedGraphResult = {
  ok: boolean
  errors: StoryGraphValidationIssue[]
  /** Non-blocking (e.g. unreachable passages). */
  warnings: StoryGraphValidationIssue[]
}
