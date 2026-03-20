#!/usr/bin/env npx tsx
/**
 * Consult all 6 Game Masters on persistent build / schema / server-action errors
 * and strategies to prevent regressions (Next 16 + Turbopack, Prisma, 'use server').
 *
 * Usage:
 *   npm run strand:consult:build-reliability
 *
 * Requires: Backend (npm run dev:backend), OPENAI_API_KEY in .env.local for non-deterministic output.
 * Output: .specify/specs/build-reliability/STRAND_CONSULT_LIVE.md
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ensureBackendReady } from '../src/lib/backend-health'

const NO_AUTO_START = process.argv.includes('--no-auto-start')

const backendIdx = process.argv.indexOf('--backend')
const next = process.argv[backendIdx + 1]
const backendArg =
  backendIdx >= 0 && next && !next.startsWith('--')
    ? next
    : process.argv.find((a) => a.startsWith('--backend='))?.slice('--backend='.length)
const BACKEND_URL = backendArg || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

const CONTEXT = `
## Context: persistent errors (BARS Engine)

During Events BAR / nested pre-production work we repeatedly hit:

1. Next.js 16 + Turbopack: \`export type { X }\` from a \`'use server'\` file → build fails (type-only export has no runtime binding in server action barrel).
2. Prisma: invalid block comment placement in model body → schema validation fails.
3. Prisma: relation fields pointing at a missing model (e.g. NpcProfile) → full schema invalid until removed or completed.
4. Prisma Client stale vs schema → TypeScript errors on new fields until \`prisma generate\`.
5. DB sync / migrate drift → raw SQL vs ORM mismatches and route 500s.

**Question for each face:** What is your recommendation to reduce recurrence? What should we automate vs document? What is overkill?

**Sage merge:** Synthesize into a prioritized 5-item playbook (technical + process) and call out one "generative dependency" that eliminates entire error classes.
`

const ARCHITECT_TASK = `[Build reliability — Architect]

Focus: module boundaries, Prisma schema completeness, API/server-action surfaces.

${CONTEXT}

Respond in **reasoning**: concrete structural rules (export policy, where types live, migration ordering).`

const REGENT_TASK = `[Build reliability — Regent]

Focus: governance, merge order, when to block a PR, production DB safety.

${CONTEXT}

Respond in **reasoning**: non-negotiables vs negotiables, checklist authority.`

const CHALLENGER_TASK = `[Build reliability — Challenger]

Focus: push back on over-automation, scope creep, and false certainty.

${CONTEXT}

Respond in **reasoning**: what we should NOT do; what problems are self-inflicted.`

const DIPLOMAT_TASK = `[Build reliability — Diplomat]

Focus: onboarding, communication between roles, reducing blame between "frontend" and "backend."

${CONTEXT}

Respond in **reasoning**: short docs, naming, where to put the "types live here" rule.`

const SHAMAN_TASK = `[Build reliability — Shaman]

Focus: team fatigue, recurring friction, ritualizing quality without grinding the soul.

${CONTEXT}

Respond in **reasoning**: emotional/process layer paired with technical fixes.`

const SAGE_MERGE_QUESTION = (
  architect: string,
  regent: string,
  challenger: string,
  diplomat: string,
  shaman: string
) => `You are the Sage. Five faces have responded on build reliability for a Next.js + Prisma monorepo.

**Architect:**
${architect}

**Regent:**
${regent}

**Challenger:**
${challenger}

**Diplomat:**
${diplomat}

**Shaman:**
${shaman}

Produce:
1. A **prioritized 5-item playbook** (mix of technical automation and lightweight process).
2. One **generative dependency** — one change that eliminates a whole class of errors.
3. What to **defer** (Challenger’s cuts).

Be concise, actionable, and structured.`

async function sageConsult(question: string): Promise<{ synthesis: string; consulted_agents?: string[] }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error(`Sage consult failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const output = data.output ?? data
  return {
    synthesis: typeof output === 'string' ? output : (output.synthesis ?? JSON.stringify(output)),
    consulted_agents: output.consulted_agents ?? [],
  }
}

async function faceTask(face: string, task: string): Promise<{ reasoning?: string; output?: unknown }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/${face}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, feature_id: 'build-reliability' }),
  })
  if (!res.ok) throw new Error(`${face} task failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const out = (data.output ?? data) as Record<string, unknown>
  return {
    reasoning: out?.reasoning as string | undefined,
    output: out,
  }
}

function formatFallback(out: unknown): string {
  if (typeof out === 'string') return out
  if (out && typeof out === 'object') {
    const o = out as Record<string, unknown>
    if (o.reasoning) return String(o.reasoning)
  }
  return '```json\n' + JSON.stringify(out, null, 2) + '\n```'
}

async function main() {
  console.log('Strand consult: build reliability (all 6 Game Masters)\n')
  console.log(`Backend: ${BACKEND_URL}\n`)

  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })

  console.log('1. Sage (initial routing)...')
  const sageInitial = await sageConsult(CONTEXT)

  console.log('2. Architect...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)
  console.log('3. Regent...')
  const regentResult = await faceTask('regent', REGENT_TASK)
  console.log('4. Challenger...')
  const challengerResult = await faceTask('challenger', CHALLENGER_TASK)
  console.log('5. Diplomat...')
  const diplomatResult = await faceTask('diplomat', DIPLOMAT_TASK)
  console.log('6. Shaman...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('7. Sage (merge)...')
  const sageMerge = await sageConsult(
    SAGE_MERGE_QUESTION(
      architectResult.reasoning || formatFallback(architectResult.output),
      regentResult.reasoning || formatFallback(regentResult.output),
      challengerResult.reasoning || formatFallback(challengerResult.output),
      diplomatResult.reasoning || formatFallback(diplomatResult.output),
      shamanResult.reasoning || formatFallback(shamanResult.output)
    )
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'build-reliability')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'STRAND_CONSULT_LIVE.md')

  const staticHint = existsSync(join(outputDir, 'STRAND_CONSULT.md'))
    ? readFileSync(join(outputDir, 'STRAND_CONSULT.md'), 'utf-8').split('\n')[0]
    : 'See STRAND_CONSULT.md in this folder.'

  const markdown = `# Strand consult (live) — Build reliability

**Generated:** ${new Date().toISOString()}
**Command:** \`npm run strand:consult:build-reliability\`
**Static AAR + desk strand:** ${staticHint}

---

## Sage (initial)

${sageInitial.synthesis}

*consulted_agents:* ${(sageInitial.consulted_agents ?? []).join(', ') || 'n/a'}

---

## Architect

${architectResult.reasoning || formatFallback(architectResult.output)}

---

## Regent

${regentResult.reasoning || formatFallback(regentResult.output)}

---

## Challenger

${challengerResult.reasoning || formatFallback(challengerResult.output)}

---

## Diplomat

${diplomatResult.reasoning || formatFallback(diplomatResult.output)}

---

## Shaman

${shamanResult.reasoning || formatFallback(shamanResult.output)}

---

## Sage (merged playbook)

${sageMerge.synthesis}

`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\nWrote ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
