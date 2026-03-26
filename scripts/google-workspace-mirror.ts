/**
 * Mirror Google Docs + Sheets (and follow in-doc links) into local Markdown for Cursor / library / BARs.
 *
 * Usage:
 *   npx tsx scripts/with-env.ts "npx tsx scripts/google-workspace-mirror.ts --start 'https://docs.google.com/document/d/...'"
 *
 * Env (one of):
 *   GOOGLE_WORKSPACE_MIRROR_CREDENTIALS=/abs/or/rel/path/to/service-account.json
 *   GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET + GOOGLE_OAUTH_REFRESH_TOKEN
 *
 * Options:
 *   --start <url>     Starting Doc, Sheet, or Drive URL (required)
 *   --out <dir>       Output directory (default: docs/google-mirror/latest)
 *   --max-depth <n>   Link traversal depth (default: 3)
 *   --max-nodes <n>   Max files to fetch (default: 40)
 *
 * @see scripts/google-workspace-mirror/README.md
 */

import fs from 'fs/promises'
import path from 'path'
import { google } from 'googleapis'
import { getMirrorAuth } from './lib/google-workspace-mirror/auth'
import { parseGoogleWorkspaceUrl, extractWorkspaceLinksFromText } from './lib/google-workspace-mirror/urls'
import { documentToMarkdown } from './lib/google-workspace-mirror/fetchDocument'
import { fetchSpreadsheetAsMarkdown } from './lib/google-workspace-mirror/fetchSpreadsheet'
import { resolveDriveFile } from './lib/google-workspace-mirror/driveResolve'

type QueueItem = {
  id: string
  kind: 'document' | 'spreadsheet' | 'unknown'
  depth: number
  parentId: string | null
  /** Link text/URL in the parent that pointed here (for manifest edges). */
  viaHref: string | null
}

type ManifestNode = {
  id: string
  kind: string
  title: string
  relativePath: string
  mimeType?: string
}

type ManifestEdge = { from: string; to: string; href: string }

function slugify(s: string): string {
  const x = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
  return x || 'untitled'
}

function parseArgs(argv: string[]) {
  let start: string | undefined
  let out = path.join(process.cwd(), 'docs', 'google-mirror', 'latest')
  let maxDepth = 3
  let maxNodes = 40
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--start' && argv[i + 1]) {
      start = argv[++i]
    } else if (a === '--out' && argv[i + 1]) {
      out = path.resolve(process.cwd(), argv[++i])
    } else if (a === '--max-depth' && argv[i + 1]) {
      maxDepth = Math.max(0, parseInt(argv[++i], 10) || 0)
    } else if (a === '--max-nodes' && argv[i + 1]) {
      maxNodes = Math.max(1, parseInt(argv[++i], 10) || 40)
    } else if (a === '--help' || a === '-h') {
      console.log(`
google-workspace-mirror — export Docs/Sheets + linked files to Markdown

  npx tsx scripts/with-env.ts "npx tsx scripts/google-workspace-mirror.ts --start '<url>'"

  --start <url>      Google Doc, Sheet, or Drive file link
  --out <dir>        Default: docs/google-mirror/latest
  --max-depth <n>    Default: 3
  --max-nodes <n>    Default: 40

Credentials: GOOGLE_WORKSPACE_MIRROR_CREDENTIALS (SA JSON) or OAuth trio.
See scripts/google-workspace-mirror/README.md
`)
      process.exit(0)
    }
  }
  return { start, out, maxDepth, maxNodes }
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

async function main() {
  const { start, out, maxDepth, maxNodes } = parseArgs(process.argv.slice(2))
  if (!start) {
    console.error('Missing --start <url>. Use --help for usage.')
    process.exit(1)
  }

  const parsed = parseGoogleWorkspaceUrl(start)
  if (!parsed) {
    console.error('Could not parse Google Workspace URL:', start)
    process.exit(1)
  }

  const auth = await getMirrorAuth()
  await fs.mkdir(out, { recursive: true })

  const visited = new Set<string>()
  const queue: QueueItem[] = [
    {
      id: parsed.id,
      kind: parsed.kind === 'spreadsheet' ? 'spreadsheet' : parsed.kind === 'document' ? 'document' : 'unknown',
      depth: 0,
      parentId: null,
      viaHref: null,
    },
  ]

  const nodes: ManifestNode[] = []
  const edges: ManifestEdge[] = []
  const startedAt = new Date().toISOString()

  while (queue.length > 0 && nodes.length < maxNodes) {
    const item = queue.shift()!
    // Same id can be queued via multiple parents; mirror once.
    if (visited.has(item.id)) continue
    visited.add(item.id)

    let result: Awaited<ReturnType<typeof fetchOne>>
    try {
      result = await fetchOne(auth, item.id, item.kind)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[skip] ${item.id}: ${msg}`)
      const stubPath = `${item.id.slice(0, 8)}-error.md`
      const body = `---\ngoogle_id: ${item.id}\nerror: true\n---\n\n_Fetch failed: ${msg.replace(/`/g, "'")}_\n`
      await fs.writeFile(path.join(out, stubPath), body, 'utf8')
      nodes.push({
        id: item.id,
        kind: 'error',
        title: 'Error',
        relativePath: stubPath,
      })
      continue
    }

    const slug = slugify(result.title)
    const fileName = `${item.id.slice(0, 12)}-${slug}.md`
    const relativePath = fileName

    const frontMatter = [
      '---',
      `google_id: ${item.id}`,
      `title: ${JSON.stringify(result.title)}`,
      `source_kind: ${result.resolvedKind}`,
      `mirrored_at: ${new Date().toISOString()}`,
      result.mimeType ? `mime_type: ${JSON.stringify(result.mimeType)}` : null,
      '---',
      '',
    ]
      .filter(Boolean)
      .join('\n')

    await fs.writeFile(path.join(out, fileName), frontMatter + result.markdownBody + '\n', 'utf8')
    console.log(`[ok] ${fileName} — ${result.title}`)

    nodes.push({
      id: item.id,
      kind: result.resolvedKind,
      title: result.title,
      relativePath,
      mimeType: result.mimeType,
    })

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
  }

  const manifest = {
    startedAt,
    startUrl: start,
    outDir: out,
    maxDepth,
    maxNodes,
    nodeCount: nodes.length,
    nodes,
    edges,
  }
  await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
  await fs.writeFile(
    path.join(out, 'INDEX.md'),
    [
      '# Google workspace mirror',
      '',
      `Generated: ${startedAt}`,
      '',
      '## Files',
      '',
      ...nodes.map((n) => `- [${n.title}](${n.relativePath}) (\`${n.id}\`)`),
      '',
      '## Graph',
      '',
      ...edges.map((e) => `- \`${e.from.slice(0, 8)}…\` → \`${e.to.slice(0, 8)}…\` (${e.href})`),
      '',
    ].join('\n'),
    'utf8'
  )

  console.log(`\nDone. ${nodes.length} file(s) → ${out}`)
  console.log('Open INDEX.md or manifest.json for the link map.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
