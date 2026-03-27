import { z } from 'zod'

const MAX_PAGE_URL = 2048
const MAX_PATH = 1024
const MAX_SEARCH = 4096
const MAX_HASH = 512
const MAX_TITLE = 200
const MAX_MESSAGE = 4000

export const siteSignalInputSchema = z.object({
  pageUrl: z.string().trim().min(1).max(MAX_PAGE_URL),
  pathname: z.string().trim().min(1).max(MAX_PATH),
  search: z.string().max(MAX_SEARCH).optional().nullable(),
  hash: z.string().max(MAX_HASH).optional().nullable(),
  documentTitle: z.string().max(MAX_TITLE).optional().nullable(),
  message: z.string().trim().min(1).max(MAX_MESSAGE),
})

export type SiteSignalInput = z.infer<typeof siteSignalInputSchema>

/** Persisted `feedback` string: URL snapshot + player message (Share Your Signal shape). */
export function formatSiteSignalFeedbackBlock(
  input: SiteSignalInput & { isAdmin?: boolean }
): string {
  const search = input.search?.trim() ? input.search : ''
  const hash = input.hash?.trim() ? input.hash : ''
  const title = input.documentTitle?.trim() ? input.documentTitle.trim() : ''

  const parts: string[] = []
  if (input.isAdmin) {
    parts.push('[admin]')
  }
  parts.push('--- Page snapshot ---')
  parts.push(`pageUrl: ${input.pageUrl}`)
  parts.push(`pathname: ${input.pathname}`)
  if (search) parts.push(`search: ${search}`)
  if (hash) parts.push(`hash: ${hash}`)
  if (title) parts.push(`documentTitle: ${title}`)
  parts.push('--- What felt wrong ---')
  parts.push(input.message.trim())
  return parts.join('\n')
}
