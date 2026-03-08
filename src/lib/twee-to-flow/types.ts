/**
 * Flow grammar types for .twee → Flow translation.
 * Compatible with quest-bar-flow-grammar and flow-simulator-contract.
 */

export type FlowNodeType =
  | 'introduction'
  | 'prompt'
  | 'choice'
  | 'action'
  | 'BAR_capture'
  | 'BAR_validation'
  | 'quest_progress'
  | 'completion'
  | 'handoff'

export interface FlowAction {
  type: string
  requires?: string[]
  emits?: string[]
  next_node_id: string | null
  label?: string
}

export interface FlowNode {
  id: string
  type: FlowNodeType
  copy: string
  actions: FlowAction[]
  conditions?: Array<{ type: string; source?: string }>
  emits?: string[]
  target_ref?: string
}

export interface CompletionCondition {
  type: string
  node_id?: string
}

export interface FlowOutput {
  flow_id: string
  campaign_id: string
  start_node_id: string
  nodes: FlowNode[]
  completion_conditions: CompletionCondition[]
  expected_events: string[]
}

/** Enriched passage with parsed [TOKEN] and {{INPUT}} metadata. */
export interface EnrichedPassage {
  name: string
  text: string
  cleanText: string
  tags: string[]
  links: Array<{ label: string; target: string }>
  tokenSets: Record<string, string>
  hasInputBarContent: boolean
}
