/**
 * Twee (Twee 3) serializer for passage-level edits.
 * Used by Admin Onboarding Passage Edit to replace individual passages.
 */

export interface PassageLink {
  label: string
  target: string
}

/**
 * Serialize a passage to a Twee block string.
 * Format: :: Name [tags]\nbody\n\n[[label|target]]...
 */
export function serializePassageToBlock(
  name: string,
  tags: string[],
  body: string,
  links: PassageLink[]
): string {
  const tagStr = tags.length > 0 ? ` [${tags.join(' ')}]` : ''
  const header = `:: ${name}${tagStr}`
  const bodyTrimmed = body.trim()
  const linksStr = links
    .map((l) => `[[${l.label}|${l.target}]]`)
    .join('\n')
  const content = linksStr ? `${bodyTrimmed}\n\n${linksStr}` : bodyTrimmed
  return `${header}\n${content}\n\n`
}

/**
 * Extract passage name from header line (handles optional [tags]).
 */
function passageNameFromHeader(headerContent: string): string {
  const bracketMatch = headerContent.match(/^(.+?)\s+\[([^\]]*)\]$/)
  return bracketMatch ? bracketMatch[1].trim() : headerContent.trim()
}

/**
 * Find the start and end indices of a passage block in the twee source.
 * Returns [start, end] (end exclusive) or null if not found.
 */
function findPassageBlockIndices(tweeSource: string, passageId: string): [number, number] | null {
  const lines = tweeSource.split(/\r?\n/)
  let passageStart = -1
  let passageEnd = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/^::\s+(.+)$/)
    if (match) {
      const name = passageNameFromHeader(match[1])
      if (passageStart >= 0) {
        passageEnd = i
        break
      }
      if (name === passageId) {
        passageStart = i
      }
    }
  }

  if (passageStart < 0) return null
  if (passageEnd < 0) passageEnd = lines.length

  const startIdx = lines.slice(0, passageStart).join('\n').length
  const endIdx = lines.slice(0, passageEnd).join('\n').length
  return [startIdx, endIdx]
}

/**
 * Replace a passage block in the twee source.
 * Preserves StoryTitle, StoryData, and all other passages.
 */
export function replacePassageInTwee(
  tweeSource: string,
  passageId: string,
  newBlock: string
): string {
  const indices = findPassageBlockIndices(tweeSource, passageId)
  if (!indices) {
    throw new Error(`Passage not found: ${passageId}`)
  }
  const [start, end] = indices
  return tweeSource.slice(0, start) + newBlock + tweeSource.slice(end)
}
