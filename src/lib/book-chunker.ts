/**
 * Chunk book text for AI analysis.
 * Splits by approximate token budget (~4 chars per token) to fit context windows.
 */
const CHARS_PER_CHUNK = 4000 // ~1000 tokens; leaves room for prompt + response
const OVERLAP_CHARS = 200 // Overlap to avoid cutting mid-sentence

export type TextChunk = {
  index: number
  text: string
  charStart: number
  charEnd: number
}

/**
 * Split text into chunks suitable for AI analysis.
 * Tries to break at paragraph boundaries when possible.
 */
export function chunkBookText(text: string): TextChunk[] {
  if (!text || text.trim().length === 0) return []

  const chunks: TextChunk[] = []
  let start = 0
  let index = 0

  while (start < text.length) {
    let end = Math.min(start + CHARS_PER_CHUNK, text.length)
    let chunkText = text.slice(start, end)

    // If not at end, try to break at paragraph boundary
    if (end < text.length) {
      const lastPara = chunkText.lastIndexOf('\n\n')
      const lastNewline = chunkText.lastIndexOf('\n')
      const breakPoint = lastPara >= OVERLAP_CHARS ? lastPara : lastNewline >= OVERLAP_CHARS ? lastNewline : -1
      if (breakPoint > 0) {
        end = start + breakPoint + 1
        chunkText = text.slice(start, end)
      }
    }

    chunks.push({
      index,
      text: chunkText.trim(),
      charStart: start,
      charEnd: end,
    })

    index++
    start = end - (end < text.length ? OVERLAP_CHARS : 0)
    if (start >= text.length) break
  }

  return chunks
}
