#!/usr/bin/env npx tsx
/**
 * Sage Backlog Assessment — compost, merge, develop.
 *
 * Assesses the backlog in light of app direction: what can be composted (archived),
 * merged (consolidated), or developed further. Calls Sage backend if available;
 * otherwise produces a heuristic-based assessment.
 *
 * Usage:
 *   npm run sage:backlog-assess
 *   npm run sage:backlog-assess -- --backend http://localhost:8000
 *   npm run sage:backlog-assess -- --no-auto-start (fail if backend not running; do not auto-start)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { ensureBackendReady } from '../src/lib/backend-health'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

function flag(name: string): string | null {
  const eqForm = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (eqForm) return eqForm.split('=').slice(1).join('=')
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1]
  }
  return null
}

const BACKEND_URL =
  flag('backend') ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
const NO_AUTO_START = process.argv.includes('--no-auto-start')

interface BacklogItem {
  id: string
  name: string
  category: string
  status: string
  dependencies: string
}

function parseBacklog(): { items: BacklogItem[]; ready: BacklogItem[]; done: BacklogItem[]; superseded: BacklogItem[] } {
  const mdPath = join(process.cwd(), '.specify', 'backlog', 'BACKLOG.md')
  if (!existsSync(mdPath)) return { items: [], ready: [], done: [], superseded: [] }

  const lines = readFileSync(mdPath, 'utf-8').split('\n')
  const items: BacklogItem[] = []

  for (const line of lines) {
    const match = line.match(/^\|\s*[\d.*(]+[^|]*\|\s*\*{0,2}([A-Z0-9]{1,5})\*{0,2}\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)/)
    if (!match) continue
    const [, id, nameRaw, categoryRaw, statusRaw, depsRaw] = match
    const name = nameRaw.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*+/g, '').trim()
    items.push({
      id: id.trim(),
      name,
      category: categoryRaw.trim(),
      status: statusRaw.trim(),
      dependencies: depsRaw?.trim() ?? '',
    })
  }

  const ready = items.filter((i) => i.status.includes('[ ] Ready'))
  const done = items.filter((i) => i.status.includes('[x] Done'))
  const superseded = items.filter((i) => i.status.includes('Superseded'))

  return { items, ready, done, superseded }
}

function loadAppDirection(): string {
  const files = [
    join(process.cwd(), 'FOUNDATIONS.md'),
    join(process.cwd(), '.specify', 'memory', 'conceptual-model.md'),
  ]
  let out = ''
  for (const p of files) {
    if (existsSync(p)) {
      out += readFileSync(p, 'utf-8').slice(0, 3000) + '\n\n'
    }
  }
  return out || 'BARs Engine: quests, vibeulons, emotional alchemy, Bruised Banana campaign, Game Master faces.'
}

async function callSage(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.output?.synthesis ?? null
  } catch {
    return null
  }
}

/** Why Sage might return no synthesis — surfaces openai_configured from /api/health */
async function explainSageFallback(): Promise<void> {
  const base = BACKEND_URL.replace(/\/$/, '')
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) {
      console.warn(
        '\n⚠ Sage consult failed: /api/health not OK — check backend logs and route errors.'
      )
      return
    }
    const data = (await res.json()) as { openai_configured?: boolean }
    if (data.openai_configured === true) {
      console.warn(
        '\n⚠ Sage consult returned no synthesis but openai_configured is true — check /api/agents/sage/consult logs, timeouts, or model errors.'
      )
      return
    }
    console.warn(
      [
        '\n⚠ Sage consult skipped — backend reports openai_configured: false.',
        '  Fix (pick one):',
        '    • Add OPENAI_API_KEY=sk-... to repo .env.local (recommended) or repo .env',
        '    • Optional: backend/backend/.env for backend-only secrets',
        '    • Restart backend: npm run dev:backend',
        '  Verify: curl -s ' + base + '/api/health | grep openai',
        '  Doc: docs/AGENT_WORKFLOWS.md (section "OPENAI_API_KEY and backend")',
      ].join('\n')
    )
  } catch {
    console.warn(
      '\n⚠ Could not reach ' + base + '/api/health to diagnose Sage fallback.'
    )
  }
}

function synthesizeLocalAssessment(
  ready: BacklogItem[],
  superseded: BacklogItem[],
  appDirection: string
): string {
  const lines: string[] = [
    '# Sage Backlog Assessment',
    '',
    `**Date**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    '## App Direction (Summary)',
    '',
    'BARs Engine: quests as kernels, vibeulons, emotional alchemy, Bruised Banana campaign, Game Master faces, 4 moves (Wake/Clean/Grow/Show), allyship domains. Version management for quests; campaign deck = backlog.',
    '',
    '## Compost (Archive / Deprecate)',
    '',
    superseded.length > 0
      ? [
          'Items that no longer align with current direction or have been fully superseded:',
          '',
          ...superseded.slice(0, 15).map((i) => `- **[${i.id}]** ${i.name} — already marked Superseded`),
          '',
          '**Recommendation**: Run `npm run compost:backlog` to move to [ARCHIVE.md](.specify/backlog/ARCHIVE.md).',
        ]
      : ['Done/Superseded items are in [ARCHIVE.md](.specify/backlog/ARCHIVE.md). Main backlog is composted.'],
    '',
    '## Merge (Consolidate)',
    '',
    'Candidates for consolidation:',
    '',
    '- **Avatar cluster** (AVS, AW, AX, AY, BG, BH, BJ): Avatar System Strategy (AVS) bundles these. Mark superseded items as folded into AVS.',
    '- **Transformation pipeline** (ED, EE, EF, EG, EZ, EH, EI, FK, FL, FO, FN): Narrative Transformation Engine and downstream. Consider a single "Transformation Pipeline v0" meta-spec.',
    '- **Campaign/RACI cluster** (GA, GB, GC, GH, GJ, GK): BAR Response, Quest Stewardship, Event Campaign, Campaign Playbook, Campaign Invitation. Share RACI/role resolution. Merge into phased "Campaign Engine" spec.',
    '- **Onboarding quest generation** (DJ, DK): Already sequenced. DK cert depends on DJ. Keep as-is.',
    '',
    '## Develop (Prioritize for Next Phase)',
    '',
    'High-leverage items aligned with app direction:',
    '',
    '1. **AVS** — Avatar System Strategy (deps met). Unifies avatar work.',
    '2. **AZ** — Book-to-Quest Library. PDF ingestion, Quest Library, Grow Up. No deps.',
    '3. **EJ** — Admin Agent Forge. 3-2-1 Forge, distortion gate, vibeulon routing. No deps.',
    '4. **EM** — CYOA Certification Quests. Quality gate for onboarding.',
    '5. **DL** — Campaign Map Phase 1. Extends gameboard; Layer 1–3.',
    '6. **DT** — Flow Simulator CLI. Bruised Banana fixtures; simulation harness (folded former DQ).',
    '',
    '## Watch Out',
    '',
    '- Done/Superseded items live in [ARCHIVE.md](.specify/backlog/ARCHIVE.md). Main backlog shows only actionable work (~45 Ready). Run `npm run compost:backlog` to re-compost after marking items Done.',
    '- Some Ready items have unmet deps; verify before starting.',
    '',
  ]
  return lines.join('\n')
}

async function main() {
  try {
    await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  }

  console.log('Parsing backlog...')
  const { ready, superseded } = parseBacklog()
  const appDirection = loadAppDirection()

  const prompt = `You are the Sage — the integration and coordination face of the BARS Engine.

**App direction** (from FOUNDATIONS and conceptual-model):
${appDirection.slice(0, 2000)}

**Backlog context**:
- Ready items: ${ready.length}
- Superseded items: ${superseded.length}

**Sample Ready items** (top 20):
${ready.slice(0, 20).map((i) => `- [${i.id}] ${i.name} (${i.category})`).join('\n')}

**Sample Superseded**:
${superseded.slice(0, 10).map((i) => `- [${i.id}] ${i.name}`).join('\n')}

**Task**: Assess the backlog. Output a structured markdown report with:

## Compost (Archive / Deprecate)
Items that no longer align with current direction, are fully superseded, or should be archived. Include rationale.

## Merge (Consolidate)
Items that could be merged into a single spec or phased initiative. Identify clusters and suggest a consolidation plan.

## Develop (Prioritize for Next Phase)
Top 5–10 items to develop next, in light of app direction. Explain why each aligns. Order by leverage.

## Watch Out
1–2 risks or dependencies to be aware of when executing.

Be concise. Reference backlog IDs.`

  console.log('Consulting Sage...')
  const synthesis = await callSage(prompt)

  const outDir = join(process.cwd(), '.specify', 'backlog')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, 'SAGE_ASSESSMENT.md')

  let content: string
  if (synthesis) {
    content = [
      '# Sage Backlog Assessment',
      '',
      `**Date**: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      '',
      '---',
      '',
      synthesis,
    ].join('\n')
    console.log('✓ Sage consulted')
  } else {
    await explainSageFallback()
    content = synthesizeLocalAssessment(ready, superseded, appDirection)
    console.log(
      '✓ Wrote local synthesis (deterministic template). For live Sage: fix OPENAI above, then re-run.'
    )
  }

  writeFileSync(outPath, content)
  console.log(`\n📄 Assessment written to ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
