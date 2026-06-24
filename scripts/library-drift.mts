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
  relPath: string
  title: string
  frontmatter: Record<string, unknown>
  headings: Array<{ depth: number; text: string }>
  tags: string[]
  outgoingLinks: string[]
  conceptPhrases: string[]
  mtimeMs: number
  wordCount: number
  authority: AuthorityLayer
}

type LinksOutput = {
  backlinks: Record<string, string[]>
  missingLinks: Array<{ source: string; target: string; resolvedTargets: string[]; missing: boolean }>
  duplicateTitles: Record<string, string[]>
}

type ConceptRecord = {
  slug: string
  name: string
  mentions: number
  canonicalNotes: string[]
  emergentNotes: string[]
  sourceNotes: string[]
  stubNotes: string[]
}

type ConceptsOutput = {
  concepts: ConceptRecord[]
}

type DriftSeverity = 'high' | 'medium' | 'low'
type DriftType =
  | 'stub-with-emergent'
  | 'emergent-without-canonical'
  | 'canonical-with-emergent'
  | 'duplicate-title'
  | 'missing-keyterm-backlink'
  | 'formula-conflict-candidate'

type DriftFinding = {
  type: DriftType
  severity: DriftSeverity
  concept?: string
  summary: string
  notes: string[]
  recommendedAction: string
}

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, 'output', 'library-index')
const DRIFT_DIR = path.join(OUTPUT_DIR, 'drift')
const LOG_DIR = path.join(ROOT, 'The Library', '01 Daily Notes', 'LOGS')

const FORMULA_PATTERNS = [
  /\b[A-Z][A-Za-z ]+\s*\+\s*[A-Z][A-Za-z ]+\s*\+\s*[A-Z][A-Za-z ]+/g,
  /\b[A-Z][A-Za-z ]+\s*->\s*[A-Z][A-Za-z ]+(?:\s*->\s*[A-Z][A-Za-z ]+)*/g,
  /\b[A-Z][A-Za-z ]+\s*↓\s*[A-Z][A-Za-z ]+(?:\s*↓\s*[A-Z][A-Za-z ]+)*/g,
]

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

function todayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function noteByPath(notes: NoteRecord[]): Map<string, NoteRecord> {
  return new Map(notes.map((note) => [note.relPath, note]))
}

function keytermForConcept(concept: ConceptRecord): string | null {
  return exactKeytermForConcept(concept, [...concept.stubNotes, ...concept.canonicalNotes]) ??
    relatedKeytermNotes(concept, [...concept.stubNotes, ...concept.canonicalNotes])[0] ??
    null
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

function noteConceptSlug(relPath: string): string {
  return slug(path.basename(relPath))
}

function relatedKeytermNotes(concept: ConceptRecord, notePaths: string[]): string[] {
  const conceptSlug = concept.slug
  return notePaths.filter((notePath) => {
    if (!notePath.includes('/02 Index/KEYTERM-')) return false
    const noteSlug = noteConceptSlug(notePath)
    return noteSlug === conceptSlug || noteSlug.includes(conceptSlug) || conceptSlug.includes(noteSlug)
  })
}

function exactKeytermForConcept(concept: ConceptRecord, notePaths: string[]): string | null {
  return notePaths.find((notePath) => notePath.includes('/02 Index/KEYTERM-') && noteConceptSlug(notePath) === concept.slug) ?? null
}

function isHighSignalConcept(concept: ConceptRecord): boolean {
  if (concept.name.length < 4) return false
  if (concept.mentions < 3 && concept.stubNotes.length === 0) return false
  if (/^(source|key notes|index moc)$/i.test(concept.name)) return false
  return true
}

function addFinding(findings: DriftFinding[], finding: DriftFinding) {
  const key = `${finding.type}:${finding.concept ?? ''}:${finding.notes.join('|')}`
  if (findings.some((existing) => `${existing.type}:${existing.concept ?? ''}:${existing.notes.join('|')}` === key)) return
  findings.push(finding)
}

function findStubEmergentDrift(concepts: ConceptRecord[]): DriftFinding[] {
  const findings: DriftFinding[] = []
  for (const concept of concepts.filter(isHighSignalConcept)) {
    if (!concept.stubNotes.length || !concept.emergentNotes.length) continue
    const keyterm = keytermForConcept(concept)
    const relatedStubs = relatedKeytermNotes(concept, concept.stubNotes)
    if (!relatedStubs.length) continue
    addFinding(findings, {
      type: 'stub-with-emergent',
      severity: keyterm ? 'high' : 'medium',
      concept: concept.name,
      summary: `${concept.name} has stub notes while richer emergent notes exist.`,
      notes: [...(relatedStubs.length ? relatedStubs : keyterm ? [keyterm] : concept.stubNotes).slice(0, 3), ...concept.emergentNotes.slice(0, 5)],
      recommendedAction: keyterm
        ? `Promote or update ${keyterm} using the strongest emergent notes.`
        : 'Decide whether the stub should be promoted, merged, or ignored.',
    })
  }
  return findings
}

function findEmergentWithoutCanonical(concepts: ConceptRecord[]): DriftFinding[] {
  return concepts
    .filter((concept) => isHighSignalConcept(concept) && concept.emergentNotes.length >= 3 && concept.canonicalNotes.length === 0 && concept.stubNotes.length === 0)
    .slice(0, 80)
    .map((concept) => ({
      type: 'emergent-without-canonical' as const,
      severity: 'medium' as const,
      concept: concept.name,
      summary: `${concept.name} has multiple emergent notes but no canonical note.`,
      notes: concept.emergentNotes.slice(0, 6),
      recommendedAction: 'Create a KEYTERM bridge note or explicitly mark the strongest note as canonical.',
    }))
}

function findCanonicalWithEmergent(concepts: ConceptRecord[]): DriftFinding[] {
  return concepts
    .filter((concept) => isHighSignalConcept(concept) && concept.canonicalNotes.length && concept.emergentNotes.length >= 3 && !concept.stubNotes.length)
    .slice(0, 80)
    .map((concept) => ({
      type: 'canonical-with-emergent' as const,
      severity: 'low' as const,
      concept: concept.name,
      summary: `${concept.name} has canonical notes and several emergent notes. The canonical layer may need refresh.`,
      notes: [...concept.canonicalNotes.slice(0, 3), ...concept.emergentNotes.slice(0, 5)],
      recommendedAction: 'Compare the current canonical note against the emergent notes and decide whether to merge, link, or preserve distinction.',
    }))
}

function findDuplicateTitles(links: LinksOutput): DriftFinding[] {
  return Object.entries(links.duplicateTitles)
    .filter(([, paths]) => paths.length >= 3)
    .slice(0, 80)
    .map(([concept, paths]) => ({
      type: 'duplicate-title' as const,
      severity: paths.some((pathValue) => pathValue.includes('/02 Index/')) ? 'medium' as const : 'low' as const,
      concept,
      summary: `Multiple notes resolve to the same or near-same title key: ${concept}.`,
      notes: paths.slice(0, 10),
      recommendedAction: 'Review whether these are true duplicates, source lineage variants, or intentional repeated artifacts.',
    }))
}

function findMissingKeytermBacklinks(concepts: ConceptRecord[], links: LinksOutput): DriftFinding[] {
  const findings: DriftFinding[] = []
  for (const concept of concepts.filter(isHighSignalConcept)) {
    const keyterm = exactKeytermForConcept(concept, [...concept.stubNotes, ...concept.canonicalNotes])
    if (!keyterm || !concept.emergentNotes.length) continue
    const backlinks = new Set(links.backlinks[keyterm] ?? [])
    const missing = concept.emergentNotes.filter((note) => !backlinks.has(note))
    if (!missing.length) continue
    findings.push({
      type: 'missing-keyterm-backlink',
      severity: concept.stubNotes.includes(keyterm) ? 'high' : 'medium',
      concept: concept.name,
      summary: `${path.basename(keyterm)} is not backlinked from ${missing.length} emergent note(s).`,
      notes: [keyterm, ...missing.slice(0, 8)],
      recommendedAction: `Add explicit links from high-signal emergent notes back to ${keyterm}, or update the keyterm to link outward.`,
    })
  }
  return findings.slice(0, 100)
}

async function extractFormulaCandidates(note: NoteRecord): Promise<string[]> {
  let body = ''
  try {
    body = await readFile(path.join(ROOT, note.relPath), 'utf8')
  } catch {
    body = ''
  }
  const text = [note.title, ...note.headings.map((heading) => heading.text), ...note.conceptPhrases, body].join('\n')
  const formulas = new Set<string>()
  for (const pattern of FORMULA_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const value = match[0].replace(/\s+/g, ' ').trim()
      if (value.length >= 12 && value.length <= 140) formulas.add(value)
    }
  }
  return [...formulas]
}

async function findFormulaConflictCandidates(notes: NoteRecord[]): Promise<DriftFinding[]> {
  const formulaByFamily = new Map<string, Array<{ formula: string; note: string }>>()
  for (const note of notes) {
    if (!['canonical', 'emergent'].includes(note.authority)) continue
    for (const formula of await extractFormulaCandidates(note)) {
      const family = formula.toLowerCase().split(/\s*(?:\+|->|↓)\s*/)[0]?.trim()
      if (!family || family.length < 4) continue
      const bucket = formulaByFamily.get(family) ?? []
      bucket.push({ formula, note: note.relPath })
      formulaByFamily.set(family, bucket)
    }
  }

  const findings: DriftFinding[] = []
  for (const [family, entries] of formulaByFamily.entries()) {
    const uniqueFormulas = [...new Set(entries.map((entry) => entry.formula))]
    const uniqueNotes = [...new Set(entries.map((entry) => entry.note))]
    if (uniqueFormulas.length < 2 || uniqueNotes.length < 2) continue
    findings.push({
      type: 'formula-conflict-candidate',
      severity: 'medium',
      concept: family,
      summary: `Multiple formulas or pipeline expressions may be competing around "${family}".`,
      notes: uniqueNotes.slice(0, 8),
      recommendedAction: `Compare formulas: ${uniqueFormulas.slice(0, 4).join(' | ')}`,
    })
  }
  return findings.slice(0, 60)
}

function severityRank(severity: DriftSeverity): number {
  return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1
}

function typeRank(type: DriftType): number {
  return {
    'stub-with-emergent': 6,
    'missing-keyterm-backlink': 5,
    'emergent-without-canonical': 4,
    'formula-conflict-candidate': 3,
    'canonical-with-emergent': 2,
    'duplicate-title': 1,
  }[type]
}

function renderFindings(findings: DriftFinding[]): string {
  if (!findings.length) return '_No findings._'
  return findings
    .map(
      (finding, index) => `### ${index + 1}. [${finding.severity}] ${finding.summary}

- Type: \`${finding.type}\`
- Concept: ${finding.concept ?? '_n/a_'}
- Recommended action: ${finding.recommendedAction}
- Notes:
${finding.notes.map((note) => `  - \`${note}\``).join('\n')}
`
    )
    .join('\n')
}

function renderReport(findings: DriftFinding[], generatedAt: string): string {
  const high = findings.filter((finding) => finding.severity === 'high').length
  const medium = findings.filter((finding) => finding.severity === 'medium').length
  const low = findings.filter((finding) => finding.severity === 'low').length
  const byType = findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.type] = (acc[finding.type] ?? 0) + 1
    return acc
  }, {})

  return `# Library Ontology Drift Report

Generated: ${generatedAt}

## Summary

- Findings: ${findings.length}
- High: ${high}
- Medium: ${medium}
- Low: ${low}

## Findings By Type

${Object.entries(byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Top Findings

${renderFindings(findings.slice(0, 60))}
`
}

async function main() {
  const notesOutput = await readJson<{ notes: NoteRecord[] }>(path.join(OUTPUT_DIR, 'notes.json'))
  const links = await readJson<LinksOutput>(path.join(OUTPUT_DIR, 'links.json'))
  const concepts = await readJson<ConceptsOutput>(path.join(OUTPUT_DIR, 'concepts.json'))
  const notes = notesOutput.notes

  const findings = [
    ...findStubEmergentDrift(concepts.concepts),
    ...findMissingKeytermBacklinks(concepts.concepts, links),
    ...findEmergentWithoutCanonical(concepts.concepts),
    ...findCanonicalWithEmergent(concepts.concepts),
    ...(await findFormulaConflictCandidates(notes)),
    ...findDuplicateTitles(links),
  ].sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || typeRank(b.type) - typeRank(a.type) || a.summary.localeCompare(b.summary))

  const generatedAt = new Date().toISOString()
  const stamp = todayStamp()
  await mkdir(DRIFT_DIR, { recursive: true })
  await mkdir(LOG_DIR, { recursive: true })

  const jsonPath = path.join(DRIFT_DIR, `library-ontology-drift-${stamp}.json`)
  const markdownPath = path.join(LOG_DIR, `LIBRARY_ONTOLOGY_DRIFT_${stamp}.md`)

  await writeFile(jsonPath, `${JSON.stringify({ generatedAt, findings }, null, 2)}\n`)
  await writeFile(markdownPath, renderReport(findings, generatedAt))

  console.log(`Drift findings: ${findings.length}`)
  console.log(`High: ${findings.filter((finding) => finding.severity === 'high').length}`)
  console.log(`Medium: ${findings.filter((finding) => finding.severity === 'medium').length}`)
  console.log(`Low: ${findings.filter((finding) => finding.severity === 'low').length}`)
  console.log(`JSON: ${path.relative(ROOT, jsonPath)}`)
  console.log(`Markdown: ${path.relative(ROOT, markdownPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
