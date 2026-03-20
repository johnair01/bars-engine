#!/usr/bin/env npx tsx
/**
 * Consult Game Master agents on BAR external sharing — when a player sends a BAR
 * to someone outside the game (email, link, etc.).
 *
 * Requirements:
 * 1) Recipient can log in if they already have an account
 * 2) Recipient can sign up for an account
 * 3) If BAR is associated with a Campaign, recipient gets onboarding adventure BEFORE signing up
 * 4) iOS preview so the link doesn't look like a suspicious link
 *
 * Usage:
 *   npm run strand:consult:bar-external
 *   # or with explicit backend:
 *   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npx tsx scripts/strand-consult-bar-external-sharing.ts
 *
 * Requires: Backend running (npm run dev:backend), OPENAI_API_KEY in .env.local
 * Output: .specify/specs/bar-external-sharing/GM_CONSULT.md
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

const CONSULT_QUESTION = `A player sends a BAR (Belief-Action-Reflection) to someone **outside the game** — via email, SMS, or share link. The recipient may not have an account. We need a flow that:

**Requirements:**
1. **Log in** — If the recipient already has an account, they can log in to view the BAR.
2. **Sign up** — If they don't have an account, they can sign up.
3. **Campaign BAR → Onboarding first** — If the BAR is associated with a Campaign, the recipient gets the onboarding adventure (CYOA, nation/archetype choice, etc.) BEFORE signing up. The BAR is the invitation; onboarding is the ritual.
4. **iOS preview** — On iOS (Messages, Mail, etc.), the shared link should show a rich preview (Open Graph / meta tags) so it doesn't look like a suspicious link. Trust and context matter.

**Current system context:**
- BarShare: barId, fromUserId, toUserId (toUserId requires existing Player)
- Invite: token-based sign-up; /invite/[token]; CustomBar.inviteId for invitation BARs
- Instance, campaign, onboarding adventures (CYOA)
- Golden path: invitation shape (instanceId, starterQuestId, invitationBarId)

**Questions for the Game Master faces:**
1. Schema: How do we model "BAR shared to external recipient" (email, pending token)? BarShare requires toUserId. Do we need BarShareExternal or Invite extension?
2. Flow: What is the exact sequence — link click → preview → login/signup/onboarding? When does campaign association trigger onboarding-first?
3. iOS preview: What meta tags, image, and copy make a BAR link feel trustworthy? Sender name? BAR title? Campaign context?
4. Integration: How does this align with invitation-via-BAR ritual and golden path invitation shape?

Synthesize into structured recommendations. Be concise.`

const ARCHITECT_TASK = `[BAR External Sharing — Schema & Structure]

You are the Architect. A player sends a BAR to someone outside the game. Propose:

1. **Schema for external share**: BarShare requires toUserId (existing Player). We need to support recipients who don't exist yet. Options: BarShareExternal (toEmail, token, status), extend Invite to carry barId, or another approach. Propose minimal schema.

2. **Share link shape**: What URL structure? /bar/[id]/view?token=... or /invite/bar/[shareToken]? How does the link encode: bar-only vs campaign-BAR (onboarding first)?

3. **Flow sequencing**: Link → preview page → (if campaign-BAR) onboarding adventure → sign up → BAR view. Or: link → login/signup choice → (if new + campaign-BAR) onboarding → account create. Clarify the decision tree.

Put your recommendations in the reasoning field. Be structured and concise.`

const REGENT_TASK = `[BAR External Sharing — Order & Rules]

You are the Regent. Govern the flow when a BAR is shared externally. Propose:

1. **Gate logic**: When does "onboarding first" apply? BAR linked to Instance? BAR has inviteId? Campaign kernel? Propose clear rule.

2. **Token lifecycle**: Share token expiry, one-time vs multi-view, revocation. What rules protect both sender and recipient?

3. **Account creation timing**: If onboarding runs first, when exactly is the account created? After CYOA completion? Before? What if they abandon mid-onboarding?

Put your recommendations in the reasoning field. Be structured and concise.`

const DIPLOMAT_TASK = `[BAR External Sharing — Community & Trust]

You are the Diplomat. The recipient is outside the game — they may be wary. Propose:

1. **iOS preview (Open Graph)**: What og:title, og:description, og:image, og:url make a BAR link feel safe and inviting? Sender name? "X shared a reflection with you"? Campaign name? Avoid generic "Click here" — be specific.

2. **First impression**: The preview is the handshake. What copy and imagery build trust? What avoids "suspicious link" perception?

3. **Onboarding as welcome**: If campaign-BAR triggers onboarding first, how does the Diplomat frame it? "You're invited to [Campaign]. Complete a short orientation to view what [Sender] shared."

Put your recommendations in the reasoning field. Be structured and concise.`

const SHAMAN_TASK = `[BAR External Sharing — Ritual & Threshold]

You are the Shaman. A BAR shared externally is a threshold crossing — someone is being invited into a space. Propose:

1. **Ritual sequence**: Campaign-BAR → onboarding first. The Shaman presides over thresholds. Does the onboarding adventure serve as the ritual? How does the BAR-as-invitation align with invitation-via-BAR ritual?

2. **Emotional safety**: External recipient may feel vulnerable (unknown sender, unfamiliar context). What in the flow honors that? Preview before commitment? Clear "what happens next"?

3. **Belonging**: The BAR is a gift. How does the flow convey "you are welcome here" rather than "sign up to see a link"?

Put your recommendations in the reasoning field. Be structured and concise.`

const SAGE_MERGE_QUESTION = (
  architect: string,
  regent: string,
  diplomat: string,
  shaman: string
) => `You are the Sage. The Architect, Regent, Diplomat, and Shaman have each proposed how BAR external sharing should work. Synthesize their views into a single, actionable spec outline.

**Architect's proposal:**
${architect}

**Regent's proposal:**
${regent}

**Diplomat's proposal:**
${diplomat}

**Shaman's proposal:**
${shaman}

Produce a unified spec outline that:
1. Defines schema (external share model, token, URL shape)
2. Defines flow (link → preview → login/signup/onboarding decision tree)
3. Defines iOS preview requirements (meta tags, copy, image)
4. Integrates with invitation-via-BAR and golden path
5. Is minimal and implementable

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
    body: JSON.stringify({ task, feature_id: 'bar-external-sharing' }),
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
  console.log('Consulting Game Master agents on BAR external sharing...\n')
  console.log(`Backend: ${BACKEND_URL}`)

  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })

  console.log('1. Consulting Sage (routes to relevant faces)...')
  const sageResult = await sageConsult()

  console.log('2. Consulting Architect (schema, flow)...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Consulting Regent (order, rules)...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Consulting Diplomat (trust, iOS preview)...')
  const diplomatResult = await faceTask('diplomat', DIPLOMAT_TASK)

  console.log('5. Consulting Shaman (ritual, threshold)...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('6. Sage: synthesizing all faces...')
  const architectText = architectResult.reasoning || formatFallback(architectResult.output)
  const regentText = regentResult.reasoning || formatFallback(regentResult.output)
  const diplomatText = diplomatResult.reasoning || formatFallback(diplomatResult.output)
  const shamanText = shamanResult.reasoning || formatFallback(shamanResult.output)
  const sageMergeResult = await sageConsult(
    SAGE_MERGE_QUESTION(architectText, regentText, diplomatText, shamanText)
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'bar-external-sharing')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'GM_CONSULT.md')

  const markdown = `# Game Master Consultation — BAR External Sharing

**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npm run strand:consult:bar-external\`

When a player sends a BAR to someone outside the game, the recipient needs:
1. Log in (if they have an account)
2. Sign up (if they don't)
3. Onboarding adventure first (if BAR is campaign-associated)
4. iOS preview so the link doesn't look suspicious

---

## Sage Synthesis (initial routing)

${sageResult.synthesis}

*Consulted agents: ${(sageResult.consulted_agents ?? []).join(', ') || 'N/A'}*

---

## Architect Response (schema, flow)

${architectResult.reasoning || formatFallback(architectResult.output)}

---

## Regent Response (order, rules)

${regentResult.reasoning || formatFallback(regentResult.output)}

---

## Diplomat Response (trust, iOS preview)

${diplomatResult.reasoning || formatFallback(diplomatResult.output)}

---

## Shaman Response (ritual, threshold)

${shamanResult.reasoning || formatFallback(shamanResult.output)}

---

## Unified Spec Outline (Sage synthesis)

${sageMergeResult.synthesis}

---

## Next Steps

1. Create spec kit: spec.md, plan.md, tasks.md in this folder
2. Implement per GM recommendations
3. Add to backlog
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
