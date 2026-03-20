#!/usr/bin/env npx tsx
/**
 * Strand Consult: NPC Governance — What's Next
 *
 * Four-face consultation on:
 *   1. (Shaman) Personal tension metabolization — the creator is overworked across
 *      regent/architect/challenger faces and needs the system to relieve that load
 *   2. (Architect) Books → NPC constitution pipeline — how do extracted texts
 *      update NPC constitutions/schemas? What's the minimum viable pipeline?
 *   3. (Regent) Testing strategy — how to test what we've built (governance, NPC
 *      profiles, cultural substrate) while keeping momentum, not stopping to write tests
 *   4. (Sage) Synthesis — what is the single most generative next move?
 *
 * Output: .specify/specs/npc-governance-next/CONSULT.md
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { ensureBackendReady } from '../src/lib/backend-health'

const NO_AUTO_START = process.argv.includes('--no-auto-start')

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
const BACKEND_URL = rawBackendUrl.startsWith('http') ? rawBackendUrl : `https://${rawBackendUrl}`

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function faceTask(face: string, task: string): Promise<{ reasoning?: string; output?: unknown }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/${face}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, context: {} }),
  })
  if (!res.ok) throw new Error(`${face} task failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function sageConsult(question?: string): Promise<{ synthesis: string; consulted_agents: string[] }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question ?? SAGE_OPENING,
      context: {},
    }),
  })
  if (!res.ok) throw new Error(`Sage consult failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  // Response shape: { agent, output: { synthesis, consulted_agents, ... }, ... }
  const output = data.output ?? data
  return {
    synthesis: output.synthesis ?? JSON.stringify(output, null, 2),
    consulted_agents: output.consulted_agents ?? [],
  }
}

function text(r: { reasoning?: string; output?: unknown }): string {
  if (r.reasoning) return r.reasoning
  if (typeof r.output === 'string') return r.output
  return '```json\n' + JSON.stringify(r.output, null, 2) + '\n```'
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const SAGE_OPENING = `
I am the creator of a BARs Engine — a game and governance system built on Integral Theory and Taoist cultivation aesthetics.

I am noticing I am overworked across my internal Regent, Architect, and Challenger faces. I cannot be all of these at once. People don't have time to read all my work and implement it. I built this game to metabolize my own intuitions, heuristics, operational savvy, and domain expertise into a system others can build on.

The game is designed to operate on "sense and respond" rather than "command and control."

My personal tensions should be metabolizable into effective gameplay. The system should increase my joy in work where I'd otherwise feel burnt out.

Please route to Shaman, Architect, Regent, and synthesize:
- How does the system metabolize the creator's overwork?
- How do 14 extracted books update NPC constitutions with their wisdom?
- How do we test what we've built while staying in motion?
- What is the single most generative next move?
`.trim()

const SHAMAN_TASK = `
[Strand Consult — Shaman: Personal Tension as Gameplay Fuel]

The creator of BARs Engine is experiencing burnout symptoms: overworked across Regent (governance), Architect (structure), and Challenger (edge-holding) faces. They built this game explicitly to metabolize this kind of tension.

The system now has:
- Carried Weight mechanic (shadow belief as holdable card, loadLevel 1-3)
- Cultural substrate pipeline (exemplary BARs → AI distillation → card language)
- NPC governance (unfilled roles filled by NPCs, NPCs go dormant, humans displace them)
- PlayerAlignment accumulator (tracks which face domains a player is living in)

The creator's tension is: "I can't be regent AND architect AND challenger simultaneously. I have too many intuitions and the system isn't yet absorbing them fast enough."

Your task:
1. Name what face this tension is asking to be metabolized through. Is this a Clean Up? A Grow Up? A Show Up?
2. Propose a Carried Weight that the creator could name and hold — not to process now, but to make visible.
3. What would it look like for the SYSTEM to take the Regent and Architect weight off the creator's hands — specifically using the NPC governance layer we just built? What's the felt-sense difference between "handing off to an NPC" and "abandoning responsibility"?
4. What is the shadow belief underneath "I must be everyone at once"?

Be honest. Be somatic. Don't rush to solutions.
`.trim()

const ARCHITECT_TASK = `
[Strand Consult — Architect: Books → NPC Constitution Pipeline]

We have 14 books in the DB with extractedText:
The Skilled Helper, Reinventing Organizations, Existential Kink, Wikipedia The Missing Manual, MTGOA, 10000 Hours of Play, Integral Life Practice, Emergent Strategy, Holacracy Constitution, Hearts Blazing, Integral Communication, Kids on Bikes, Valve Employee Handbook, Actionable Gamification.

We also have:
- NpcConstitution model: { identity (JSON), values (JSON), function (JSON), limits (JSON), memoryPolicy, reflectionPolicy }
- NpcProfile: { altitude (face), tier (1-4), weeklyBudget, tokensUsed }
- Cultural substrate distillation pipeline: exemplary BARs → AI → DistillationCandidate

The vision: NPCs learn from these texts and update their own constitutions. A Shaman-altitude NPC reads Existential Kink and Integral Life Practice; a Regent-altitude NPC reads Holacracy and Reinventing Organizations; a Sage reads Emergent Strategy and Integral Theory.

Design the minimum viable pipeline:
1. Which books map to which NPC altitude/face? (assignment table)
2. What does "constitutional update" mean structurally? A new NpcConstitutionVersion? An update to identity.voice_style? A new field?
3. What's the AI prompt shape? (system_prompt, input: book_chunk, output: { field, update })
4. How do we rate-limit this so it doesn't become expensive? (which books, which sections, what's skippable)
5. What's the minimum schema addition needed (if any)?

Be precise. Propose a schema if needed. Think about token cost.
`.trim()

const REGENT_TASK = `
[Strand Consult — Regent: Testing Strategy While Staying in Motion]

We just built (in this session):
- Phase 1: move-expressions.ts (15 moves × triple-context expressions)
- Phase 2: intensity + contextLines fields on CustomBar, CARRIED_WEIGHT_SPEC
- Phase 3: isExemplar on CustomBar, PlayerAlignment, CarriedWeight, DistillationCandidate models
- Phase 3: cultural-substrate.ts (distillation pipeline action)
- NpcProfile model (altitude, tier, weeklyBudget, dormancy)
- Role extensions (Holacracy: purpose, accountabilities, npcFace, npcTier, prerequisites)
- PlayerRole extensions (instanceId, nationId, grantedByBarId, isFilledByNpc)
- governance.ts (fillUnfilledRoles, grantRoleToPlayer, getRoleManifest, consumeNpcTokens)
- npc-name-grammar.ts (5-nation Laobaixing + cultivation titles, deterministic)
- 3 existing NPCs renamed with proper names

None of this has been tested in-app. The creator wants to move forward, not stop for test coverage.

Your task as Regent:
1. What is the minimum viable "smoke test" that proves governance is working end-to-end? (Should be a script or a manual player flow, not a test suite)
2. What is the most likely breakage point in the governance loop right now?
3. What's the correct order of operations for making the NPC governance layer visible to a real user (the creator themselves)?
4. What admin UI surface is the highest-leverage next build — the one that lets the creator actually USE what we've built today?

Prioritize ruthlessly. The creator has limited energy. Name the one thing.
`.trim()

const SAGE_SYNTHESIS = (shaman: string, architect: string, regent: string) => `
[Sage Synthesis — NPC Governance: What's Next]

Three faces have consulted. Synthesize their responses into a clear, executable direction.

SHAMAN said:
${shaman}

ARCHITECT said:
${architect}

REGENT said:
${regent}

Your synthesis task:
1. What is the single most generative next move — the one that eliminates the most friction and opens the most space?
2. How does the creator hand off the overwork to the system without losing authorial voice?
3. What does "the game metabolizing the creator's tensions" look like concretely — name one specific feature or flow that would demonstrably relieve the pressure described?
4. What is the NPC governance loop that the creator should experience themselves, as a player, in the next 30 minutes?

Be direct. Be short. One answer per question. Name the move.
`.trim()

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })
  console.log('✓ Backend live\n')

  console.log('1. Shaman: Personal tension as gameplay fuel...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('2. Architect: Books → NPC constitution pipeline...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('3. Regent: Testing strategy while staying in motion...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('4. Sage: Synthesizing all three...')
  const sageSynthesis = await sageConsult(
    SAGE_SYNTHESIS(text(shamanResult), text(architectResult), text(regentResult))
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'npc-governance-next')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'CONSULT.md')

  const markdown = `# NPC Governance: What's Next
**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npx tsx scripts/strand-consult-npc-governance-next.ts\`

---

## Shaman — Personal Tension as Gameplay Fuel

${text(shamanResult)}

---

## Architect — Books → NPC Constitution Pipeline

${text(architectResult)}

---

## Regent — Testing Strategy While Staying in Motion

${text(regentResult)}

---

## Sage Synthesis — The Single Most Generative Next Move

${sageSynthesis.synthesis}

*Consulted agents: ${sageSynthesis.consulted_agents?.join(', ') || 'N/A'}*

---

## Immediate Action Items

> Extract from Sage synthesis above. Fill in after reading.

- [ ]
- [ ]
- [ ]
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
  console.log('\n--- Sage Synthesis Preview ---')
  console.log((sageSynthesis.synthesis ?? '(no synthesis)').slice(0, 600) + '...')
}

main().catch(e => { console.error(e); process.exit(1) })
