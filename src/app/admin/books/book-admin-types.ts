export type AdminBookRow = {
  id: string
  title: string
  author: string | null
  slug: string
  sourcePdfUrl: string | null
  status: string
  metadataJson: string | null
  createdAt: Date
  thread?: { id: string } | null
  /** Sage slice: GM face + optional hexagram tags per text range */
  _count: { bookChunkTags: number }
}

export type ParsedBookMeta = {
  pageCount?: number
  wordCount?: number
  analysis?: { questsCreated?: number; chunksAnalyzed?: number; chunksTotal?: number }
  toc?: { entries?: unknown[] }
} | null

export function parseBookMeta(metadataJson: string | null): ParsedBookMeta {
  if (!metadataJson) return null
  try {
    return JSON.parse(metadataJson) as NonNullable<ParsedBookMeta>
  } catch {
    return null
  }
}

export function chunksRemaining(meta: ParsedBookMeta): boolean {
  if (!meta?.analysis?.chunksAnalyzed || meta.analysis.chunksTotal == null) return false
  return meta.analysis.chunksAnalyzed < meta.analysis.chunksTotal
}
