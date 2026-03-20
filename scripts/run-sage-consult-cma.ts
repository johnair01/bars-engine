#!/usr/bin/env npx tsx
/**
 * Sage consult for CMA — same API as MCP sage_consult (POST /api/agents/sage/consult).
 *
 *   npx tsx scripts/run-sage-consult-cma.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
config({ path: '.env', quiet: true })

import { ensureBackendReady } from '../src/lib/backend-health'

const BASE = process.env.BACKEND_URL ?? 'http://localhost:8000'

const QUESTION = `You are the Sage (integration agent) for BARS Engine.

Context: We completed a six-face strand consult for **CYOA Modular Charge Authoring (CMA)** — modular quest graphs like "Lego robotics": typed blocks, validateQuestGraph (NO_END, UNREACHABLE_END, CHOICE_SINGLE_ARM), ADR-cma-v0 IR sketch, export to Twee, admin-first MVP before player palette. Onboarding quest generation (DJ) already has skeleton-first + I Ching + feedback. twine-authoring-ir and quest-grammar-compiler exist.

Six-face highlights: (1) Shaman: first touch = felt "what moved you?" before empty palette; game language labels. (2) Architect: 7 node kinds scene/choice/metabolize/commit/branch_guard/merge/end; validate then AI fill. (3) Challenger: one-shot AI must not be primary CTA. (4) Regent: no player palette until admin round-trip proven. (5) Diplomat: AI as opt-in forge; gentle errors. (6) Sage draft: smallest whole = linear + one choice + end + validator + Twee preview.

**Deliver in markdown:**
1. **Synthesis** — 8–12 bullets integrating the faces.
2. **Open questions** — Recommend: (A) I Ching / lens: BranchGuard node vs separate pre-palette wizard step? (B) Fragment/template library: campaign-scoped only vs global + ownership for multi-tenant?
3. **Next 3 tasks** — concrete implementation steps after Phase 1 (ADR + validateQuestGraph in repo).
4. **One defer** — what to explicitly not build yet.

Keep practical and aligned with deftness / dual-track (no-LLM path).`

async function main() {
  await ensureBackendReady({
    url: BASE,
    autoStart: true,
    quiet: true,
    skipOpenAIWarning: true,
  })

  const res = await fetch(`${BASE.replace(/\/$/, '')}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: QUESTION }),
  })
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    console.error('Non-JSON response:', text.slice(0, 800))
    process.exit(1)
  }
  console.log(JSON.stringify(parsed, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
