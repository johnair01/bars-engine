import { createHash } from 'crypto'
import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import path from 'path'

type FrontmatterValue = string | string[] | boolean | number | null

type AuthorityLayer =
  | 'canonical'
  | 'emergent'
  | 'source'
  | 'imported'
  | 'archive'
  | 'log'
  | 'stub'
  | 'unknown'

type NoteRecord = {
  id: string
  absPath: string
  relPath: string
  filename: string
  title: string
  frontmatter: Record<string, FrontmatterValue>
  headings: Array<{ depth: number; text: string }>
  tags: string[]
  outgoingLinks: string[]
  conceptPhrases: string[]
  mtimeMs: number
  wordCount: number
  contentHash: string
  authority: AuthorityLayer
}

type LinkRecord = {
  source: string
  target: string
  resolvedTargets: string[]
  missing: boolean
}

type LinksOutput = {
  generatedAt: string
  links: LinkRecord[]
  backlinks: Record<string, string[]>
  missingLinks: LinkRecord[]
  duplicateTitles: Record<string, string[]>
}

type ConceptSignal =
  | 'keyterm'
  | 'alias'
  | 'tag'
  | 'heading'
  | 'wiki-link'
  | 'capitalized-phrase'

type ConceptRecord = {
  slug: string
  name: string
  mentions: number
  signals: Partial<Record<ConceptSignal, number>>
  notes: Array<{
    relPath: string
    title: string
    authority: AuthorityLayer
    signals: ConceptSignal[]
  }>
  canonicalNotes: string[]
  emergentNotes: string[]
  sourceNotes: string[]
  stubNotes: string[]
}

type ConceptsOutput = {
  generatedAt: string
  authoritySummary: Record<AuthorityLayer, number>
  concepts: ConceptRecord[]
}

const ROOT = process.cwd()
const LIBRARY_ROOT = path.join(ROOT, 'The Library')
const OUTPUT_DIR = path.join(ROOT, 'output', 'library-index')

const INCLUDE_DIRS = [
  path.join(LIBRARY_ROOT, '01 Daily Notes', 'LOGS'),
  path.join(LIBRARY_ROOT, '02 Index'),
  path.join(LIBRARY_ROOT, '03 BARs'),
  path.join(LIBRARY_ROOT, '04 Quests'),
  path.join(LIBRARY_ROOT, '05 Research'),
  path.join(LIBRARY_ROOT, '06 Specs'),
  path.join(LIBRARY_ROOT, '07 Book OS'),
]

const EXCLUDE_PARTS = new Set([
  '.git',
  '.obsidian',
  '.cursor',
  'node_modules',
  '__pycache__',
])

const STOP_CONCEPTS = new Set([
  'example',
  'examples',
  'pending',
  'purpose',
  'related',
  'status',
  'stub',
  'tags',
])

function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}

function relFromRoot(absPath: string): string {
  return toPosix(path.relative(ROOT, absPath))
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.(md|markdown)$/i, '')
    .replace(/^keyterm[-_]/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseScalar(raw: string): FrontmatterValue {
  const value = raw.trim()
  if (value === '') return ''
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => String(parseScalar(item)).trim())
      .filter(Boolean)
  }
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  return value.replace(/^["']|["']$/g, '')
}

function parseFrontmatter(content: string): {
  frontmatter: Record<string, FrontmatterValue>
  body: string
} {
  if (!content.startsWith('---\n')) return { frontmatter: {}, body: content }

  const end = content.indexOf('\n---', 4)
  if (end === -1) return { frontmatter: {}, body: content }

  const raw = content.slice(4, end).split(/\r?\n/)
  const frontmatter: Record<string, FrontmatterValue> = {}
  let activeArrayKey: string | null = null

  for (const line of raw) {
    const arrayItem = line.match(/^\s*-\s+(.*)$/)
    if (arrayItem && activeArrayKey) {
      const current = frontmatter[activeArrayKey]
      const next = Array.isArray(current) ? current : []
      next.push(String(parseScalar(arrayItem[1])))
      frontmatter[activeArrayKey] = next
      continue
    }

    const pair = line.match(/^([^:#]+):\s*(.*)$/)
    if (!pair) {
      activeArrayKey = null
      continue
    }

    const key = pair[1].trim()
    const value = pair[2].trim()
    if (value === '') {
      frontmatter[key] = []
      activeArrayKey = key
      continue
    }

    frontmatter[key] = parseScalar(value)
    activeArrayKey = null
  }

  const bodyStart = content.indexOf('\n', end + 4)
  return {
    frontmatter,
    body: bodyStart === -1 ? '' : content.slice(bodyStart + 1),
  }
}

function extractHeadings(body: string): Array<{ depth: number; text: string }> {
  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{1,6})\s+(.+?)\s*#*$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ depth: match[1].length, text: match[2].trim() }))
}

function extractTags(frontmatter: Record<string, FrontmatterValue>, body: string): string[] {
  const tags = new Set<string>()
  const frontmatterTags = frontmatter.tags

  if (Array.isArray(frontmatterTags)) {
    for (const tag of frontmatterTags) tags.add(tag.replace(/^#/, '').trim())
  } else if (typeof frontmatterTags === 'string') {
    for (const tag of frontmatterTags.split(/[,\s]+/)) tags.add(tag.replace(/^#/, '').trim())
  }

  for (const match of body.matchAll(/(^|\s)#([A-Za-z0-9_/-]+)/g)) {
    tags.add(match[2])
  }

  return [...tags].filter(Boolean).sort((a, b) => a.localeCompare(b))
}

function extractOutgoingLinks(body: string): string[] {
  const links = new Set<string>()

  for (const match of body.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const rawTarget = match[1].split('|')[0].split('#')[0].trim()
    if (rawTarget) links.add(rawTarget)
  }

  return [...links].sort((a, b) => a.localeCompare(b))
}

function inferTitle(
  absPath: string,
  frontmatter: Record<string, FrontmatterValue>,
  headings: Array<{ depth: number; text: string }>
): string {
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) return frontmatter.title.trim()
  const h1 = headings.find((heading) => heading.depth === 1)
  if (h1) return h1.text
  return path.basename(absPath, path.extname(absPath))
}

function wordCount(body: string): number {
  const words = body.match(/[\p{L}\p{N}'-]+/gu)
  return words ? words.length : 0
}

function isStubNote(
  relPath: string,
  frontmatter: Record<string, FrontmatterValue>,
  body: string,
  words: number
): boolean {
  const status = typeof frontmatter.status === 'string' ? frontmatter.status.toLowerCase() : ''
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map((tag) => tag.toLowerCase())
    : typeof frontmatter.tags === 'string'
      ? frontmatter.tags.toLowerCase().split(/[,\s]+/)
      : []

  if (status.includes('stub') || tags.includes('stub') || tags.includes('pending')) return true
  if (/awaiting full development|(^|\n)## Stub\b/i.test(body)) return true
  if (/The Library\/02 Index\/KEYTERM-/i.test(relPath) && words < 80) return true
  return words < 25 && !/README\.md$/i.test(relPath)
}

function classifyAuthority(
  relPath: string,
  frontmatter: Record<string, FrontmatterValue>,
  body: string,
  words: number
): AuthorityLayer {
  const normalized = toPosix(relPath)
  const status = typeof frontmatter.status === 'string' ? frontmatter.status.toLowerCase() : ''
  const type = typeof frontmatter.type === 'string' ? frontmatter.type.toLowerCase() : ''

  if (normalized.includes('/99 Archive/')) return 'archive'
  if (normalized.includes('/98 Codex Imports/') || normalized.includes('/Imported/')) return 'imported'
  if (normalized.includes('/01 Daily Notes/LOGS/')) return 'log'
  if (isStubNote(normalized, frontmatter, body, words)) return 'stub'
  if (status.includes('canonical') || type === 'keyterm') return 'canonical'
  if (normalized.includes('/02 Index/KEYTERM-')) return 'canonical'
  if (normalized.includes('/06 Specs/') || type === 'spec' || type === 'spec-patch') return 'canonical'
  if (normalized.includes('/08 Source Library/')) return 'source'
  if (normalized.includes('/07 Book OS/')) return 'source'
  if (normalized.includes('/05 Research/')) return 'emergent'
  if (normalized.includes('/03 BARs/') || normalized.includes('/04 Quests/')) return 'emergent'
  if (type.includes('design') || type.includes('research')) return 'emergent'
  return 'unknown'
}

function conceptName(value: string): string {
  return value
    .replace(/\.(md|markdown)$/i, '')
    .replace(/^KEYTERM[-_]/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeConcept(value: string): string {
  return slug(conceptName(value))
}

function titleCaseConcept(value: string): string {
  const cleaned = conceptName(value)
  if (/[A-Z]{2,}/.test(cleaned)) return cleaned
  return cleaned
    .split(/\s+/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ')
}

function frontmatterArray(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return value.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean)
  return []
}

function extractCapitalizedPhrases(body: string): string[] {
  const counts = new Map<string, number>()
  const phrases = body.match(/\b(?:[A-Z][A-Za-z0-9]*|BARs|MTGOA|BARS)(?:[\s/-]+(?:[A-Z][A-Za-z0-9]*|BARs|MTGOA|BARS)){1,5}\b/g) ?? []

  for (const phrase of phrases) {
    const cleaned = phrase.replace(/\s+/g, ' ').trim()
    if (cleaned.length < 6) continue
    if (/^(Status|Purpose|Examples|Related|Current|Possible|Potential|The|This|That)\b/.test(cleaned)) continue
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1)
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([phrase]) => phrase)
    .sort((a, b) => a.localeCompare(b))
}

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (EXCLUDE_PARTS.has(entry.name)) continue
    const absPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walkMarkdownFiles(absPath)))
    } else if (entry.isFile() && /\.(md|markdown)$/i.test(entry.name)) {
      files.push(absPath)
    }
  }

  return files
}

async function readNotes(): Promise<NoteRecord[]> {
  const markdownFiles = (
    await Promise.all(
      INCLUDE_DIRS.map(async (dir) => {
        try {
          return await walkMarkdownFiles(dir)
        } catch {
          return []
        }
      })
    )
  )
    .flat()
    .sort((a, b) => a.localeCompare(b))

  const notes: NoteRecord[] = []

  for (const absPath of markdownFiles) {
    const [content, stats] = await Promise.all([readFile(absPath, 'utf8'), stat(absPath)])
    const { frontmatter, body } = parseFrontmatter(content)
    const headings = extractHeadings(body)
    const relPath = relFromRoot(absPath)
    const title = inferTitle(absPath, frontmatter, headings)
    const words = wordCount(body)

    notes.push({
      id: relPath,
      absPath,
      relPath,
      filename: path.basename(absPath),
      title,
      frontmatter,
      headings,
      tags: extractTags(frontmatter, body),
      outgoingLinks: extractOutgoingLinks(body),
      conceptPhrases: extractCapitalizedPhrases(body),
      mtimeMs: stats.mtimeMs,
      wordCount: words,
      contentHash: createHash('sha256').update(content).digest('hex'),
      authority: classifyAuthority(relPath, frontmatter, body, words),
    })
  }

  return notes
}

function buildConcepts(notes: NoteRecord[]): ConceptsOutput {
  const conceptMap = new Map<string, ConceptRecord>()
  const authoritySummary = {
    canonical: 0,
    emergent: 0,
    source: 0,
    imported: 0,
    archive: 0,
    log: 0,
    stub: 0,
    unknown: 0,
  } satisfies Record<AuthorityLayer, number>

  function addConcept(rawName: string, note: NoteRecord, signal: ConceptSignal) {
    const normalized = normalizeConcept(rawName)
    if (!normalized || normalized.length < 2) return
    if (STOP_CONCEPTS.has(normalized)) return

    const record =
      conceptMap.get(normalized) ??
      ({
        slug: normalized,
        name: titleCaseConcept(rawName),
        mentions: 0,
        signals: {},
        notes: [],
        canonicalNotes: [],
        emergentNotes: [],
        sourceNotes: [],
        stubNotes: [],
      } satisfies ConceptRecord)

    record.mentions += 1
    record.signals[signal] = (record.signals[signal] ?? 0) + 1

    const existingNote = record.notes.find((entry) => entry.relPath === note.relPath)
    if (existingNote) {
      if (!existingNote.signals.includes(signal)) existingNote.signals.push(signal)
    } else {
      record.notes.push({
        relPath: note.relPath,
        title: note.title,
        authority: note.authority,
        signals: [signal],
      })
    }

    if (note.authority === 'canonical' && !record.canonicalNotes.includes(note.relPath)) {
      record.canonicalNotes.push(note.relPath)
    }
    if (note.authority === 'emergent' && !record.emergentNotes.includes(note.relPath)) {
      record.emergentNotes.push(note.relPath)
    }
    if (note.authority === 'source' && !record.sourceNotes.includes(note.relPath)) {
      record.sourceNotes.push(note.relPath)
    }
    if (note.authority === 'stub' && !record.stubNotes.includes(note.relPath)) {
      record.stubNotes.push(note.relPath)
    }

    conceptMap.set(normalized, record)
  }

  for (const note of notes) {
    authoritySummary[note.authority] += 1

    if (/\/02 Index\/KEYTERM-/i.test(note.relPath)) addConcept(note.filename, note, 'keyterm')

    for (const alias of frontmatterArray(note.frontmatter.aliases)) addConcept(alias, note, 'alias')
    for (const tag of note.tags) addConcept(tag, note, 'tag')
    for (const heading of note.headings.filter((entry) => entry.depth <= 2)) addConcept(heading.text, note, 'heading')
    for (const link of note.outgoingLinks) addConcept(link, note, 'wiki-link')
    for (const phrase of note.conceptPhrases) addConcept(phrase, note, 'capitalized-phrase')
  }

  const concepts = [...conceptMap.values()].map((record) => ({
    ...record,
    notes: record.notes.sort((a, b) => a.relPath.localeCompare(b.relPath)),
    canonicalNotes: record.canonicalNotes.sort((a, b) => a.localeCompare(b)),
    emergentNotes: record.emergentNotes.sort((a, b) => a.localeCompare(b)),
    sourceNotes: record.sourceNotes.sort((a, b) => a.localeCompare(b)),
    stubNotes: record.stubNotes.sort((a, b) => a.localeCompare(b)),
  }))

  return {
    generatedAt: new Date().toISOString(),
    authoritySummary,
    concepts: concepts
      .filter((record) => record.mentions >= 2 || record.canonicalNotes.length > 0)
      .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name)),
  }
}

function renderSummary(notes: NoteRecord[], links: LinksOutput, concepts: ConceptsOutput): string {
  const topConcepts = concepts.concepts
    .slice(0, 20)
    .map((concept) => `- ${concept.name}: ${concept.mentions} mentions`)
    .join('\n')

  const authorityRows = Object.entries(concepts.authoritySummary)
    .map(([authority, count]) => `| ${authority} | ${count} |`)
    .join('\n')

  return `# Library Query Index Summary

Generated: ${concepts.generatedAt}

## Counts

- Notes: ${notes.length}
- Wiki links: ${links.links.length}
- Missing links: ${links.missingLinks.length}
- Duplicate title keys: ${Object.keys(links.duplicateTitles).length}
- Concept candidates: ${concepts.concepts.length}

## Authority Summary

| Authority | Notes |
| --- | ---: |
${authorityRows}

## Top Concepts

${topConcepts}
`
}

function buildLinks(notes: NoteRecord[]): LinksOutput {
  const bySlug = new Map<string, NoteRecord[]>()
  const byRelNoExt = new Map<string, NoteRecord[]>()
  const duplicateTitles: Record<string, string[]> = {}

  for (const note of notes) {
    const titleSlug = slug(note.title)
    const fileSlug = slug(note.filename)
    const relNoExt = toPosix(note.relPath.replace(/\.(md|markdown)$/i, ''))

    for (const key of new Set([titleSlug, fileSlug].filter(Boolean))) {
      const bucket = bySlug.get(key) ?? []
      bucket.push(note)
      bySlug.set(key, bucket)
    }

    const relBucket = byRelNoExt.get(relNoExt) ?? []
    relBucket.push(note)
    byRelNoExt.set(relNoExt, relBucket)
  }

  for (const [title, titleNotes] of bySlug.entries()) {
    const paths = [...new Set(titleNotes.map((note) => note.relPath))]
    if (paths.length > 1) duplicateTitles[title] = paths.sort((a, b) => a.localeCompare(b))
  }

  const backlinks: Record<string, string[]> = {}
  const links: LinkRecord[] = []

  for (const note of notes) {
    for (const target of note.outgoingLinks) {
      const normalizedTarget = toPosix(target.replace(/\.(md|markdown)$/i, ''))
      const targetSlug = slug(target)
      const resolvedTargets = [
        ...(byRelNoExt.get(normalizedTarget) ?? []),
        ...(bySlug.get(targetSlug) ?? []),
      ]
      const uniqueResolved = [...new Set(resolvedTargets.map((resolved) => resolved.relPath))].sort((a, b) =>
        a.localeCompare(b)
      )

      for (const resolved of uniqueResolved) {
        const sources = backlinks[resolved] ?? []
        sources.push(note.relPath)
        backlinks[resolved] = [...new Set(sources)].sort((a, b) => a.localeCompare(b))
      }

      links.push({
        source: note.relPath,
        target,
        resolvedTargets: uniqueResolved,
        missing: uniqueResolved.length === 0,
      })
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    links,
    backlinks,
    missingLinks: links.filter((link) => link.missing),
    duplicateTitles,
  }
}

async function main() {
  const notes = await readNotes()
  const links = buildLinks(notes)
  const concepts = buildConcepts(notes)
  await mkdir(OUTPUT_DIR, { recursive: true })

  const generatedAt = new Date().toISOString()
  await writeFile(
    path.join(OUTPUT_DIR, 'notes.json'),
    `${JSON.stringify({ generatedAt, scopedDirs: INCLUDE_DIRS.map(relFromRoot), notes }, null, 2)}\n`
  )
  await writeFile(path.join(OUTPUT_DIR, 'links.json'), `${JSON.stringify(links, null, 2)}\n`)
  await writeFile(path.join(OUTPUT_DIR, 'concepts.json'), `${JSON.stringify(concepts, null, 2)}\n`)
  await writeFile(path.join(OUTPUT_DIR, 'summary.md'), renderSummary(notes, links, concepts))

  console.log(`Indexed ${notes.length} markdown notes.`)
  console.log(`Captured ${links.links.length} wiki links.`)
  console.log(`Extracted ${concepts.concepts.length} concept candidates.`)
  console.log(`Missing links: ${links.missingLinks.length}.`)
  console.log(`Output: ${relFromRoot(OUTPUT_DIR)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
