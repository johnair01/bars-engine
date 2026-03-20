#!/usr/bin/env npx tsx
/**
 * Consult all 6 Game Master faces on the capture charge → quest → campaign game loop.
 *
 * Problem: 321 → quest flow breaks. Players metabolize charge but can't move it into
 * aligned action toward campaign needs. Dashboard should show campaign overview and
 * next milestones. Completing the loop: charge → quest → add quest to campaign.
 *
 * Usage:
 *   npm run strand:consult:game-loop
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/game-loop-charge-quest-campaign/STRAND_CONSULT.md
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

const CONSULT_QUESTION = `**Major game loop problem**: The capture charge flow breaks when people do a 321 and then try to make a quest. Players should be passed to a quest generation flow that lets them take their metabolized charge and move it in aligned action toward campaign needs.

**User's experience**: Did a charge activity about feeling overwhelmed by options for what to work on next. Wanted to use it to start pro-production work on campaigns they're responsible for and identify the next effective milestone for each. Could not complete this flow.

**Expected behavior**:
1. 321 (Shadow) → metabolize charge
2. Quest generation flow — turn charge into aligned action
3. Link quest to campaign — add quest to campaign quest (gameboard slot, thread)
4. Dashboard overview — campaigns player is responsible for, next effective milestone per campaign

**Current system**:
- Shadow321Form: handleTurnIntoQuest → createQuestFrom321Metadata; handleCreateBar → /create-bar?from321=1
- createQuestFrom321Metadata: creates quest, persists session; quest is orphaned (no thread/campaign placement)
- Game loop spec (GL): BAR → Quest → Thread/Campaign; addQuestToThread, addQuestToCampaign; Hand as personal hub
- Dashboard: exists but may not show campaign overview or next milestones

**Questions**:
1. Where does the 321→quest flow break? What's missing between metabolize and quest creation?
2. How do we get from charge → quest → campaign alignment? What UI/API steps?
3. What should the dashboard show for "campaigns I'm responsible for" and "next effective milestone"?
4. How do we evolve the app deftly to fix this without breaking existing flows?

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[Game Loop — Structure & Flow]

You are the Architect. Propose:

1. **Flow break diagnosis**: Where does 321→quest break? Is it createQuestFrom321Metadata failing? Missing UI? Wrong redirect? Create-bar vs create-quest path confusion?

2. **Quest generation flow**: After 321, what should happen? Dedicated quest-from-charge flow? Reuse create-bar with "Create Quest" branch? What inputs does the quest need (campaign context, slot, move type)?

3. **Placement API**: addQuestToThread, addQuestToCampaign — when in the flow does the player choose placement? Immediately after quest creation? Or from Hand/quest detail?

4. **Integration points**: Extend Hand? New dashboard section? Campaign overview data shape — what does "next effective milestone per campaign" require?

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[Game Loop — Order & Rules]

You are the Regent. Propose:

1. **Gate logic**: When can a player add a quest to a campaign? Must they own the quest? Be in the campaign? What rules govern placement?

2. **Campaign responsibility**: What does "campaigns I'm responsible for" mean? Instance membership? Role? Campaign owner? How do we query this?

3. **Milestone semantics**: "Next effective milestone" — is this a quest in the campaign? A slot? A Kotter stage? What data shape supports this?

4. **State transitions**: 321→BAR vs 321→Quest. When does each apply? What prevents orphaned quests?

Put your recommendations in the reasoning field. Be structured and concise.`

const CHALLENGER_TASK = `[Game Loop — Risks & Blockers]

You are the Challenger. Propose:

1. **Blockers**: What could block fixing this? Missing campaign schema? No "placement" UI? createQuestFrom321Metadata errors? Be specific.

2. **Risks**: Adding quest-to-campaign could create clutter. Dashboard overload. Too many choices. What's the minimal viable path?

3. **Scope creep**: "Campaign overview" could mean many things. What's the smallest useful dashboard addition?

4. **Alternatives**: Could we defer campaign placement and just fix 321→quest? What's the minimum to unblock the user?

Put your recommendations in the reasoning field. Be structured and concise.`

const DIPLOMAT_TASK = `[Game Loop — Community & Alignment]

You are the Diplomat. Propose:

1. **Aligned action**: "Move charge toward campaign needs" — how does the flow convey that the quest aligns with the campaign? What framing makes it feel like contribution, not obligation?

2. **Overwhelm**: User felt overwhelmed by options. How do we reduce choice paralysis? Campaign overview + next milestone — does that help or add more?

3. **Belonging**: When a player adds their quest to a campaign, what makes it feel like "I'm contributing" rather than "I'm filling a slot"?

4. **Hand as hub**: The Hand is the personal quest hub. How does it welcome players who just completed 321 and want to place their quest?

Put your recommendations in the reasoning field. Be structured and concise.`

const SHAMAN_TASK = `[Game Loop — Charge & Threshold]

You are the Shaman. Propose:

1. **Charge metabolism**: 321 metabolizes charge. The quest is the artifact of that metabolism. What blocks the charge from becoming a quest? Is it a threshold crossing that's missing?

2. **Ritual sequence**: 321 → Create Quest → Place in Campaign. Does this sequence honor the charge? What's missing in the ritual?

3. **Overwhelm as charge**: The user's charge was "overwhelmed by options." That's a real charge. How does the flow honor it—by giving clarity (campaign overview, next milestone) rather than more options?

4. **Next smallest honest action**: The Shaman says "what is the next smallest honest action?" How does the dashboard and placement flow support that?

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (
  architect: string,
  regent: string,
  challenger: string,
  diplomat: string,
  shaman: string
) => `You are the Sage. All six Game Master faces have proposed how to fix the capture charge → quest → campaign game loop. Synthesize their views into a single, actionable spec outline.

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
1. Diagnoses where the 321→quest flow breaks
2. Proposes the minimal fix (quest generation + placement)
3. Defines dashboard overview for campaigns and next milestones
4. Is deftly implementable—evolve without breaking existing flows

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
    body: JSON.stringify({ task, feature_id: 'game-loop-charge-quest' }),
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
  console.log('Consulting all 6 Game Master faces on game loop (charge → quest → campaign)...\n')
  console.log(`Backend: ${BACKEND_URL}`)

  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })

  console.log('1. Consulting Sage (routes to relevant faces)...')
  const sageResult = await sageConsult()

  console.log('2. Consulting Architect (structure, flow)...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent (order, rules)...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Challenger (risks, blockers)...')
  const challengerResult = await faceTask('challenger', CHALLENGER_TASK)

  console.log('5. Consulting Diplomat (alignment, community)...')
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

  const outputDir = join(process.cwd(), '.specify', 'specs', 'game-loop-charge-quest-campaign')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'STRAND_CONSULT.md')

  const markdown = `# Strand Consultation — Game Loop: Charge → Quest → Campaign

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:game-loop\`

**Problem**: 321 → quest flow breaks. Players metabolize charge but can't move it into aligned action toward campaign needs. Dashboard should show campaign overview and next milestones. Complete the loop: charge → quest → add quest to campaign.

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${(sageResult.consulted_agents ?? []).join(', ') || 'N/A'}*

---

## Architect Response (structure, flow)

${architectText}

---

## Regent Response (order, rules)

${regentText}

---

## Challenger Response (risks, blockers)

${challengerText}

---

## Diplomat Response (alignment, community)

${diplomatText}

---

## Shaman Response (charge, threshold)

${shamanText}

---

## Unified Spec Outline (Sage synthesis)

${sageMergeResult.synthesis}

---

## Next Steps

1. Diagnose 321→quest break (createQuestFrom321Metadata, UI, redirect)
2. Implement placement flow (addQuestToThread, addQuestToCampaign)
3. Add dashboard campaign overview and next milestones
4. Evolve deftly without breaking existing flows
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
