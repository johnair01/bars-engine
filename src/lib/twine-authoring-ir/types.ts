/**
 * Twine Authoring IR types.
 * Structured representation for story nodes that compiles to .twee.
 * @see .specify/specs/twine-authoring-ir/spec.md
 */

export type IRNodeType = 'passage' | 'choice_node' | 'informational'

export interface IRChoice {
  text: string
  next_node: string
  tags?: string[]
}

export interface IRNode {
  node_id: string
  type: IRNodeType
  title?: string
  body: string | string[]
  choices?: IRChoice[]
  emits?: string[]
  tags?: string[]
  next_node?: string
  metadata?: Record<string, unknown>
}

export interface IRStoryMetadata {
  title?: string
  start_node?: string
}

export interface IRStory {
  story_metadata?: IRStoryMetadata
  story_nodes: IRNode[]
}
