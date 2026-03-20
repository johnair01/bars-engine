#!/usr/bin/env npx tsx
/**
 * Consult all 6 Game Master faces on the Charge → 321 → (Quest, BAR, Enemy, daemon) flow interruption.
 *
 * Problem: Major flow interruption. Everything except daemon routes back to dashboard without
 * alerting the user what work was done and what they need to do next. Could be save-without-notify
 * OR wiring problem. Need to identify which (or both) and fix. Add to design docs: major flows
 * can't be interrupted; we need to identify which flows complete and which don't.
 *
 * Usage:
 *   npm run strand:consult:flow-interruption
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/charge-321-flow-interruption/STRAND_CONSULT.md
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

const CONSULT_QUESTION = `**Major flow interruption**: Charge → 321 → (Quest, BAR, Enemy, daemon). The current flow that completes is daemon. Everything else routes back to dashboard without an alert as to what work was done and what the player needs to do next.

**Hypotheses**:
1. Work is being saved but NOT informing the user (success-without-feedback)
2. Work is being interrupted — wiring problem (flow breaks before completion)
3. Both — some paths save, some break; user can't tell which

**Design principle to add**: Major flows can't be interrupted. We need to identify which flows complete and which don't.

**Current system**:
- Shadow321Form: Turn into Quest → createQuestFrom321Metadata → redirect to /hand?quest=
- Shadow321Form: Create BAR → /create-bar?from321=1
- Shadow321Form: Fuel System → persist321Session, router.refresh()
- GrowFromBar (on BAR page): Plant as Quest → growQuestFromBar → /?focusQuest=; Wake as Daemon → /daemons; Create Artifact → /growth-scene/[id]
- Daemon flow reportedly completes; Quest/BAR/Artifact do not give clear feedback

**Questions**:
1. Where does each branch (Quest, BAR, Artifact) succeed vs fail? Is it save-without-notify or wiring?
2. What feedback must the user get after each outcome? Toast? Redirect with highlight? Success message?
3. How do we add "major flows can't be interrupted" to design docs? What does flow completion mean?
4. How do we instrument/identify which flows complete and which don't?

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[Flow Interruption — Structure & Wiring]

You are the Architect. Propose:

1. **Flow mapping**: For Charge→321→(Quest, BAR, daemon, artifact): trace each path. Where does redirect happen? Where does feedback happen? Where might it silently fail or drop the user on dashboard with no context?

2. **Wiring vs notify**: How do we distinguish "work saved but user not informed" from "work interrupted / wiring broken"? What logs or checks would tell us?

3. **Completion contract**: Define "flow completes" — user sees X, knows Y, can do Z. What's the minimal completion contract per branch?

4. **Design doc addition**: "Major flows can't be interrupted" — what does this mean technically? Redirect targets? Success states? Error handling?

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[Flow Interruption — Order & Rules]

You are the Regent. Propose:

1. **Flow governance**: What rules should govern major flows? Must every branch end with explicit success/failure feedback? No silent redirects?

2. **Instrumentation**: How do we identify which flows complete? Event logging? Completion markers? Dashboard for flow health?

3. **Recovery**: If a flow is interrupted, can the user recover? Where would they look? Hand? Dashboard? BARs list?

4. **Priority**: Which branches are most critical to fix first? Quest? BAR? Artifact?

Put your recommendations in the reasoning field. Be structured and concise.`

const CHALLENGER_TASK = `[Flow Interruption — Risks & Blockers]

You are the Challenger. Propose:

1. **Root cause**: Is the problem in the server action (returns but doesn't surface)? The client (doesn't handle response)? The redirect (goes to wrong place)? Be specific.

2. **Daemon exception**: Why does daemon "complete" when others don't? What's different about that path? Can we replicate that pattern?

3. **Scope creep**: "Identify which flows complete" could mean heavy instrumentation. What's the minimal way to know if a flow completed?

4. **Blockers**: What could prevent fixing this? Missing error boundaries? No toast system? router.refresh() wiping state?

Put your recommendations in the reasoning field. Be structured and concise.`

const DIPLOMAT_TASK = `[Flow Interruption — User Experience]

You are the Diplomat. Propose:

1. **User expectation**: After "Turn into Quest," what does the user expect? To see their quest? To be told "Quest created"? To know the next step?

2. **Reducing confusion**: "Routes back to dashboard" — is the user lost? Overwhelmed? How do we make each outcome feel complete rather than abandoned?

3. **Feedback patterns**: Toast? Banner? Redirect with query param and highlight? What's the right level of feedback without overwhelming?

4. **Trust**: If flows silently fail sometimes, users lose trust. How do we communicate "this worked" vs "something went wrong"?

Put your recommendations in the reasoning field. Be structured and concise.`

const SHAMAN_TASK = `[Flow Interruption — Charge & Threshold]

You are the Shaman. Propose:

1. **Charge metabolism**: 321 metabolizes charge. Quest/BAR/daemon/artifact are the artifacts. When the user doesn't see feedback, the charge feels un-metabolized. What threshold is being missed?

2. **Ritual completion**: A ritual isn't complete until the participant knows it's complete. What's missing in the "ritual" of each branch?

3. **Daemon as model**: Daemon works. What does it do that the others don't? Honoring the charge with a clear destination?

4. **Next smallest honest action**: After creating a quest from 321, what is the next smallest honest action? Does the user know? If not, the flow is broken.

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (
  architect: string,
  regent: string,
  challenger: string,
  diplomat: string,
  shaman: string
) => `You are the Sage. All six Game Master faces have proposed how to fix the Charge→321 flow interruption. Synthesize their views into a single, actionable spec outline.

**Architect's proposal:**
${architect}

**Regent's proposal:**
${regent}

**Challenger's proposal:**
${challenger}

**Diplomat's proposal:**
${diplomat}

**Shaman's proposal:**
${shaman}

Produce a unified spec outline that:
1. Diagnoses save-without-notify vs wiring for each branch (Quest, BAR, daemon, artifact)
2. Proposes minimal feedback/completion contract per branch
3. Defines "major flows can't be interrupted" for design docs
4. Proposes how to identify which flows complete (instrumentation)

Be concise. Output as structured sections.`

async function sageConsult(question?: string): Promise<{ synthesis: string; consulted_agents?: string[] }> {
  const q = question ?? CONSULT_QUESTION
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q }),
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
    body: JSON.stringify({ task, feature_id: 'charge-321-flow-interruption' }),
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
  console.log('Consulting all 6 Game Master faces on Charge→321 flow interruption...\n')
  console.log(`Backend: ${BACKEND_URL}`)

  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })

  console.log('1. Consulting Sage (routes to relevant faces)...')
  const sageResult = await sageConsult()

  console.log('2. Consulting Architect (structure, wiring)...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent (order, rules)...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Challenger (risks, blockers)...')
  const challengerResult = await faceTask('challenger', CHALLENGER_TASK)

  console.log('5. Consulting Diplomat (UX, feedback)...')
  const diplomatResult = await faceTask('diplomat', DIPLOMAT_TASK)

  console.log('6. Consulting Shaman (charge, threshold)...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('7. Sage: synthesizing all faces...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const challengerText = challengerResult.reasoning || formatFallback(challengerResult.output)
  const diplomatText = diplomatResult.reasoning || formatFallback(diplomatResult.output)
  const shamanText = shamanResult.reasoning || formatFallback(shamanResult.output)
  const sageMergeResult = await sageConsult(
    SAGE_MERGE_QUESTION(architectText, regentText, challengerText, diplomatText, shamanText)
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'charge-321-flow-interruption')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'STRAND_CONSULT.md')

  const markdown = `# Strand Consultation — Charge→321 Flow Interruption

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:flow-interruption\`

**Problem**: Major flow interruption. Charge → 321 → (Quest, BAR, Enemy, daemon). Only daemon completes with clear feedback. Everything else routes back to dashboard without alerting the user what work was done and what they need to do next. Could be save-without-notify OR wiring problem. Need to identify which (or both) and fix. Add to design docs: major flows can't be interrupted; we need to identify which flows complete and which don't.

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${(sageResult.consulted_agents ?? []).join(', ') || 'N/A'}*

---

## Architect Response (structure, wiring)

${architectText}

---

## Regent Response (order, rules)

${regentText}

---

## Challenger Response (risks, blockers)

${challengerText}

---

## Diplomat Response (UX, feedback)

${diplomatText}

---

## Shaman Response (charge, threshold)

${shamanText}

---

## Unified Spec Outline (Sage synthesis)

${sageMergeResult.synthesis}

---

## Next Steps

1. Diagnose each branch: save-without-notify vs wiring
2. Define completion contract per branch
3. Add "major flows can't be interrupted" to design docs
4. Instrument to identify which flows complete
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
