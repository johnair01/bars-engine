/**
 * Deterministic slicing of full book text by TOC section titles.
 * Same inputs → same char ranges (no LLM). Used for GPT reference chunks + manifests.
 */

export type TocChunkManifestEntry = {
  sectionId: string
  title: string
  charStart: number
  charEnd: number
  byteLength: number
  matched: boolean
}

export type TocSliceResult = {
  bookId?: string
  entries: TocChunkManifestEntry[]
  warnings: string[]
}

/** Collapse whitespace for comparison; keep single spaces between words. */
export function normalizeTitleForMatch(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

/**
 * Find start index of `title` in `text` using flexible whitespace between words.
 * Returns -1 if not found.
 */
export function findTitleStartIndex(text: string, title: string): number {
  const norm = normalizeTitleForMatch(title)
  if (!norm.length) return -1

  const idx = text.indexOf(norm)
  if (idx !== -1) return idx

  const words = norm.split(/\s+/).filter(Boolean)
  if (words.length === 0) return -1

  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = escaped.join('\\s+')
  const re = new RegExp(pattern, 'im')
  const m = re.exec(text)
  return m ? m.index : -1
}

/**
 * Slice `fullText` into sections by ordered titles. Section *i* runs from the start
 * of title *i* (inclusive) to the start of title *i+1* (exclusive). Last section runs to EOF.
 *
 * Titles should be in **reading order** as they appear in the body (manually corrected from TOC).
 */
export function sliceBookTextByTitles(
  fullText: string,
  titles: string[],
  options?: { idPrefix?: string }
): TocSliceResult {
  const warnings: string[] = []
  const idPrefix = options?.idPrefix ?? 'section'
  const entries: TocChunkManifestEntry[] = []

  const starts: number[] = []
  for (let i = 0; i < titles.length; i++) {
    const t = titles[i]
    const start = findTitleStartIndex(fullText, t)
    if (start === -1) {
      warnings.push(`No match for title ${i + 1}: "${t.slice(0, 80)}${t.length > 80 ? '…' : ''}"`)
      starts.push(-1)
    } else {
      starts.push(start)
    }
  }

  let lastValid = -1
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] === -1) continue
    if (starts[i]! <= lastValid) {
      warnings.push(
        `Section order issue: title ${i + 1} starts at ${starts[i]} (previous valid start was ${lastValid})`
      )
    }
    lastValid = starts[i]!
  }

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i]
    const start = starts[i]!

    if (start === -1) {
      entries.push({
        sectionId: `${idPrefix}-${i + 1}`,
        title: normalizeTitleForMatch(title),
        charStart: -1,
        charEnd: -1,
        byteLength: 0,
        matched: false,
      })
      continue
    }

    let nextBoundary = fullText.length
    for (let j = i + 1; j < starts.length; j++) {
      if (starts[j] !== -1) {
        nextBoundary = starts[j]!
        break
      }
    }

    const body = fullText.slice(start, nextBoundary)
    entries.push({
      sectionId: `${idPrefix}-${i + 1}`,
      title: normalizeTitleForMatch(title),
      charStart: start,
      charEnd: nextBoundary,
      byteLength: body.length,
      matched: true,
    })
  }

  return { entries, warnings }
}
