/**
 * In-memory crawl of Google Docs/Sheets linked graph (shared by mirror CLI + book ingest).
 */

import { google } from 'googleapis'
import { getMirrorAuth } from './auth'
import { parseGoogleWorkspaceUrl, extractWorkspaceLinksFromText } from './urls'
import { documentToMarkdown } from './fetchDocument'
import { fetchSpreadsheetAsMarkdown } from './fetchSpreadsheet'
import { resolveDriveFile } from './driveResolve'

export type CrawlQueueItem = {
  id: string
  kind: 'document' | 'spreadsheet' | 'unknown'
  depth: number
  parentId: string | null
  viaHref: string | null
}

export type CrawledNode = {
  id: string
  kind: string
  title: string
  markdownBody: string
  mimeType?: string
  error?: boolean
  errorMessage?: string
}

export type CrawlEdge = { from: string; to: string; href: string }

export type GoogleWorkspaceCrawlResult = {
  startUrl: string
  nodes: CrawledNode[]
  edges: CrawlEdge[]
}

async function fetchOne(
  auth: Awaited<ReturnType<typeof getMirrorAuth>>,
  id: string,
  initialKind: 'document' | 'spreadsheet' | 'unknown'
): Promise<{
  title: string
  markdownBody: string
  links: string[]
  resolvedKind: 'document' | 'spreadsheet' | 'export' | 'skip'
  mimeType?: string
}> {
  const docs = google.docs({ version: 'v1', auth })
  const sheets = google.sheets({ version: 'v4', auth })
  const drive = google.drive({ version: 'v3', auth })

  let kind = initialKind
  let mimeType: string | undefined

  if (kind === 'unknown') {
    const meta = await resolveDriveFile(drive, id)
    mimeType = meta.mimeType
    if (meta.kind === 'document') kind = 'document'
    else if (meta.kind === 'spreadsheet') kind = 'spreadsheet'
    else {
      try {
        const exp = await drive.files.export(
          { fileId: id, mimeType: 'text/plain' },
          { responseType: 'text' }
        )
        const text = typeof exp.data === 'string' ? exp.data : String(exp.data ?? '')
        const links = extractWorkspaceLinksFromText(text)
        return {
          title: meta.name,
          markdownBody: text.trim() || '_(empty export)_',
          links,
          resolvedKind: 'export',
          mimeType,
        }
      } catch {
        return {
          title: meta.name,
          markdownBody: `_Could not export this file type (\`${meta.mimeType}\`). Share as Google Doc/Sheet or download manually._`,
          links: [],
          resolvedKind: 'skip',
          mimeType,
        }
      }
    }
  }

  if (kind === 'document') {
    const doc = await docs.documents.get({ documentId: id })
    const { title, markdownBody, links } = documentToMarkdown(doc.data)
    return { title, markdownBody, links, resolvedKind: 'document', mimeType: 'application/vnd.google-apps.document' }
  }

  const sheetMd = await fetchSpreadsheetAsMarkdown(sheets, id)
  return {
    title: sheetMd.title,
    markdownBody: sheetMd.markdownBody,
    links: sheetMd.links,
    resolvedKind: 'spreadsheet',
    mimeType: 'application/vnd.google-apps.spreadsheet',
  }
}

export type RunCrawlOptions = {
  startUrl: string
  maxDepth?: number
  maxNodes?: number
  /** Called for each successfully fetched node (for CLI progress). */
  onNode?: (n: CrawledNode) => void
}

/**
 * BFS crawl from a single Google Doc/Sheet/Drive URL.
 */
export async function runGoogleWorkspaceCrawl(options: RunCrawlOptions): Promise<GoogleWorkspaceCrawlResult> {
  const { startUrl, maxDepth = 3, maxNodes = 40, onNode } = options
  const parsed = parseGoogleWorkspaceUrl(startUrl)
  if (!parsed) {
    throw new Error(`Could not parse Google Workspace URL: ${startUrl}`)
  }

  const auth = await getMirrorAuth()
  const visited = new Set<string>()
  const queue: CrawlQueueItem[] = [
    {
      id: parsed.id,
      kind: parsed.kind === 'spreadsheet' ? 'spreadsheet' : parsed.kind === 'document' ? 'document' : 'unknown',
      depth: 0,
      parentId: null,
      viaHref: null,
    },
  ]

  const nodes: CrawledNode[] = []
  const edges: CrawlEdge[] = []

  while (queue.length > 0 && nodes.length < maxNodes) {
    const item = queue.shift()!
    if (visited.has(item.id)) continue
    visited.add(item.id)

    try {
      const result = await fetchOne(auth, item.id, item.kind)
      const node: CrawledNode = {
        id: item.id,
        kind: result.resolvedKind,
        title: result.title,
        markdownBody: result.markdownBody,
        mimeType: result.mimeType,
      }
      nodes.push(node)
      onNode?.(node)

      if (item.parentId && item.viaHref) {
        edges.push({ from: item.parentId, to: item.id, href: item.viaHref })
      }

      if (item.depth >= maxDepth) continue

      for (const href of result.links) {
        const next = parseGoogleWorkspaceUrl(href)
        if (!next) continue
        if (visited.has(next.id)) {
          edges.push({ from: item.id, to: next.id, href })
          continue
        }
        edges.push({ from: item.id, to: next.id, href })
        const nextKind =
          next.kind === 'spreadsheet' ? 'spreadsheet' : next.kind === 'document' ? 'document' : 'unknown'
        queue.push({
          id: next.id,
          kind: nextKind,
          depth: item.depth + 1,
          parentId: item.id,
          viaHref: href,
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[skip] ${item.id}: ${msg}`)
      const errNode: CrawledNode = {
        id: item.id,
        kind: 'error',
        title: 'Fetch error',
        markdownBody: `_Fetch failed: ${msg.replace(/`/g, "'")}_`,
        error: true,
        errorMessage: msg,
      }
      nodes.push(errNode)
      onNode?.(errNode)
    }
  }

  return { startUrl, nodes, edges }
}
