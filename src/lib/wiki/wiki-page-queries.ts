import { db } from '@/lib/db'

export async function getPublishedWikiPage(slug: string) {
  const row = await db.wikiPageContent.findUnique({
    where: { slug },
    select: { id: true, slug: true, bodyMarkdown: true, status: true, updatedAt: true },
  })
  if (!row || row.status !== 'published') return null
  return row
}

export async function getWikiPageForApi(slug: string, includeDraft: boolean) {
  const row = await db.wikiPageContent.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      bodyMarkdown: true,
      status: true,
      metadataJson: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!row) return null
  if (!includeDraft && row.status !== 'published') return null
  return row
}
