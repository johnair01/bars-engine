/**
 * Map CMA v0 graph → Twine authoring IR (`IRNode[]`) for shared compile / validation paths.
 * @see .specify/specs/cyoa-modular-charge-authoring/ADR-cma-v0.md
 * @see .specify/specs/twine-authoring-ir/spec.md
 */

import type { IRChoice, IRNode, IRNodeType } from '@/lib/twine-authoring-ir/types'

import type { CmaEdge, CmaNode, CmaStory } from './types'

/** Body text shown in Twine for a CMA node (title + kind hint). Exported for tests / charge bridge copy. */
export function cmaNodeToIrBody(node: CmaNode): string {
  const head = node.title?.trim() || node.id
  const kindNote =
    node.kind === 'end'
      ? '\n\n*(End of this path.)*'
      : `\n\n_(${node.kind} — add prose in editor or AI fill.)_`
  return `${head}${kindNote}`.trim()
}

function irTypeForCmaKind(kind: CmaNode['kind']): IRNodeType {
  if (kind === 'choice') return 'choice_node'
  return 'passage'
}

function outgoingEdges(story: CmaStory, nodeId: string): CmaEdge[] {
  return story.edges.filter((e) => e.from === nodeId)
}

function sanitizeLinkLabel(raw: string): string {
  return raw.replace(/\|/g, '').replace(/\]/g, '').trim() || '…'
}

function edgesToIrChoices(
  node: CmaNode,
  outs: CmaEdge[]
): IRChoice[] | undefined {
  if (outs.length === 0) return undefined
  if (outs.length === 1) {
    const e = outs[0]
    const fallback = node.kind === 'choice' ? 'Continue' : 'Next'
    const text = sanitizeLinkLabel(e.label ?? fallback)
    return [{ text, next_node: e.to }]
  }
  return outs.map((e) => ({
    text: sanitizeLinkLabel(e.label ?? e.to),
    next_node: e.to,
  }))
}

/**
 * Flatten a `CmaStory` into IR nodes (fragments are not expanded in v0).
 */
export function cmaStoryToIrNodes(story: CmaStory): IRNode[] {
  return story.nodes.map((node) => {
    const outs = outgoingEdges(story, node.id)
    const ir: IRNode = {
      node_id: node.id,
      type: irTypeForCmaKind(node.kind),
      body: cmaNodeToIrBody(node),
      metadata: { cmaKind: node.kind, ...(node.metadata ?? {}) },
    }
    if (node.title) ir.title = node.title
    const choices = edgesToIrChoices(node, outs)
    if (choices?.length) ir.choices = choices
    return ir
  })
}
