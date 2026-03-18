#!/usr/bin/env npx tsx
/**
 * Strand: Invitation gap analysis + player user stories.
 *
 * Consults Shaman (player belonging/entry experience), Diplomat (connection/invitation),
 * and Sage (synthesis) on what is blocking us from safely inviting players and what
 * user stories are missing from the invitation → sign-up → orientation flow.
 *
 * Usage:
 *   npm run strand:invitation
 *   # or:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npx tsx scripts/strand-invitation-gap-analysis.ts
 *
 * Output: .specify/specs/cyoa-invitation-throughput/GAP_ANALYSIS.md
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const backendIdx = process.argv.indexOf('--backend')
const next = process.argv[backendIdx + 1]
const backendArg =
  backendIdx >= 0 && next && !next.startsWith('--')
    ? next
    : process.argv.find((a) => a.startsWith('--backend='))?.slice('--backend='.length)
const BACKEND_URL = backendArg || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Current system state (injected into all agent prompts)
// ---------------------------------------------------------------------------

const SYSTEM_STATE = `
## Current Invitation System State

### What is built
- **Landing page** (logged-out home): shows 4 basic moves (Wake Up, Clean Up, Grow Up, Show Up); primary CTA is Sign Up
- **ref param attribution**: \`/?ref=bruised-banana\` passes through sign-up; stored as \`campaignRef\` in player storyProgress; post-sign-up redirects to /event
- **Forge invitation page** (/hand/forge-invitation): player with gameAccountReady can create an invitation BAR targeting a nation or school (Game Master Face); generates a unique token
- **Invite token page** (/invite/[token]): recipient lands here with forger's name shown; nation/school pre-filled from invitation target; standard sign-up form (name, email, password, nation, archetype)
- **Player-led invitation BAR**: schema has forgerId, invitationTargetType, invitationTargetId; invitedByPlayerId recorded on new player
- **Quest integration**: "Invite an Ally" quest completion can trigger forge flow; Strengthen the Residency END_INVITE branch auto-creates invitation BAR

### Known gaps / deferred tasks
1. Sign-up flow does not yet capture "interest" (domain or intention choice) — deferred in T spec
2. Forge invitation page is discoverable only from /hand (Quest Wallet) — not prominently surfaced elsewhere
3. Post-sign-up orientation: player lands on /event after sign-up but there is no explicit "first quest" prompt or clear next action
4. CYOA (Wake-Up campaign): not yet "perfected" — not the primary entry for new players; dripped to existing players
5. No analytics on invitation conversion (who clicked → who signed up → who completed onboarding)
6. Sect (sub-group) targeting for invitations is deferred
`

// ---------------------------------------------------------------------------
// Agent prompts
// ---------------------------------------------------------------------------

const SHAMAN_TASK = `[Invitation Gap Analysis — Player Belonging & Entry Experience]

You are the Shaman. Your domain: mythic threshold, belonging, ritual entry, emotional resonance.

${SYSTEM_STATE}

From the Shaman's perspective, answer:

1. **Ritual gaps**: What is missing from the player's entry experience? Does the current invitation → sign-up → first step feel like a threshold crossing, or does it feel transactional? Name the specific gaps.

2. **Belonging gaps**: What does a new player need to feel like they belong in this system within the first 5 minutes? What user stories are missing that would create that feeling?

3. **User stories (Shaman lens)**: Write 3–5 user stories (As a [player], I want [X], so that [Y]) for the highest-priority missing pieces from a belonging/entry perspective.

4. **Unblock priority**: What single thing, if fixed, would most unblock us from safely inviting players?

Be specific. Reference actual pages/flows when relevant. Put your analysis in the reasoning field.`

const DIPLOMAT_TASK = `[Invitation Gap Analysis — Connection & Invitation Flow]

You are the Diplomat. Your domain: relational field, connections, invitation, community weave.

${SYSTEM_STATE}

From the Diplomat's perspective, answer:

1. **Invitation flow gaps**: What friction exists between a current player wanting to invite someone and that person successfully entering the system? Map the friction points.

2. **Discoverability gaps**: Can a player easily find and use the forge invitation feature? What is missing to make invitation a natural, social act rather than a buried admin function?

3. **User stories (Diplomat lens)**: Write 3–5 user stories for the highest-priority missing pieces from an invitation/connection perspective.

4. **Unblock priority**: What single thing would most improve invitation throughput — i.e., the rate at which invited players actually complete sign-up and take a first action?

Be specific. Reference actual pages/flows when relevant. Put your analysis in the reasoning field.`

const SAGE_SYNTHESIS = (shaman: string, diplomat: string) => `[Invitation Gap Analysis — Synthesis & Prioritized User Story Backlog]

You are the Sage. The Shaman and Diplomat have each analyzed the invitation flow from their perspectives.

**Shaman's analysis (belonging/entry):**
${shaman}

**Diplomat's analysis (connection/invitation flow):**
${diplomat}

Your task:

1. **Synthesize** the top gaps identified by both faces into a unified gap list (no duplicates; merge overlapping concerns).

2. **Write canonical user stories**: Produce a final list of 5–8 user stories that cover the most important missing pieces. Format:
   > **[Story ID]** As a [player/organizer], I want [X], so that [Y].
   > **Acceptance**: [1–2 specific acceptance criteria]
   > **Priority**: [High/Medium] | **Face**: [Shaman/Diplomat/Both]

3. **Prioritized recommendation**: State the single highest-leverage action to unblock player invitation — the one change that unlocks the most value with the least effort.

4. **What NOT to build now**: Name 1–2 things that are tempting but should stay deferred (compost pile).

Be concise and structured. Output in the reasoning field.`

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function faceTask(face: string, task: string): Promise<{ reasoning?: string; output?: unknown }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/${face}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, feature_id: 'cyoa-invitation-throughput' }),
  })
  if (!res.ok) throw new Error(`${face} task failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const out = data.output as Record<string, unknown>
  return {
    reasoning: out?.reasoning as string | undefined,
    output: out,
  }
}

async function sageConsult(question: string): Promise<{ synthesis: string }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error(`Sage consult failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return { synthesis: data.output?.synthesis ?? JSON.stringify(data.output) }
}

function text(result: { reasoning?: string; output?: unknown }): string {
  if (result.reasoning) return result.reasoning
  if (result.output && typeof result.output === 'object') {
    const o = result.output as Record<string, unknown>
    if (o.reasoning) return String(o.reasoning)
  }
  return '```json\n' + JSON.stringify(result.output, null, 2) + '\n```'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Strand: Invitation gap analysis + player user stories\n')
  console.log(`Backend: ${BACKEND_URL}\n`)

  try {
    const health = await fetch(`${BACKEND_URL}/api/health`)
    if (!health.ok) throw new Error('Health check failed')
    console.log('✓ Backend reachable\n')
  } catch {
    console.error('❌ Backend not reachable. Start with: npm run dev:backend')
    process.exit(1)
  }

  console.log('1. Consulting Shaman (player belonging + entry experience)...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)
  const shamanText = text(shamanResult)
  console.log('   ✓ Shaman done\n')

  console.log('2. Consulting Diplomat (invitation flow + discoverability)...')
  const diplomatResult = await faceTask('diplomat', DIPLOMAT_TASK)
  const diplomatText = text(diplomatResult)
  console.log('   ✓ Diplomat done\n')

  console.log('3. Sage synthesizing + writing canonical user stories...')
  const sageSynthesis = await sageConsult(SAGE_SYNTHESIS(shamanText, diplomatText))
  console.log('   ✓ Sage done\n')

  const outputDir = join(process.cwd(), '.specify', 'specs', 'cyoa-invitation-throughput')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'GAP_ANALYSIS.md')

  const markdown = `# Invitation Gap Analysis — Player User Stories

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:invitation\`
**Strand**: Shaman → Diplomat → Sage synthesis

---

## System State at Time of Consultation

${SYSTEM_STATE}

---

## Shaman Analysis — Belonging & Entry Experience

${shamanText}

---

## Diplomat Analysis — Connection & Invitation Flow

${diplomatText}

---

## Sage Synthesis — Canonical User Stories & Prioritized Backlog

${sageSynthesis.synthesis}

---

## Next Steps

1. Review canonical user stories above; promote highest-priority items to BACKLOG.md
2. Assign spec IDs and add to task queue
3. Re-run this strand after implementing the highest-leverage change to measure progress
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`✅ Gap analysis written to ${outputPath}`)
  console.log('\nReview: .specify/specs/cyoa-invitation-throughput/GAP_ANALYSIS.md')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
