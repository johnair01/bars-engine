/**
 * Compile IR nodes to Twee 3 (SugarCube) format.
 * @see .specify/specs/twine-authoring-ir/spec.md
 */

import type { IRNode, IRStoryMetadata } from './types'

function escapeTweeText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim()
}

function bodyToString(body: string | string[]): string {
  if (Array.isArray(body)) {
    return body.map((p) => escapeTweeText(p)).join('\n\n')
  }
  return escapeTweeText(body)
}

function choicesToLinks(choices: IRNode['choices']): string {
  if (!choices || choices.length === 0) return ''
  return choices.map((c) => `[[${c.text}|${c.next_node}]]`).join('\n')
}

function emitsToMacros(emits: string[] | undefined): string {
  if (!emits || emits.length === 0) return ''
  return emits.map((e) => `<<run emitEvent("${e}")>>`).join('\n')
}

/**
 * Compile IR nodes to valid .twee source.
 */
export function irToTwee(
  nodes: IRNode[],
  options?: { title?: string; startNode?: string }
): string {
  const title = options?.title ?? 'IR Story'
  const startNode = options?.startNode ?? nodes[0]?.node_id ?? 'Start'

  const storyData: Record<string, unknown> = {
    ifid: `ir-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    format: 'SugarCube',
    'format-version': '2.36.1',
    start: startNode,
  }

  let twee = `:: StoryTitle\n${title}\n\n`
  twee += `:: StoryData\n${JSON.stringify(storyData, null, 2)}\n\n`

  const nodeIds = new Set(nodes.map((n) => n.node_id))
  const externalTargets = new Set<string>()

  for (const node of nodes) {
    for (const c of node.choices ?? []) {
      if (!nodeIds.has(c.next_node)) externalTargets.add(c.next_node)
    }
    if (node.next_node && !nodeIds.has(node.next_node)) {
      externalTargets.add(node.next_node)
    }
  }

  for (const node of nodes) {
    const bodyText = bodyToString(node.body)
    const links = choicesToLinks(node.choices)
    const emitsBlock = emitsToMacros(node.emits)

    let passage = bodyText
    if (links) passage += '\n\n' + links
    if (node.next_node && !node.choices?.length) {
      passage += '\n\n[[Continue|' + node.next_node + ']]'
    }
    if (emitsBlock) passage += '\n\n' + emitsBlock

    twee += `:: ${node.node_id}\n${passage}\n\n`
  }

  for (const tid of externalTargets) {
    twee += `:: ${tid}\n[End — ${tid}]\n\n`
  }

  return twee
}
