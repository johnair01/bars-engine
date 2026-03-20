#!/usr/bin/env npx tsx
/**
 * Consult all 6 Game Master agents on Events + BAR Framework integration.
 *
 * Research domains:
 * - Open source event production
 * - Event management
 * - Project management
 * - Calendar sync
 * - Text notification features
 *
 * Also: API-first development and deftness improvements for the plan.
 *
 * Usage:
 *   npm run strand:consult:events-bar
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/events-bar-framework/STRAND_CONSULT.md
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

const PLAN_CONTEXT = `
## Current Integration Plan (for analysis)

**Phases:**
1. Event Invites via BAR — createEventInvitation, BAR delivery, RSVP from BAR detail
2. Unify EventArtifact ↔ Instance — EventArtifact.instanceId FK, lineage
3. Pre-Production Sub-Campaigns — child Instances (BB-BANANA, BB-GRILL), role invitations
4. Event Venue (Gather Clone) — Instance.spatialMapId, enterSpatialMap, RoomPresence
5. OSS Patterns — capacity, check-in, recurrence, calendar sync

**Research already done:** Pretix, Hi.Events, EventSchedule, Evental, PopSpace, Locmind, Rooms2D
**Gaps:** EventInvite has no BAR delivery; EventArtifact not linked to Instance; no event invite flow
`

const ARCHITECT_TASK = `[Events BAR Framework — Structure, Schemas, API Design]

You are the Architect. Research and propose:

1. **Open source event production**: What GitHub projects exist for event production workflows (planning, pre-production, run-of-show)? How do they structure event → sub-events → tasks? What schemas or APIs could BARS adopt?

2. **Event management + project management**: How do event platforms (Pretix, Eventbrite, etc.) relate to project management tools (Asana, Linear, etc.)? What structures fit a gamified campaign (Instance, sub-campaigns, quests)?

3. **Calendar sync**: iCal/RRULE, Google Calendar API, CalDAV — what patterns do OSS event tools use? What's minimal for BARS (export? import? two-way sync)?

4. **API-first development**: Analyze the plan. What API contracts should be defined BEFORE UI? Which routes vs server actions? Document request/response shapes for: createEventInvitation, getEventInvitationForBar, acceptEventInvitation.

5. **Deftness**: What schema or API decisions would be generative (solving one eliminates others)? What would cause rework if done wrong?

Put your recommendations in the reasoning field. Be structured and cite specific projects where useful.`

const REGENT_TASK = `[Events BAR Framework — Order, Governance, Security]

You are the Regent. Research and propose:

1. **Event management governance**: How do OSS event platforms handle permissions (who can invite? who can edit? capacity limits)? What RACI or role patterns fit InstanceMembership?

2. **Project management structures**: Gantt, milestones, dependencies — what from PM tools could map to Instance/EventArtifact/QuestThread? What's overkill for a gamified event?

3. **Calendar sync security**: When exporting iCal or syncing — what data is safe to expose? Attendee lists? Internal notes? Define boundaries.

4. **Text notification**: SMS/email reminder services (Twilio, SendGrid, etc.) — what do event platforms use? Opt-in, rate limits, PII handling?

5. **API-first + deftness**: What order-of-operations ensures we don't build UI that later breaks when API changes? What governance rules for the event invite flow?

Put your recommendations in the reasoning field. Be structured.`

const CHALLENGER_TASK = `[Events BAR Framework — Boundaries, Skepticism]

You are the Challenger. Push back and propose:

1. **Event production OSS**: Are we over-indexing on event management when BARS is a game? What's the minimum we need for April 5th vs. building a full event platform?

2. **Project management**: Do we need PM features at all? Or is Instance + QuestThread + role invitations sufficient? What would be over-engineering?

3. **Calendar sync**: Is calendar sync a "nice to have" that delays Phase 1? What's the simplest path — manual export? One-way iCal feed?

4. **Text notification**: Do we need SMS/push for event reminders? Or is BAR delivery + email sufficient for MVP? What creates dependency creep?

5. **API-first critique**: Is the plan truly API-first? Or does it assume UI-first and bolt APIs on? What would a purist API-first sequence look like?

6. **Deftness risks**: What in the plan could create technical debt or rework? Where might we over-build?

Put your recommendations in the reasoning field. Be provocative but actionable.`

const DIPLOMAT_TASK = `[Events BAR Framework — Trust, Bridging, Community]

You are the Diplomat. Research and propose:

1. **Event management UX**: What makes event invites feel welcoming vs. transactional? How do successful community events (Meetup, Luma) handle the "you're invited" moment?

2. **Text notification UX**: When should we notify? (Invite sent, reminder 24h before, day-of?) What tone? How do we avoid spam while ensuring people show up?

3. **Calendar sync UX**: Adding to calendar = commitment. What's the right flow? "Add to calendar" button on BAR detail? iCal link in email?

4. **Bridging game ↔ real**: The plan says "gamified pre-production." How do we make sub-campaign ownership feel like "you're part of the crew" not "here's another task list"?

5. **API-first for community**: If we expose event APIs, who consumes them? Other apps? Integrations? What would make the API welcoming to external developers?

Put your recommendations in the reasoning field. Be human-centered.`

const SHAMAN_TASK = `[Events BAR Framework — Threshold, Invitation, Emotional]

You are the Shaman. Research and propose:

1. **Event as ritual**: An event invite is a threshold crossing. What blocks it? (Too much friction? Suspicious link? No preview?) What facilitates it? How does BAR delivery honor the recipient's agency?

2. **Pre-production as belonging**: "Invite to help with the party" — how do we make that feel like initiation into a crew, not a chore assignment? What emotional patterns from games (guild invite, quest offer) apply?

3. **Text notification as nudge**: Reminders can feel caring or nagging. What's the right emotional register? When does a notification support the ritual vs. break the spell?

4. **Calendar as commitment**: Adding to calendar is a small yes. What's the emotional arc from "got the BAR" → "added to calendar" → "showed up"?

5. **Deftness as flow**: Where does the plan create friction? Where could we reduce steps so the emotional energy flows instead of getting stuck?

Put your recommendations in the reasoning field. Be intuitive and threshold-aware.`

const SAGE_MERGE_QUESTION = (
  architect: string,
  regent: string,
  challenger: string,
  diplomat: string,
  shaman: string
) => `You are the Sage. The Architect, Regent, Challenger, Diplomat, and Shaman have each researched open source event production, event management, project management, calendar sync, and text notification — and analyzed the Events BAR Framework plan for API-first development and deftness improvements.

Synthesize their views into an amended plan outline that:

1. **Research additions**: New OSS projects or patterns to consider (event production, PM, calendar, notifications)
2. **API-first amendments**: Concrete API contracts to add before Phase 1 (routes, request/response shapes)
3. **Deftness amendments**: Generative dependencies, order-of-operations, what to defer or cut
4. **Challenger's cuts**: What to trim or simplify based on Challenger's skepticism
5. **UX/emotional refinements**: From Diplomat and Shaman — invitation flow, notification tone, calendar commitment

Be concise. Output as structured sections. This will amend the integration plan.`

async function sageConsult(question?: string): Promise<{ synthesis: string; consulted_agents?: string[] }> {
  const q = question ?? PLAN_CONTEXT
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
    body: JSON.stringify({ task, feature_id: 'events-bar-framework' }),
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
  console.log('Consulting all 6 Game Masters on Events BAR Framework...\n')
  console.log('Research: event production, event management, project management, calendar sync, text notification')
  console.log('Analysis: API-first development, deftness improvements\n')
  console.log(`Backend: ${BACKEND_URL}`)

  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })

  console.log('1. Consulting Sage (initial routing)...')
  const sageResult = await sageConsult(PLAN_CONTEXT)

  console.log('2. Consulting Architect (structure, schemas, API)...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent (order, governance)...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Challenger (boundaries, skepticism)...')
  const challengerResult = await faceTask('challenger', CHALLENGER_TASK)

  console.log('5. Consulting Diplomat (trust, bridging)...')
  const diplomatResult = await faceTask('diplomat', DIPLOMAT_TASK)

  console.log('6. Consulting Shaman (threshold, invitation)...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('7. Sage: synthesizing all faces into amended plan...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const challengerText = challengerResult.reasoning || formatFallback(challengerResult.output)
  const diplomatText = diplomatResult.reasoning || formatFallback(diplomatResult.output)
  const shamanText = shamanResult.reasoning || formatFallback(shamanResult.output)
  const sageMergeResult = await sageConsult(
    SAGE_MERGE_QUESTION(architectText, regentText, challengerText, diplomatText, shamanText)
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'events-bar-framework')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'STRAND_CONSULT.md')

  const markdown = `# Game Master Consultation — Events BAR Framework

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:events-bar\`

**Research domains**: Open source event production, event management, project management, calendar sync, text notification
**Analysis**: API-first development, deftness improvements

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${(sageResult.consulted_agents ?? []).join(', ') || 'N/A'}*

---

## Architect Response (structure, schemas, API)

${architectResult.reasoning || formatFallback(architectResult.output)}

---

## Regent Response (order, governance)

${regentResult.reasoning || formatFallback(regentResult.output)}

---

## Challenger Response (boundaries, skepticism)

${challengerResult.reasoning || formatFallback(challengerResult.output)}

---

## Diplomat Response (trust, bridging)

${diplomatResult.reasoning || formatFallback(diplomatResult.output)}

---

## Shaman Response (threshold, invitation)

${shamanResult.reasoning || formatFallback(shamanResult.output)}

---

## Unified Amended Plan Outline (Sage synthesis)

${sageMergeResult.synthesis}

---

## Next Steps

1. Amend the integration plan with research additions and API-first contracts
2. Apply Challenger's cuts and Deftness amendments
3. Create spec kit at .specify/specs/events-bar-framework/
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
