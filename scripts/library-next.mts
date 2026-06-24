import { mkdir, readdir, readFile, writeFile } from 'fs/promises'
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
  tags: string[]
  outgoingLinks: string[]
  conceptPhrases: string[]
  mtimeMs: number
  wordCount: number
  authority: AuthorityLayer
}

type DriftSeverity = 'high' | 'medium' | 'low'
type DriftFinding = {
  type: string
  severity: DriftSeverity
  concept?: string
  summary: string
  notes: string[]
  recommendedAction: string
}

type NextWorkItem = {
  rank: number
  title: string
  mode: 'merge' | 'index' | 'spec' | 'capture' | 'implementation'
  rationale: string
  supportingNotes: string[]
  command?: string
}

type NextPrompt = {
  note: string
  title: string
  prompt: string
}

const ROOT = process.cwd()
const OUTPUT_DIR = path.join(ROOT, 'output', 'library-index')
const DRIFT_DIR = path.join(OUTPUT_DIR, 'drift')
const LOG_DIR = path.join(ROOT, 'The Library', '01 Daily Notes', 'LOGS')

const STRATEGIC_CONCEPTS = [
  'daemon capture',
  'bars engine',
  'bar pipeline',
  'emotional alchemy',
  'allyship',
  'quest',
  'show up',
  'campaign',
  'move generation',
  'domain',
  'orientation',
]

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T
}

function todayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10)
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

async function latestDriftJson(): Promise<string> {
  const files = await readdir(DRIFT_DIR)
  const driftFiles = files
    .filter((file) => /^library-ontology-drift-\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort((a, b) => b.localeCompare(a))
  if (!driftFiles.length) throw new Error('No drift report found. Run npm run library:drift first.')
  return path.join(DRIFT_DIR, driftFiles[0])
}

function severityScore(severity: DriftSeverity): number {
  return severity === 'high' ? 100 : severity === 'medium' ? 50 : 15
}

function typeScore(type: string): number {
  return {
    'stub-with-emergent': 45,
    'missing-keyterm-backlink': 35,
    'emergent-without-canonical': 30,
    'formula-conflict-candidate': 25,
    'canonical-with-emergent': 15,
    'duplicate-title': 10,
  }[type] ?? 0
}

function strategicScore(concept?: string): number {
  if (!concept) return 0
  const conceptSlug = slug(concept)
  return STRATEGIC_CONCEPTS.some((target) => conceptSlug.includes(target) || target.includes(conceptSlug)) ? 75 : 0
}

function clusterFindings(findings: DriftFinding[]): Map<string, DriftFinding[]> {
  const clusters = new Map<string, DriftFinding[]>()
  for (const finding of findings) {
    const key = slug(finding.concept || finding.summary)
    if (!key) continue
    const current = clusters.get(key) ?? []
    current.push(finding)
    clusters.set(key, current)
  }
  return clusters
}

function rankClusters(findings: DriftFinding[]): Array<{ key: string; score: number; findings: DriftFinding[] }> {
  return [...clusterFindings(findings).entries()]
    .map(([key, cluster]) => {
      const score = cluster.reduce(
        (sum, finding) => sum + severityScore(finding.severity) + typeScore(finding.type) + strategicScore(finding.concept),
        0
      )
      return { key, score, findings: cluster }
    })
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
}

function recentHighSignalNotes(notes: NoteRecord[]): NoteRecord[] {
  return notes
    .filter((note) => ['canonical', 'emergent'].includes(note.authority))
    .filter((note) => !note.relPath.includes('/01 Daily Notes/LOGS/'))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 12)
}

async function extractNextPrompts(notes: NoteRecord[]): Promise<NextPrompt[]> {
  const candidates = notes
    .filter((note) => ['canonical', 'emergent', 'source'].includes(note.authority))
    .filter((note) => !note.relPath.includes('/01 Daily Notes/LOGS/'))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 120)

  const prompts: NextPrompt[] = []
  for (const note of candidates) {
    let body = ''
    try {
      body = await readFile(path.join(ROOT, note.relPath), 'utf8')
    } catch {
      continue
    }

    const lines = body.split(/\r?\n/)
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index].trim()
      if (!/next (question|extraction|thing|step|inventory|work)|what .* next|so next/i.test(line)) continue
      const window = lines.slice(index, index + 5).map((entry) => entry.trim()).filter(Boolean)
      const prompt = window.join(' ')
      if (prompt.length < 12) continue
      prompts.push({ note: note.relPath, title: note.title, prompt })
      break
    }
  }

  return prompts.slice(0, 8)
}

function compactUnique(values: string[], limit = 8): string[] {
  return [...new Set(values)].slice(0, limit)
}

function modeForFinding(finding: DriftFinding): NextWorkItem['mode'] {
  if (finding.type === 'stub-with-emergent' || finding.type === 'canonical-with-emergent') return 'merge'
  if (finding.type === 'emergent-without-canonical' || finding.type === 'missing-keyterm-backlink') return 'index'
  if (finding.type === 'formula-conflict-candidate') return 'spec'
  return 'capture'
}

function titleForCluster(cluster: DriftFinding[]): string {
  const primary = cluster[0]
  if (primary.type === 'stub-with-emergent') return `Promote ${primary.concept} from drift into a real keyterm`
  if (primary.type === 'missing-keyterm-backlink') return `Repair backlinks around ${primary.concept}`
  if (primary.type === 'emergent-without-canonical') return `Create a bridge note for ${primary.concept}`
  if (primary.type === 'formula-conflict-candidate') return `Resolve competing formulas around ${primary.concept}`
  return primary.summary
}

function buildWorkItems(findings: DriftFinding[], notes: NoteRecord[]): NextWorkItem[] {
  const ranked = rankClusters(findings)
  const recent = recentHighSignalNotes(notes)
  const items: NextWorkItem[] = []

  for (const cluster of ranked) {
    const primary = cluster.findings.find((finding) => finding.severity === 'high') ?? cluster.findings[0]
    const supportingNotes = compactUnique(cluster.findings.flatMap((finding) => finding.notes), 10)
    items.push({
      rank: items.length + 1,
      title: titleForCluster(cluster.findings),
      mode: modeForFinding(primary),
      rationale: `${cluster.findings.length} drift signal(s), highest severity ${primary.severity}. ${primary.recommendedAction}`,
      supportingNotes,
      command: primary.concept ? `npm run library:query -- "${primary.concept}"` : undefined,
    })
    if (items.length >= 2) break
  }

  const recentNotes = recent.filter((note) => {
    const noteSlug = slug(`${note.title} ${note.tags.join(' ')} ${note.conceptPhrases.join(' ')}`)
    return STRATEGIC_CONCEPTS.some((concept) => noteSlug.includes(concept))
  })

  items.push({
    rank: items.length + 1,
    title: 'Review the newest high-signal Library additions before the next merge pass',
    mode: 'capture',
    rationale: 'Recent canonical/emergent notes are where the living ontology is changing fastest; reviewing them prevents the index layer from lagging behind the work.',
    supportingNotes: compactUnique((recentNotes.length ? recentNotes : recent).map((note) => note.relPath), 10),
    command: 'npm run library:drift',
  })

  return items.slice(0, 3).map((item, index) => ({ ...item, rank: index + 1 }))
}

function renderWorkItem(item: NextWorkItem): string {
  return `## ${item.rank}. ${item.title}

- Mode: \`${item.mode}\`
- Rationale: ${item.rationale}
${item.command ? `- Helpful command: \`${item.command}\`\n` : ''}- Supporting notes:
${item.supportingNotes.map((note) => `  - \`${note}\``).join('\n')}
`
}

function renderPrompts(prompts: NextPrompt[]): string {
  if (!prompts.length) return '_No unresolved next prompts found in recent high-signal notes._'
  return prompts.map((prompt) => `- ${prompt.prompt}\n  - Source: \`${prompt.note}\``).join('\n')
}

function renderReport(items: NextWorkItem[], prompts: NextPrompt[], generatedAt: string, driftPath: string): string {
  return `# Library Next Work Report

Generated: ${generatedAt}

Source drift report: \`${path.relative(ROOT, driftPath)}\`

## Top 3 Next Work Items

${items.map(renderWorkItem).join('\n')}

## Recent Next Prompts

${renderPrompts(prompts)}
`
}

async function main() {
  const driftPath = await latestDriftJson()
  const drift = await readJson<{ findings: DriftFinding[] }>(driftPath)
  const notesOutput = await readJson<{ notes: NoteRecord[] }>(path.join(OUTPUT_DIR, 'notes.json'))
  const generatedAt = new Date().toISOString()
  const stamp = todayStamp()
  const items = buildWorkItems(drift.findings, notesOutput.notes)
  const prompts = await extractNextPrompts(notesOutput.notes)

  await mkdir(LOG_DIR, { recursive: true })
  const jsonPath = path.join(OUTPUT_DIR, `library-next-${stamp}.json`)
  const markdownPath = path.join(LOG_DIR, `LIBRARY_NEXT_WORK_${stamp}.md`)

  await writeFile(jsonPath, `${JSON.stringify({ generatedAt, sourceDriftReport: path.relative(ROOT, driftPath), items, prompts }, null, 2)}\n`)
  await writeFile(markdownPath, renderReport(items, prompts, generatedAt, driftPath))

  console.log('Top next work:')
  for (const item of items) console.log(`${item.rank}. [${item.mode}] ${item.title}`)
  console.log(`JSON: ${path.relative(ROOT, jsonPath)}`)
  console.log(`Markdown: ${path.relative(ROOT, markdownPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
