import type { TocEntry } from '@/lib/book-toc'

export type BookSectionScaffold = {
  title: string
  orderIndex: number
}

type TocPayload = {
  entries?: TocEntry[]
}

/**
 * Reads persisted `Book.metadataJson.toc` (from extractBookToc) and returns
 * ordered section scaffolds for fork / batch section creation.
 */
export function tocMetadataToSectionScaffolds(metadataJson: string | null): BookSectionScaffold[] | { error: string } {
  if (!metadataJson?.trim()) return { error: 'Book has no metadata. Run Extract TOC after text extraction.' }
  try {
    const meta = JSON.parse(metadataJson) as { toc?: TocPayload }
    const entries = meta.toc?.entries
    if (!Array.isArray(entries) || entries.length === 0) {
      return { error: 'No TOC entries in metadata. Run Extract TOC on extracted text first.' }
    }
    return entries.map((e, i) => {
      const title =
        typeof e?.title === 'string' && e.title.trim() ? e.title.trim() : `Section ${i + 1}`
      return { title, orderIndex: i }
    })
  } catch {
    return { error: 'Could not parse book metadata JSON.' }
  }
}
