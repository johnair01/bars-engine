#!/usr/bin/env npx tsx
/**
 * Consult Architect and Regent on strand system open questions.
 *
 * Uses the Sage to route to Architect and Regent, then fetches Architect and
 * Regent directly for parallel consultation. Sage synthesis + individual
 * responses are combined.
 *
 * Usage:
 *   npm run strand:consult
 *   # or with explicit backend:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npx tsx scripts/strand-consult-architect-regent.ts
 *
 * Requires: Backend running (npm run dev:backend)
 * Output: .specify/specs/strand-system-bars/ARCHITECT_REGENT_CONSULT.md
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { writeFileSync, mkdirSync } from 'fs'
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

const CONSULT_QUESTION = `I need your expertise on the Strand System for BARS Engine — a multi-agent investigation framework.

Please consult the Architect (for schema, structure, strategy) and the Regent (for order, rules, campaign structure) and synthesize their views on:

**Q1 — Strand-as-BAR Schema**: What fields must the strand BAR record to support replay, provenance (output BARs + git branch), and agent self-advocacy? Propose a minimal schema.

**Q2 — Dodo Agent → Sect Mapping**: Dodo has L1 (researcher, codemedic, ontology_interviewer, etc.), L2 (artificer, chronicler, architect, ontologist), L3 (coordinator, composer, fair_witness). BARS has 6 sects: Shaman, Challenger, Regent, Architect, Diplomat, Sage. Map dodo agents to BARS sects.

**Q3 — Ethos → Stat Mapping**: Ethos flavors (compassion, wisdom, balance, courage) may map to player stats. Each sect trains a stat. Propose which ethos maps to which sect and what stat name each sect trains.

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[Strand System Consultation — Schema & Structure]

You are the Architect. Propose:

1. **Strand-as-BAR schema**: Minimal fields for replay, provenance, advocacy. (agent_sequence, temperature_per_phase, output_bar_ids, branch_ref, advocacy_log — or your recommendation.)

2. **Dodo→Sect mapping**: Which dodo agents (researcher, codemedic, architect, coordinator, etc.) map to which BARS sects (Shaman, Challenger, Regent, Architect, Diplomat, Sage)?

3. **Ethos→Stat**: Which ethos (compassion, wisdom, balance, courage) maps to which sect, and what stat does each sect train?

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[Strand System Consultation — Order & Rules]

You are the Regent. Propose:

1. **Strand-as-BAR schema**: From an order/rules perspective, what must the strand BAR record? (Consider: audit trail, Kotter alignment, thread linkage.)

2. **Dodo→Sect mapping**: Which dodo agents map to BARS sects? Regent's domain: roles, rules, collective tool — who in dodo fits that?

3. **Ethos→Stat**: Which sect trains which stat? Regent trains structure/order — what ethos and stat name?

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (architect: string, regent: string) => `You are the Sage. The Architect and Regent have each proposed strand-as-BAR schemas. Your job is to combine their takes into a single, unified schema.

**Architect's proposal:**
${architect}

**Regent's proposal:**
${regent}

Produce a merged strand-as-BAR schema that:
1. Incorporates both replay/provenance concerns (Architect) and audit/Kotter/thread concerns (Regent)
2. Is minimal — no redundant fields
3. Uses clear field names and brief descriptions
4. Output as a structured list or table

Be concise.`

async function sageConsult(question?: string): Promise<{ synthesis: string; consulted_agents: string[] }> {
  const q = question ?? CONSULT_QUESTION
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q }),
  })
  if (!res.ok) throw new Error(`Sage consult failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return {
    synthesis: data.output?.synthesis ?? JSON.stringify(data.output),
    consulted_agents: data.output?.consulted_agents ?? [],
  }
}

async function faceTask(face: string, task: string): Promise<{ reasoning?: string; output?: unknown }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/${face}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, feature_id: 'strand-system-bars' }),
  })
  if (!res.ok) throw new Error(`${face} task failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const out = data.output as Record<string, unknown>
  return {
    reasoning: out?.reasoning as string | undefined,
    output: out,
  }
}

async function main() {
  console.log('Consulting Architect and Regent on strand system...\n')
  console.log(`Backend: ${BACKEND_URL}`)

  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })

  console.log('1. Consulting Sage (routes to Architect + Regent)...')
  const sageResult = await sageConsult()

  console.log('2. Consulting Architect directly...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent directly...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Sage: combining Architect + Regent into unified schema...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const sageMergeResult = await sageConsult(SAGE_MERGE_QUESTION(architectText, regentText))

  const outputPath = join(process.cwd(), '.specify', 'specs', 'strand-system-bars', 'ARCHITECT_REGENT_CONSULT.md')
  mkdirSync(join(process.cwd(), '.specify', 'specs', 'strand-system-bars'), { recursive: true })

  const markdown = `# Architect & Regent Consultation — Strand System

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult\`

---

## Sage Synthesis (routed to Architect + Regent)

${sageResult.synthesis}

*Consulted agents: ${sageResult.consulted_agents.join(', ') || 'N/A'}*

---

## Architect Response (direct)

${architectResult.reasoning || formatFallback(architectResult.output)}

---

## Regent Response (direct)

${regentResult.reasoning || formatFallback(regentResult.output)}

---

## Unified Schema (Sage synthesis of Architect + Regent)

${sageMergeResult.synthesis}

---

## Next Steps

1. Add the unified schema above to [spec.md](./spec.md) strand-as-BAR section.
2. Finalize dodo→sect mapping.
3. Finalize ethos→stat mapping.
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

function formatFallback(out: unknown): string {
  if (typeof out === 'string') return out
  if (out && typeof out === 'object') {
    const o = out as Record<string, unknown>
    if (o.reasoning) return String(o.reasoning)
  }
  return '```json\n' + JSON.stringify(out, null, 2) + '\n```'
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
