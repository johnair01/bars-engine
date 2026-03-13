/**
 * Convert QuestPacket to Twee 3 format.
 * Produces a playable CYOA story from Epiphany Bridge nodes.
 * Emits moveMap in StoryData when present (for future runtime filtering).
 */

import type { SerializableQuestPacket, QuestNode, Choice } from './types'

function escapeTweeText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim()
}

function choicesToLinks(choices: Choice[]): string {
  if (choices.length === 0) return ''
  return choices.map((c) => `[[${c.text}|${c.targetId}]]`).join('\n')
}

/**
 * Convert QuestPacket to Twee 3 source string.
 */
export function questPacketToTwee(packet: SerializableQuestPacket, title?: string): string {
  const { nodes, startNodeId, moveMap } = packet
  const storyTitle = title ?? `Quest Grammar — ${packet.segmentVariant}`

  const storyData: Record<string, unknown> = {
    ifid: `quest-grammar-${Date.now()}`,
    format: 'SugarCube',
    'format-version': '2.36.1',
    start: startNodeId,
  }
  if (moveMap && Object.keys(moveMap).length > 0) {
    storyData.moveMap = moveMap
  }

  let twee = `:: StoryTitle\n${storyTitle}\n\n`
  twee += `:: StoryData\n${JSON.stringify(storyData, null, 2)}\n\n`

  const nodeIds = new Set(nodes.map((n) => n.id))
  const externalTargets = new Set<string>()
  for (const node of nodes) {
    for (const c of node.choices) {
      if (!nodeIds.has(c.targetId)) externalTargets.add(c.targetId)
    }
  }

  for (const node of nodes) {
    const links = choicesToLinks(node.choices)
    const body = links ? `${escapeTweeText(node.text)}\n\n${links}` : escapeTweeText(node.text)
    twee += `:: ${node.id}\n${body}\n\n`
  }

  for (const tid of externalTargets) {
    twee += `:: ${tid}\n[End — ${tid}]\n\n`
  }

  return twee
}
