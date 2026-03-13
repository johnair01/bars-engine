/**
 * Creation Quest Bootstrap — Assemble Artifact
 *
 * Deterministic assembly: nodes → Passage-like records or Twine export.
 * No AI. See .specify/specs/creation-quest-bootstrap/spec.md
 */

import type { CreationQuestNode, AssembleInputs, Artifact } from './types'

/**
 * Assemble creation quest nodes into artifact format.
 * Supports 'passages' (DB-ready) and 'twee' (Twine export).
 */
export function assembleArtifact(creationType: string, inputs: AssembleInputs): Artifact {
  const { nodes } = inputs

  if (creationType === 'twee') {
    const lines: string[] = [':: Start', 'Your creation quest begins.']
    for (const node of nodes) {
      lines.push(`\n:: ${node.id}`)
      lines.push(node.text)
      if (node.choices?.length) {
        for (const c of node.choices) {
          lines.push(`[[${c.text}|${c.targetId}]]`)
        }
      }
    }
    return { type: 'twee', content: lines.join('\n') }
  }

  // Default: passages
  const passages = nodes.map((node) => ({
    nodeId: node.id,
    text: node.text,
    choices: node.choices ?? [],
  }))
  return { type: 'passages', passages }
}
