/**
 * Crawl Google Docs/Sheets (same graph as mirror) and create a Book with extractedText
 * so Admin → Books → Analyze uses the same pipeline as PDFs.
 *
 * Usage:
 *   npm run ingest:google-book -- --start 'https://docs.google.com/document/d/...'
 *
 * macOS: if --start is omitted, reads the first plausible Google URL line from pbpaste.
 *
 * Env: DATABASE_URL (via with-env / .env.local) + same Google credentials as mirror.
 *
 * @see scripts/google-workspace-mirror/README.md
 */

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { parseGoogleWorkspaceUrl } from './lib/google-workspace-mirror/urls'
import { runGoogleWorkspaceCrawl } from './lib/google-workspace-mirror/crawl'

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function readClipboardStartUrl(): string | null {
  if (process.platform !== 'darwin') return null
  try {
    const raw = execSync('pbpaste', { encoding: 'utf8', maxBuffer: 256 * 1024 })
    const line = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean)
    if (!line) return null
    if (!/(docs\.google\.com|drive\.google\.com|spreadsheets\.google\.com)/i.test(line)) return null
    return line
  } catch {
    return null
  }
}

function parseArgs(argv: string[]) {
  let start: string | undefined
  let maxDepth = 3
  let maxNodes = 40
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--start' && argv[i + 1]) {
      start = argv[++i]
    } else if (a === '--max-depth' && argv[i + 1]) {
      maxDepth = Math.max(0, parseInt(argv[++i], 10) || 0)
    } else if (a === '--max-nodes' && argv[i + 1]) {
      maxNodes = Math.max(1, parseInt(argv[++i], 10) || 40)
    } else if (a === '--help' || a === '-h') {
      console.log(`
ingest-google-as-book — Google Workspace crawl → Book (extractedText) for Admin Books

  npm run ingest:google-book -- --start '<url>'

  --start <url>      Google Doc, Sheet, or Drive file link (optional on macOS)
  --max-depth <n>    Default: 3
  --max-nodes <n>    Default: 40

On macOS, omit --start to use the clipboard (pbpaste) when it contains a Google Docs/Drive/Sheets URL.

Prints the admin book URL when done. Run Analyze from Admin → Books as with a PDF-extracted book.

Credentials: same as mirror (GOOGLE_WORKSPACE_MIRROR_CREDENTIALS or OAuth trio).
`)
      process.exit(0)
    }
  }
  return { start, maxDepth, maxNodes }
}

function appBaseUrl(): string {
  return (
    process.env.APP_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  )
}

function buildCorpus(
  startUrl: string,
  nodes: Awaited<ReturnType<typeof runGoogleWorkspaceCrawl>>['nodes']
): string {
  const parts: string[] = [
    `<!-- google-workspace-ingest: ${startUrl} -->`,
    '',
    `# Ingested workspace`,
    '',
    `Start URL: ${startUrl}`,
    '',
  ]
  for (const n of nodes) {
    parts.push(`## ${n.title}`)
    parts.push('')
    parts.push(`- **google_id:** \`${n.id}\``)
    parts.push(`- **kind:** ${n.kind}`)
    if (n.error) parts.push(`- **error:** yes`)
    parts.push('')
    parts.push(n.markdownBody.trim())
    parts.push('')
    parts.push('---')
    parts.push('')
  }
  return parts.join('\n').trim() + '\n'
}

async function main() {
  const cli = parseArgs(process.argv.slice(2))
  const { maxDepth, maxNodes } = cli
  let start = cli.start

  if (!start) {
    start = readClipboardStartUrl() ?? undefined
  }

  if (!start) {
    console.error(
      'Missing start URL. Pass --start <url>, or on macOS copy a Google Doc/Drive/Sheets link and omit --start.'
    )
    process.exit(1)
  }

  if (!parseGoogleWorkspaceUrl(start)) {
    console.error('Could not parse Google Workspace URL:', start)
    process.exit(1)
  }

  const { nodes, edges } = await runGoogleWorkspaceCrawl({ startUrl: start, maxDepth, maxNodes })

  const firstOk = nodes.find((n) => !n.error)
  const baseTitle = firstOk?.title?.trim() || 'Workspace ingest'
  const title = `Google: ${baseTitle}`
  let slug = slugFromTitle(title)

  const prisma = new PrismaClient()
  try {
    const existing = await prisma.book.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const extractedText = buildCorpus(start, nodes).replace(/\0/g, '')
    const metadata = {
      googleWorkspaceIngest: true as const,
      startUrl: start,
      maxDepth,
      maxNodes,
      nodeCount: nodes.length,
      edges,
      nodes: nodes.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        error: Boolean(n.error),
      })),
      ingestedAt: new Date().toISOString(),
    }

    const book = await prisma.book.create({
      data: {
        title,
        author: null,
        slug,
        sourcePdfUrl: start,
        extractedText,
        status: 'extracted',
        metadataJson: JSON.stringify(metadata),
      },
    })

    const adminUrl = `${appBaseUrl()}/admin/books/${book.id}`
    console.log('')
    console.log('Created book:', book.title)
    console.log('Admin:', adminUrl)
    console.log('')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
