#!/usr/bin/env npx tsx
/**
 * sage-brief v2 — Deft daily operational context brief from the Sage agent.
 *
 * Feeds the Sage structured context (not raw markdown): open backlog as parsed
 * objects, recently completed items, build/schema status, branch divergence.
 * Constrains the Sage to canonical WAVE move names and a scannable output format.
 *
 * Usage:
 *   npm run sage:brief
 *   npm run sage:brief -- --question "Ready to push to main?"
 *   npm run sage:brief -- --format brief        (single-line output)
 *   npm run sage:brief -- --top 15
 *   npm run sage:brief -- --backend http://localhost:8000
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------

function flag(name: string): string | null {
  const eqForm = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (eqForm) return eqForm.split('=').slice(1).join('=')
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1]
  }
  return null
}

const BACKEND_URL = flag('backend') ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const TOP_N = parseInt(flag('top') ?? '10') || 10
const FORMAT = (flag('format') ?? 'full') as 'full' | 'brief'
const CUSTOM_QUESTION = flag('question')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpenItem {
  id: string
  name: string
  category: string
  dependencies: string
}

interface BriefContext {
  date: string
  branch: string
  commitsAheadOfMain: number
  buildStatus: 'passing' | 'failing' | 'unknown'
  schemaDirty: boolean
  recentCommits: string[]
  completedRecently: string[]
  openItems: OpenItem[]
}

// ---------------------------------------------------------------------------
// Context compiler
// ---------------------------------------------------------------------------

function git(cmd: string, fallback = ''): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return fallback
  }
}

function getCommitsAheadOfMain(): number {
  const raw = git('git rev-list origin/main..HEAD --count', '0')
  return parseInt(raw) || 0
}

function getBuildStatus(): 'passing' | 'failing' | 'unknown' {
  const buildId = join(process.cwd(), '.next', 'BUILD_ID')
  if (!existsSync(buildId)) return 'unknown'
  const ageMs = Date.now() - statSync(buildId).mtimeMs
  return ageMs < 10 * 60 * 1000 ? 'passing' : 'unknown'
}

function getSchemaDirty(): boolean {
  const diff = git('git diff --name-only HEAD -- prisma/', '')
  return diff.length > 0
}

function getRecentCommits(): string[] {
  const raw = git('git log --oneline --since="48 hours ago" --max-count=20', '')
  return raw ? raw.split('\n').filter(Boolean) : []
}

function parseBacklogItems(topN: number): { open: OpenItem[]; completedIds: Set<string> } {
  // Prefer structured items.json if available
  const jsonPath = join(process.cwd(), '.specify', 'backlog', 'items.json')
  if (existsSync(jsonPath)) {
    try {
      const { items } = JSON.parse(readFileSync(jsonPath, 'utf-8'))
      const open: OpenItem[] = (items as { id: string; featureName: string; category: string; dependencies: string; status: string }[])
        .filter((i) => i.status !== 'Done' && i.status !== 'In-Progress')
        .slice(0, topN)
        .map((i) => ({ id: i.id, name: i.featureName, category: i.category, dependencies: i.dependencies || '' }))
      const completedIds = new Set<string>(
        (items as { id: string; status: string }[]).filter((i) => i.status === 'Done').map((i) => i.id)
      )
      return { open, completedIds }
    } catch {
      // fall through to markdown parse
    }
  }

  // Fallback: parse BACKLOG.md
  const mdPath = join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')
  if (!existsSync(mdPath)) return { open: [], completedIds: new Set() }

  const lines = readFileSync(mdPath, 'utf-8').split('\n')
  const open: OpenItem[] = []
  const completedIds = new Set<string>()

  for (const line of lines) {
    // Parse table rows: | priority | ID | name | category | status | deps |
    const match = line.match(/^\|\s*[\d.*(]+[^|]*\|\s*\*{0,2}([A-Z]{1,3}[0-9]*)\*{0,2}\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)/)
    if (!match) continue
    const [, id, nameRaw, categoryRaw, statusRaw, depsRaw] = match
    const status = statusRaw.trim()
    if (status.includes('[x]')) {
      completedIds.add(id.trim())
    } else if (status.includes('[ ]') && open.length < topN) {
      // Strip markdown from name (links, bold)
      const name = nameRaw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*+/g, '').trim()
      open.push({ id: id.trim(), name, category: categoryRaw.trim(), dependencies: depsRaw.trim() })
    }
  }

  return { open, completedIds }
}

function getCompletedRecently(recentCommits: string[], completedIds: Set<string>): string[] {
  // Find backlog IDs mentioned in recent commit messages
  const found: string[] = []
  for (const commit of recentCommits) {
    for (const id of completedIds) {
      if (commit.includes(id) && !found.includes(id)) found.push(id)
    }
  }
  return found
}

function compileContext(): BriefContext {
  const branch = git('git branch --show-current', 'unknown')
  const recentCommits = getRecentCommits()
  const { open, completedIds } = parseBacklogItems(TOP_N)
  const completedRecently = getCompletedRecently(recentCommits, completedIds)

  return {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    branch,
    commitsAheadOfMain: getCommitsAheadOfMain(),
    buildStatus: getBuildStatus(),
    schemaDirty: getSchemaDirty(),
    recentCommits,
    completedRecently,
    openItems: open,
  }
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildPrompt(ctx: BriefContext): string {
  const buildNote = ctx.buildStatus === 'passing'
    ? 'passing (recent)'
    : ctx.buildStatus === 'failing'
    ? 'FAILING'
    : 'unknown (npm run build not recently run)'

  const lines: string[] = [
    `Current date: ${ctx.date}`,
    `Branch: ${ctx.branch} (${ctx.commitsAheadOfMain} commits ahead of main)`,
    `Build status: ${buildNote}`,
    `Schema migration pending: ${ctx.schemaDirty ? 'YES — run npm run db:sync' : 'no'}`,
    '',
  ]

  if (ctx.recentCommits.length > 0) {
    lines.push('Recently completed (last 48h):')
    for (const c of ctx.recentCommits) lines.push(`- ${c}`)
    lines.push('')
  }

  if (ctx.completedRecently.length > 0) {
    lines.push(`Backlog items resolved in recent commits: ${ctx.completedRecently.join(', ')}`)
    lines.push('')
  }

  if (ctx.openItems.length > 0) {
    lines.push(`Open backlog (top ${ctx.openItems.length}):`)
    for (const item of ctx.openItems) {
      const deps = item.dependencies && item.dependencies !== '-' ? ` — deps: ${item.dependencies}` : ''
      lines.push(`- [${item.id}] ${item.name} (${item.category})${deps}`)
    }
    lines.push('')
  }

  lines.push('What is the highest-leverage next move?')
  lines.push('IMPORTANT: Your discerned_move field MUST be exactly one of: wake_up, clean_up, grow_up, show_up.')
  lines.push('')
  lines.push('Format your synthesis as:')
  lines.push('## Do Next')
  lines.push('(1–3 specific, actionable bullets referencing actual backlog IDs or commands)')
  lines.push('## Why')
  lines.push('(1–2 sentences explaining the reasoning)')
  lines.push('## Watch Out')
  lines.push('(1 sentence: the most important risk or dependency to be aware of)')
  lines.push('## Hexagram Note')
  lines.push('(optional: 1 sentence if the hexagram adds meaningful context)')

  if (CUSTOM_QUESTION) {
    lines.push('')
    lines.push(`Additional question: ${CUSTOM_QUESTION}`)
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Sage call
// ---------------------------------------------------------------------------

interface SageOutput {
  synthesis: string
  discerned_move: string | null
  hexagram_alignment: { hexagram_number: number | null; alignment_score: number; interpretation: string } | null
  legibility_note: string | null
}

interface AgentResponse {
  output: SageOutput
  discerned_move: string | null
  deterministic: boolean
  usage_tokens: number | null
}

async function callSage(question: string): Promise<AgentResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!res.ok) {
      console.error(`Sage returned ${res.status}`)
      return null
    }
    return res.json()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`Could not reach Sage at ${BACKEND_URL}: ${msg}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Output formatter
// ---------------------------------------------------------------------------

const MOVE_EMOJI: Record<string, string> = {
  wake_up: '🌅',
  clean_up: '🧹',
  grow_up: '🌱',
  show_up: '🎯',
}

const CANONICAL_MOVES = new Set(['wake_up', 'clean_up', 'grow_up', 'show_up'])

function parseSection(synthesis: string, heading: string): string | null {
  const re = new RegExp(`##\\s*${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i')
  const m = synthesis.match(re)
  return m ? m[1].trim() : null
}

function formatFull(resp: AgentResponse, ctx: BriefContext): void {
  const move = resp.discerned_move ?? resp.output.discerned_move
  const canonicalMove = move && CANONICAL_MOVES.has(move) ? move : null
  const moveEmoji = canonicalMove ? MOVE_EMOJI[canonicalMove] : '❓'
  const hex = resp.output.hexagram_alignment
  const hexLabel = hex?.hexagram_number ? `Hexagram ${hex.hexagram_number}` : ''

  const headerParts = ['SAGE BRIEF']
  if (canonicalMove) headerParts.push(`${moveEmoji} ${canonicalMove}`)
  if (hexLabel) headerParts.push(hexLabel)

  const W = 60
  console.log('\n' + '═'.repeat(W))
  console.log(`  ${headerParts.join('  |  ')}`)
  if (resp.deterministic) console.log('  (deterministic — no AI key configured)')
  console.log('═'.repeat(W))

  const synthesis = resp.output.synthesis
  const doNext = parseSection(synthesis, 'Do Next')
  const why = parseSection(synthesis, 'Why')
  const watchOut = parseSection(synthesis, 'Watch Out')
  const hexNote = parseSection(synthesis, 'Hexagram Note')

  if (doNext || why || watchOut) {
    if (doNext) { console.log('\n## Do Next\n' + doNext) }
    if (why) { console.log('\n## Why\n' + why) }
    if (watchOut) { console.log('\n## Watch Out\n' + watchOut) }
    if (hexNote) { console.log('\n## Hexagram Note\n' + hexNote) }
    else if (hex?.hexagram_number) {
      console.log(`\n## Hexagram Note\n${hex.hexagram_number} — ${hex.interpretation}`)
    }
  } else {
    // Fallback: raw synthesis
    console.log('\n' + synthesis)
    if (hex?.hexagram_number) {
      console.log(`\nHexagram ${hex.hexagram_number} — ${hex.interpretation}`)
    }
  }

  // Context summary footer
  const flags = [
    ctx.buildStatus === 'passing' ? '✅ build' : ctx.buildStatus === 'failing' ? '❌ build' : '? build',
    ctx.schemaDirty ? '⚠️  db:sync needed' : '✅ schema',
    `${ctx.commitsAheadOfMain} ahead of main`,
  ]
  console.log('\n' + '─'.repeat(W))
  console.log(`  ${flags.join('  ·  ')}`)
  if (resp.usage_tokens) console.log(`  [tokens: ${resp.usage_tokens}]`)
  console.log('─'.repeat(W) + '\n')
}

function formatBrief(resp: AgentResponse): void {
  const move = resp.discerned_move ?? resp.output.discerned_move
  const canonicalMove = move && CANONICAL_MOVES.has(move) ? move : move ?? '?'
  const emoji = MOVE_EMOJI[canonicalMove] ?? '❓'

  const doNext = parseSection(resp.output.synthesis, 'Do Next')
  const watchOut = parseSection(resp.output.synthesis, 'Watch Out')

  // First bullet from Do Next
  const firstAction = doNext
    ? doNext.split('\n').find((l) => l.trim().startsWith('-'))?.replace(/^-\s*/, '') ?? doNext.split('\n')[0]
    : resp.output.synthesis.split('\n')[0]

  const watchNote = watchOut ? `Watch: ${watchOut.split('\n')[0].replace(/^[^:]*:\s*/, '')}` : ''

  const parts = [`${emoji} ${canonicalMove}`, firstAction, watchNote].filter(Boolean)
  console.log(parts.join('  |  '))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (FORMAT !== 'brief') console.log('Gathering context...')
  const ctx = compileContext()

  if (FORMAT !== 'brief') {
    console.log(`Branch: ${ctx.branch} | Backend: ${BACKEND_URL}`)
    if (CUSTOM_QUESTION) console.log(`Question: ${CUSTOM_QUESTION}`)
    console.log('Consulting Sage...')
  }

  const prompt = buildPrompt(ctx)
  const resp = await callSage(prompt)

  if (!resp) {
    console.log('Could not reach the Sage. Start the backend with: npm run dev:backend')
    process.exit(1)
  }

  if (FORMAT === 'brief') {
    formatBrief(resp)
  } else {
    formatFull(resp, ctx)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
