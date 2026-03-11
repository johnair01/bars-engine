/**
 * Table of contents extraction from book text.
 * Spec: .specify/specs/book-quest-targeted-extraction/spec.md
 *
 * Parses first ~8000 chars for common TOC patterns: Chapter N, Part I, 1. Title, etc.
 */

const TOC_SEARCH_LIMIT = 8000

export type TocLevel = 'part' | 'chapter' | 'section'

export interface TocEntry {
  title: string
  level: TocLevel
  charStart: number
  charEnd: number
  pageHint?: number
}

export interface BookToc {
  entries: TocEntry[]
  extractedAt: string
  method: 'heuristic' | 'ai_refined'
}

/** Regex patterns for TOC detection. Order matters: more specific first. */
const TOC_PATTERNS: Array<{
  regex: RegExp
  level: TocLevel
  captureTitle: boolean
}> = [
  // Chapter N: Title or Chapter N - Title
  { regex: /^Chapter\s+(\d+|[IVXLCDM]+)\s*[:\-]\s*(.+)$/im, level: 'chapter', captureTitle: true },
  { regex: /^CHAPTER\s+(\d+|[IVXLCDM]+)\s*[:\-]\s*(.+)$/im, level: 'chapter', captureTitle: true },
  { regex: /^Chapter\s+(\d+|[IVXLCDM]+)\s*$/im, level: 'chapter', captureTitle: false },
  // Part I, Part One, Part 1
  { regex: /^Part\s+([IVXLCDM]+|\d+|One|Two|Three)\s*[:\-]\s*(.+)$/im, level: 'part', captureTitle: true },
  { regex: /^Part\s+([IVXLCDM]+|\d+|One|Two|Three)\s*$/im, level: 'part', captureTitle: false },
  { regex: /^PART\s+([IVXLCDM]+|\d+)\s*[:\-]\s*(.+)$/im, level: 'part', captureTitle: true },
  // Numbered: 1. Title, 1) Title
  { regex: /^(\d+)[.)]\s+(.+)$/m, level: 'section', captureTitle: true },
  // Roman numerals: I. Title, II. Title
  { regex: /^([IVXLCDM]+)[.)]\s+(.+)$/m, level: 'section', captureTitle: true },
  // Common section names (standalone)
  {
    regex: /^(Contents|Table of Contents|Introduction|Preface|Foreword|Conclusion|Epilogue|Appendix|Acknowledgments?|About the Author)\s*$/im,
    level: 'section',
    captureTitle: false,
  },
]

/**
 * Extract table of contents from book text.
 * Searches first ~8000 chars for TOC patterns.
 */
export function extractTocFromText(text: string): BookToc {
  const searchRegion = text.slice(0, TOC_SEARCH_LIMIT)
  const entries: TocEntry[] = []
  const seenStarts = new Set<number>()

  const lines = searchRegion.split(/\r?\n/)
  let currentPos = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineStart = currentPos
    const lineEnd = currentPos + line.length
    currentPos = lineEnd + (lines[i + 1] !== undefined ? 1 : 0) // +1 for newline

    const trimmed = line.trim()
    if (!trimmed) continue

    for (const { regex, level, captureTitle } of TOC_PATTERNS) {
      const match = trimmed.match(regex)
      if (!match) continue

      // Avoid duplicates at same position
      if (seenStarts.has(lineStart)) break
      seenStarts.add(lineStart)

      let title: string
      if (captureTitle && match[2]) {
        title = match[2].trim()
      } else if (captureTitle && match[1]) {
        const m1 = match[1].trim()
        if (m1.length > 1 && !/^\d+$/.test(m1) && !/^[IVXLCDM]+$/i.test(m1)) {
          title = m1
        } else {
          title = trimmed
        }
      } else {
        title = trimmed
      }

      // Skip if title is too short or looks like page numbers only
      if (title.length < 2) continue
      if (/^\d+\s*$/.test(title)) continue

      entries.push({
        title,
        level,
        charStart: lineStart,
        charEnd: lineEnd,
      })
      break
    }
  }

  // Sort by charStart and dedupe overlapping
  entries.sort((a, b) => a.charStart - b.charStart)

  // Extend charEnd to next entry's charStart (or end of search region)
  for (let i = 0; i < entries.length; i++) {
    const next = entries[i + 1]
    entries[i].charEnd = next ? next.charStart - 1 : Math.min(entries[i].charEnd + 500, TOC_SEARCH_LIMIT)
  }

  return {
    entries,
    extractedAt: new Date().toISOString(),
    method: 'heuristic',
  }
}
