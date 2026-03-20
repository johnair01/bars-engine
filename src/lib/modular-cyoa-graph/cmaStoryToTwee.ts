/**
 * Compile CMA v0 graph → Twee 3 (SugarCube) for preview/export.
 * @see .specify/specs/cyoa-modular-charge-authoring/ADR-cma-v0.md
 */

import type { CmaEdge, CmaNode, CmaStory } from './types'

function escapePassageName(id: string): string {
  return id.replace(/\r?\n/g, ' ').trim() || 'Passage'
}

function nodeBody(node: CmaNode): string {
  const head = node.title?.trim() || node.id
  const kindNote =
    node.kind === 'end'
      ? '\n\n*(End of this path.)*'
      : `\n\n_(${node.kind} — add prose in editor or AI fill.)_`
  return `${head}${kindNote}`.trim()
}

function edgesFrom(story: CmaStory, nodeId: string): CmaEdge[] {
  return story.edges.filter((e) => e.from === nodeId)
}

/**
 * Build Twee source. Does not validate — run `validateQuestGraph` first for author-time checks.
 */
export function cmaStoryToTwee(
  story: CmaStory,
  options?: { title?: string }
): string {
  const title = options?.title ?? story.id ?? 'CMA modular story'
  const start = escapePassageName(story.startId)
  const nodeById = new Map(story.nodes.map((n) => [n.id, n]))

  const storyData: Record<string, unknown> = {
    ifid: `cma-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    format: 'SugarCube',
    'format-version': '2.36.1',
    start,
  }

  let twee = `:: StoryTitle\n${title}\n\n`
  twee += `:: StoryData\n${JSON.stringify(storyData, null, 2)}\n\n`

  const known = new Set(story.nodes.map((n) => n.id))
  const referenced = new Set<string>()

  for (const node of story.nodes) {
    const pid = escapePassageName(node.id)
    const outs = edgesFrom(story, node.id)
    let passage = nodeBody(node)

    if (outs.length === 1) {
      const e = outs[0]
      const target = escapePassageName(e.to)
      referenced.add(e.to)
      const linkLabel = (e.label ?? (node.kind === 'choice' ? 'Continue' : 'Next')).replace(/\|/g, '')
      passage += `\n\n[[${linkLabel}|${target}]]`
    } else if (outs.length >= 2) {
      const lines = outs.map((e) => {
        referenced.add(e.to)
        const target = escapePassageName(e.to)
        const linkLabel = (e.label ?? target).replace(/\|/g, '').replace(/\]/g, '')
        return `[[${linkLabel}|${target}]]`
      })
      passage += '\n\n' + lines.join('\n')
    }

    twee += `:: ${pid}\n${passage}\n\n`
  }

  for (const id of referenced) {
    if (!known.has(id)) {
      twee += `:: ${escapePassageName(id)}\n[Stub — missing node **${id}** in CMA graph]\n\n`
    }
  }

  return twee
}
