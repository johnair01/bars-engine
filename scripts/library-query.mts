import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

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
  frontmatter: Record<string, unknown>
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
  links: LinkRecord[]
  backlinks: Record<string, string[]>
  missingLinks: LinkRecord[]
  duplicateTitles: Record<string, string[]>
}

type ConceptSignal = 'keyterm' | 'alias' | 'tag' | 'heading' | 'wiki-link' | 'capitalized-phrase'

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
  concepts: ConceptRecord[]
}

type RankedNote = {
  relPath: string
  title: string
  authority: AuthorityLayer
  score: number
  reasons: string[]
  tags: string[]
  headings: string[]
  backlinks: string[]
  wordCount: number
  modified: string
}

type QueryPacket = {
  generatedAt: string
  query: string
  querySlug: string
  matchedConcepts: Array<{
    name: string
    slug: string
    mentions: number
    signals: Partial<Record<ConceptSignal, number>>
  }>
  rankedNotes: RankedNote[]
  groupedNotes: Record<AuthorityLayer, RankedNote[]>
  driftWarnings: string[]
  summary: string
  nextActions: string[]
}

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, 'output', 'library-index')
const LOG_DIR = path.join(ROOT, 'The Library', '01 Daily Notes', 'LOGS')
const PACKET_DIR = path.join(OUTPUT_DIR, 'query-packets')

const AUTHORITY_WEIGHT: Record<AuthorityLayer, number> = {
  canonical: 12,
  emergent: 10,
  stub: 8,
  source: 5,
  log: 3,
  imported: 2,
  unknown: 1,
  archive: 0,
}

const AUTHORITY_ORDER: AuthorityLayer[] = ['stub', 'canonical', 'emergent', 'source', 'log', 'imported', 'unknown', 'archive']

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

function fileSafeSlug(value: string): string {
  return slug(value).replace(/\s+/g, '-').slice(0, 80) || 'query'
}

function todayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

function queryTerms(query: string): string[] {
  return slug(query)
    .split(/\s+/)
    .filter((term) => term.length > 1)
}

function noteText(note: NoteRecord): string {
  return [
    note.title,
    note.filename,
    note.relPath,
    note.tags.join(' '),
    note.headings.map((heading) => heading.text).join(' '),
    note.outgoingLinks.join(' '),
    note.conceptPhrases.join(' '),
  ]
    .join(' ')
    .toLowerCase()
}

function conceptScore(concept: ConceptRecord, querySlug: string, terms: string[]): number {
  let score = 0
  const conceptTerms = new Set(concept.slug.split(/\s+/))
  const allTermsMatch = terms.length > 0 && terms.every((term) => conceptTerms.has(term) || concept.slug.includes(term))

  if (terms.length > 1 && concept.slug !== querySlug && !concept.slug.includes(querySlug) && !querySlug.includes(concept.slug) && !allTermsMatch) {
    return 0
  }

  if (concept.slug === querySlug) score += 100
  if (concept.slug.includes(querySlug) || querySlug.includes(concept.slug)) score += 55
  for (const term of terms) {
    if (concept.slug.split(/\s+/).includes(term)) score += 10
    else if (concept.slug.includes(term)) score += 4
  }
  if (concept.stubNotes.length) score += 4
  if (concept.emergentNotes.length) score += 3
  return score
}

function rankNotes(
  notes: NoteRecord[],
  links: LinksOutput,
  matchedConcepts: ConceptRecord[],
  query: string,
  querySlug: string,
  terms: string[]
): RankedNote[] {
  const conceptNoteSignals = new Map<string, ConceptSignal[]>()
  for (const concept of matchedConcepts) {
    for (const note of concept.notes) {
      const existing = conceptNoteSignals.get(note.relPath) ?? []
      conceptNoteSignals.set(note.relPath, [...new Set([...existing, ...note.signals])])
    }
  }

  const ranked: RankedNote[] = []
  for (const note of notes) {
    const reasons: string[] = []
    let score = 0
    let directMatch = false
    const text = noteText(note)
    const titleSlug = slug(note.title)
    const pathSlug = slug(note.relPath)

    if (conceptNoteSignals.has(note.relPath)) {
      const signals = conceptNoteSignals.get(note.relPath) ?? []
      score += 35 + signals.length * 5
      reasons.push(`concept match: ${signals.join(', ')}`)
      directMatch = true
    }

    if (titleSlug === querySlug) {
      score += 45
      reasons.push('exact title match')
      directMatch = true
    } else if (titleSlug.includes(querySlug)) {
      score += 25
      reasons.push('title contains query')
      directMatch = true
    }

    if (pathSlug.includes(querySlug)) {
      score += 18
      reasons.push('path contains query')
      directMatch = true
    }

    const matchedTerms = terms.filter((term) => text.includes(term))
    if (matchedTerms.length) {
      score += matchedTerms.length * 4
      reasons.push(`term match: ${matchedTerms.join(', ')}`)
      directMatch = true
    }

    const backlinks = links.backlinks[note.relPath] ?? []
    if (backlinks.length) {
      score += Math.min(10, backlinks.length)
      reasons.push(`${backlinks.length} backlink${backlinks.length === 1 ? '' : 's'}`)
    }

    score += AUTHORITY_WEIGHT[note.authority]

    if (!directMatch || score < 18) continue

    ranked.push({
      relPath: note.relPath,
      title: note.title,
      authority: note.authority,
      score,
      reasons,
      tags: note.tags,
      headings: note.headings.slice(0, 8).map((heading) => `${'#'.repeat(heading.depth)} ${heading.text}`),
      backlinks: backlinks.slice(0, 12),
      wordCount: note.wordCount,
      modified: new Date(note.mtimeMs).toISOString(),
    })
  }

  return ranked.sort((a, b) => b.score - a.score || a.relPath.localeCompare(b.relPath)).slice(0, 30)
}

function groupNotes(rankedNotes: RankedNote[]): Record<AuthorityLayer, RankedNote[]> {
  const groups = Object.fromEntries(AUTHORITY_ORDER.map((authority) => [authority, []])) as Record<AuthorityLayer, RankedNote[]>
  for (const note of rankedNotes) groups[note.authority].push(note)
  return groups
}

function buildWarnings(grouped: Record<AuthorityLayer, RankedNote[]>, matchedConcepts: ConceptRecord[]): string[] {
  const warnings: string[] = []
  const hasStub = grouped.stub.length > 0 || matchedConcepts.some((concept) => concept.stubNotes.length > 0)
  const hasEmergent = grouped.emergent.length > 0 || matchedConcepts.some((concept) => concept.emergentNotes.length > 0)
  const hasCanonical = grouped.canonical.length > 0 || matchedConcepts.some((concept) => concept.canonicalNotes.length > 0)

  if (hasStub && hasEmergent) {
    warnings.push('A stub keyterm or placeholder exists while richer emergent notes also exist. This is likely ontology drift.')
  }
  if (!hasCanonical && hasEmergent) {
    warnings.push('Emergent notes exist, but no strong canonical note was found.')
  }
  if (hasCanonical && hasEmergent) {
    warnings.push('Canonical and emergent notes both match. Check whether the canonical note has absorbed the newer model.')
  }
  if (matchedConcepts.length > 1) {
    warnings.push(`Multiple nearby concepts matched (${matchedConcepts.map((concept) => concept.name).join(', ')}). Check naming boundaries.`)
  }

  return warnings
}

function buildSummary(query: string, grouped: Record<AuthorityLayer, RankedNote[]>, warnings: string[]): string {
  const parts = [`Query "${query}" matched ${Object.values(grouped).flat().length} ranked notes.`]
  if (grouped.stub.length) parts.push(`${grouped.stub.length} stub note(s) may need promotion or cleanup.`)
  if (grouped.canonical.length) parts.push(`${grouped.canonical.length} canonical note(s) provide current map-level context.`)
  if (grouped.emergent.length) parts.push(`${grouped.emergent.length} emergent note(s) contain active working theory or design synthesis.`)
  if (warnings.length) parts.push(`Warnings: ${warnings.length}.`)
  return parts.join(' ')
}

function buildNextActions(grouped: Record<AuthorityLayer, RankedNote[]>, warnings: string[]): string[] {
  const actions: string[] = []
  if (grouped.stub.length && grouped.emergent.length) {
    actions.push(`Promote or update ${grouped.stub[0].relPath} using the strongest emergent notes.`)
  }
  if (grouped.canonical.length && grouped.emergent.length) {
    actions.push('Compare the top canonical note against the top emergent note and decide whether to merge, link, or preserve the distinction.')
  }
  if (!actions.length && grouped.emergent.length) actions.push('Choose the strongest emergent note and decide whether it needs a KEYTERM or spec bridge.')
  if (!actions.length && grouped.canonical.length) actions.push('Use the canonical notes as the current map and inspect backlinks for expansion paths.')
  if (warnings.length) actions.push('Run the future drift scanner for this concept once Phase 4 is implemented.')
  return actions.slice(0, 5)
}

function renderNoteList(notes: RankedNote[]): string {
  if (!notes.length) return '_None._'
  return notes
    .map(
      (note) =>
        `- ${note.title} (${note.score}) — \`${note.relPath}\`\n  - Reasons: ${note.reasons.join('; ') || 'authority/context match'}`
    )
    .join('\n')
}

function renderMarkdown(packet: QueryPacket): string {
  const matchedConcepts = packet.matchedConcepts.length
    ? packet.matchedConcepts.map((concept) => `- ${concept.name} (${concept.mentions} mentions)`).join('\n')
    : '_No direct concept record matched._'

  const warnings = packet.driftWarnings.length
    ? packet.driftWarnings.map((warning) => `- ${warning}`).join('\n')
    : '_No immediate drift warnings._'

  const nextActions = packet.nextActions.length
    ? packet.nextActions.map((action) => `- ${action}`).join('\n')
    : '_No next action inferred._'

  return `# Library Concept Packet - ${packet.query}

Generated: ${packet.generatedAt}

## Summary

${packet.summary}

## Matched Concepts

${matchedConcepts}

## Drift Warnings

${warnings}

## Stub Notes

${renderNoteList(packet.groupedNotes.stub)}

## Canonical Notes

${renderNoteList(packet.groupedNotes.canonical)}

## Emergent Notes

${renderNoteList(packet.groupedNotes.emergent)}

## Source Notes

${renderNoteList(packet.groupedNotes.source)}

## Other Matches

${renderNoteList([
  ...packet.groupedNotes.log,
  ...packet.groupedNotes.imported,
  ...packet.groupedNotes.unknown,
  ...packet.groupedNotes.archive,
])}

## Next Actions

${nextActions}
`
}

async function main() {
  const query = process.argv.slice(2).join(' ').trim()
  if (!query) {
    console.error('Usage: npm run library:query -- "daemon capture"')
    process.exit(1)
  }

  const notesOutput = await readJson<{ notes: NoteRecord[] }>(path.join(OUTPUT_DIR, 'notes.json'))
  const links = await readJson<LinksOutput>(path.join(OUTPUT_DIR, 'links.json'))
  const concepts = await readJson<ConceptsOutput>(path.join(OUTPUT_DIR, 'concepts.json'))

  const terms = queryTerms(query)
  const querySlug = slug(query)
  const matchedConcepts = concepts.concepts
    .map((concept) => ({ concept, score: conceptScore(concept, querySlug, terms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.concept.mentions - a.concept.mentions)
    .slice(0, 8)
    .map((entry) => entry.concept)

  const rankedNotes = rankNotes(notesOutput.notes, links, matchedConcepts, query, querySlug, terms)
  const groupedNotes = groupNotes(rankedNotes)
  const driftWarnings = buildWarnings(groupedNotes, matchedConcepts)
  const packet: QueryPacket = {
    generatedAt: new Date().toISOString(),
    query,
    querySlug,
    matchedConcepts: matchedConcepts.map((concept) => ({
      name: concept.name,
      slug: concept.slug,
      mentions: concept.mentions,
      signals: concept.signals,
    })),
    rankedNotes,
    groupedNotes,
    driftWarnings,
    summary: buildSummary(query, groupedNotes, driftWarnings),
    nextActions: buildNextActions(groupedNotes, driftWarnings),
  }

  await mkdir(PACKET_DIR, { recursive: true })
  await mkdir(LOG_DIR, { recursive: true })

  const packetSlug = fileSafeSlug(query)
  const stamp = todayStamp()
  const jsonPath = path.join(PACKET_DIR, `${packetSlug}.json`)
  const markdownPath = path.join(LOG_DIR, `LIBRARY_CONCEPT_PACKET_${packetSlug}_${stamp}.md`)

  await writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`)
  await writeFile(markdownPath, renderMarkdown(packet))

  console.log(packet.summary)
  console.log(`JSON: ${path.relative(ROOT, jsonPath)}`)
  console.log(`Markdown: ${path.relative(ROOT, markdownPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
