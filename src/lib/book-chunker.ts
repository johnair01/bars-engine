/**
 * Chunk book text for AI analysis.
 * Splits by approximate token budget (~4 chars per token) to fit context windows.
 * Spec: .specify/specs/book-quest-targeted-extraction/spec.md — chunkBookTextWithToc adds section metadata.
 */
import type { BookToc } from './book-toc'

const CHARS_PER_CHUNK = 4000 // ~1000 tokens; leaves room for prompt + response
const OVERLAP_CHARS = 200 // Overlap to avoid cutting mid-sentence

export type TextChunk = {
  index: number
  text: string
  charStart: number
  charEnd: number
  sectionIndex?: number
  sectionTitle?: string
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

/**
 * Chunk book text with optional TOC metadata.
 * When toc is provided, each chunk gets sectionIndex and sectionTitle based on char range.
 */
export function chunkBookTextWithToc(text: string, toc?: BookToc | null): TextChunk[] {
  const chunks = chunkBookText(text)
  if (!toc?.entries?.length) return chunks

  return chunks.map((chunk) => {
    const chunkMid = Math.floor((chunk.charStart + chunk.charEnd) / 2)
    const section = toc.entries.find(
      (e) => chunkMid >= e.charStart && chunkMid <= e.charEnd
    )
    if (section) {
      return {
        ...chunk,
        sectionIndex: toc.entries.indexOf(section),
        sectionTitle: section.title,
      }
    }
    // Chunk is outside TOC region (body content): use last entry that starts before chunk
    const prevSection = toc.entries
      .filter((e) => e.charStart <= chunk.charStart)
      .pop()
    return {
      ...chunk,
      sectionIndex: prevSection ? toc.entries.indexOf(prevSection) : 0,
      sectionTitle: prevSection?.title ?? toc.entries[0]?.title ?? undefined,
    }
  })
}
