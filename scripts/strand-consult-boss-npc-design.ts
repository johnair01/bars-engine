#!/usr/bin/env npx tsx
/**
 * Strand Consult: Boss NPC Design
 *
 * Four-face consultation on:
 *   1. (Shaman)    The psychological function of antagonists in a growth game — what
 *                  oppositional force serves development rather than destruction?
 *   2. (Challenger) How opposition works mechanically without a damage system — the
 *                  non-violent forms of pressure, resistance, and consequence.
 *   3. (Architect)  Systematic generation of boss NPCs from the nation × archetype
 *                  matrix — data model, constitution template, generation pipeline.
 *   4. (Sage)       Synthesis — the single governing principle that makes boss NPCs
 *                  compelling without damage.
 *
 * Boss NPC taxonomy:
 *   - 8 Archetype Bosses: the Great Antagonist of each archetype
 *     (Bold Heart, Danger Walker, Decisive Storm, Devoted Guardian,
 *      Joyful Connector, Still Point, Subtle Influence, Truth Seer)
 *   - 5 Nation Bosses: the Great Antagonist of each nation
 *     (Argyra/Metal, Pyrakanth/Fire, Lamenth/Water, Virelune/Wood, Meridia/Earth)
 *   - Giacomo: campaign NPC (villain / shadow merchant, Tier 4) — already active
 *
 * Output: .specify/specs/boss-npc-design/CONSULT.md
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

async function sageConsult(question: string): Promise<{ synthesis: string; consulted_agents: string[] }> {
  const res = await fetch(`${BACKEND_URL}/api/agents/sage/consult`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context: {} }),
  })
  if (!res.ok) throw new Error(`Sage consult failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
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
// Face tasks
// ---------------------------------------------------------------------------

const SHAMAN_TASK = `
[Strand Consult — Shaman: The Antagonist as Growth Catalyst]

Context: BARs Engine is a game built on Integral Theory and Taoist cultivation aesthetics.
Players move through shadow work (321 process), emotional alchemy, quests, and daemons.
There is NO damage system. No HP, no combat, no deaths.

We are designing Boss NPCs — high-tier NPCs that function as antagonists:
- 8 Archetype Bosses (one per archetype: Bold Heart, Danger Walker, Decisive Storm,
  Devoted Guardian, Joyful Connector, Still Point, Subtle Influence, Truth Seer)
- 5 Nation Bosses (one per nation: Argyra/Metal, Pyrakanth/Fire, Lamenth/Water,
  Virelune/Wood, Meridia/Earth)
- Giacomo is already the campaign-level antagonist (villain / shadow merchant, Tier 4)

The core tension: in a game where no damage is dealt, what makes an NPC a "Boss"?
What distinguishes a boss antagonist from a difficult NPC or a challenging quest?

Your task (Shaman):
1. What is the psychological archetype of the antagonist in a development game?
   In Jungian terms, what function does the shadow merchant / trickster / adversary serve
   when the player's primary arc is integration and growth?

2. What is the "damage equivalent" in a game about growth?
   If not hit points, what does an antagonist cost the player? What gets destabilized,
   complicated, or delayed? Name the non-violent currencies of opposition.

3. For each of the 5 Wuxing nations (Metal/fear, Fire/anger, Water/sadness, Wood/joy,
   Earth/neutrality), what is the archetypal shadow that a Nation Boss embodies?
   The shadow that a player from that nation most needs to face?

4. What is the somatic signature of meeting a Boss NPC? How does the player know
   this is different from a regular encounter? Not through an HP bar — through what?

Be direct. Be psychological. Name specific shadows, not categories.
`.trim()

const CHALLENGER_TASK = `
[Strand Consult — Challenger: Opposition Without Damage — The Mechanics of Resistance]

Context: BARs Engine has no damage system. Players advance through shadow work,
quest completion, BAR creation, and emotional alchemy. Boss NPCs must provide
meaningful opposition without dealing "damage."

Current NPC action verbs:
  reveal_lore | ask_question | challenge_player | affirm_player |
  offer_quest_seed | reflect_bar | redirect_scene | deepen_scene | handoff_to_other_npc

The NpcConstitution model has:
  - limits.can_initiate[]  — what verbs the NPC can use
  - limits.cannot_do[]     — hard constraints
  - limits.requires_regent_approval_for[] — verbs that need Regent sign-off
  - NpcRelationshipState: trust (-100 to 100) + tension (0 to 100) per player

The Challenger's lens: what makes opposition REAL without violence?

Your task:
1. Propose 4–6 new action verbs that Boss NPCs specifically need — verbs that create
   genuine resistance without violence. Think in terms of:
   - Complicating quests (not blocking, but revealing the cost)
   - Testing commitment (the NPC knows the player's shadow and names it)
   - Withholding (an NPC who controls access to something the player needs)
   - Misdirection (the villain's signature: silken lies)
   - Confronting evasion (the NPC refuses to let the player perform growth they haven't earned)
   For each verb: name, effect on NpcRelationshipState, and when Regent approval is needed.

2. How does a Boss NPC affect quest progression without a damage stat?
   Design a mechanic where the Boss NPC can "complicate" an active quest —
   adding cost, surfacing a carried weight, or requiring additional proof-of-work.
   Make it concrete: what DB field changes? What player-facing event appears?

3. What is the "defeat" of a Boss NPC?
   In a growth game, what does it mean to overcome an antagonist?
   Not kill, not loot — what does the player do, and what does the system record?

4. How does the trust/tension state on NpcRelationshipState function differently
   for Boss NPCs vs regular NPCs? What thresholds trigger what behaviors?

Be mechanical. Propose actual verbs, field names, and threshold values.
`.trim()

const ARCHITECT_TASK = `
[Strand Consult — Architect: Boss NPC Generation Pipeline — Nation × Archetype Matrix]

Context: BARs Engine has:
  - 5 canonical nations: Argyra (Metal), Pyrakanth (Fire), Lamenth (Water),
    Virelune (Wood), Meridia (Earth)
  - 8 canonical archetypes: Bold Heart, Danger Walker, Decisive Storm,
    Devoted Guardian, Joyful Connector, Still Point, Subtle Influence, Truth Seer
  - NpcConstitution schema: { name, archetypalRole, tier, identity (JSON),
    values (JSON), function (JSON), limits (JSON), memoryPolicy, reflectionPolicy,
    currentLocation, linkedAdventures, governedBy, status }

Boss NPC plan:
  - 5 Nation Bosses (one per nation) — "The Great Antagonist" of each nation
  - 8 Archetype Bosses (one per archetype) — "The Shadow" of each archetype
  - Giacomo = campaign-level villain (already in constitution schema)
  - All bosses: Tier 3 or 4 depending on scope (nation = 3, campaign = 4)

Design a systematic generation pipeline:

1. Constitution template per boss type:
   a) Nation Boss template: What constitution fields are derived from the nation
      (element, emotional channel, city aesthetic)? What is fixed vs generated?
      Provide a concrete template for one nation boss (e.g. the Pyrakanth Boss).
   b) Archetype Boss template: What constitution fields are derived from the archetype?
      What is the antagonist version of e.g. the Bold Heart or the Still Point?
      Provide a concrete template for one archetype boss.

2. Naming convention: Boss NPCs need names that fit the Laobaixing cultivation aesthetic
   (the npc-name-grammar.ts already generates 5-nation names). How should boss NPC names
   differ from regular NPC names? More formal? Title-bearing? Nation-locked?

3. Seed script design: We need \`scripts/seed-boss-npcs.ts\`.
   What shape should it take? Should it be:
   a) Fully hardcoded (13 named NPCs with specific constitutions)
   b) Template-generated (a function per archetype/nation that generates constitutions)
   c) AI-assisted (each boss is generated by the Regent agent via Claude API)
   Recommend the right approach and provide pseudocode.

4. Schema additions: Are any schema fields missing for Boss NPCs specifically?
   Consider: challenge_difficulty, unlocked_by_quest_id, appears_at_location_only,
   player_defeat_condition, defeat_recorded_in.

5. What is the minimum viable seeding to prove the system works?
   Name the 3 boss NPCs to build first (don't do all 13 — pick the 3 that teach the
   most about the design).

Be precise. Propose actual code structure. Think about token budget.
`.trim()

const SAGE_SYNTHESIS = (shaman: string, challenger: string, architect: string) => `
[Sage Synthesis — Boss NPC Design: The Governing Principle]

Three faces have consulted on Boss NPC design for BARs Engine.

The core question: In a game without damage, what makes a Boss NPC a Boss?

SHAMAN said:
${shaman}

CHALLENGER said:
${challenger}

ARCHITECT said:
${architect}

Your synthesis task:
1. What is the single governing design principle for Boss NPCs in this system?
   Name it in one sentence. This principle should be derivable by any future
   designer who reads it — they should know immediately what a Boss NPC is for.

2. What distinguishes an Archetype Boss from a Nation Boss?
   (Distinct psychological roles? Different action verb pools? Different defeat conditions?)

3. What new action verbs (from the Challenger's proposals) make the approved list?
   Name specifically which verbs a Boss NPC gets that regular NPCs don't.

4. What is the defeat condition — what does a player do to "overcome" a Boss NPC?
   State it in system terms (what DB record is created, what quest state changes,
   what the player sees).

5. Which 3 Boss NPCs should we build first, and why those 3?

6. What is the one thing this system must NOT do — the design constraint that would
   betray the "no damage" principle even while appearing to be legitimate opposition?

Be direct. One answer per question. Name the principle.
`.trim()

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })
  console.log('✓ Backend live\n')

  console.log('1. Shaman: Antagonist as growth catalyst...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('2. Challenger: Opposition without damage...')
  const challengerResult = await faceTask('challenger', CHALLENGER_TASK)

  console.log('3. Architect: Boss NPC generation pipeline...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('4. Sage: Synthesizing the governing principle...')
  const sageSynthesis = await sageConsult(
    SAGE_SYNTHESIS(text(shamanResult), text(challengerResult), text(architectResult))
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'boss-npc-design')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'CONSULT.md')

  const markdown = `# Boss NPC Design: The Antagonist Without Damage
**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npx tsx scripts/strand-consult-boss-npc-design.ts\`

---

## The Question

In BARs Engine, there is no damage system. No HP, no combat, no deaths.
Yet the game has villain NPCs (Giacomo), oppositional forces, and high-stakes encounters.

We are designing Boss NPCs:
- **8 Archetype Bosses** — the Great Antagonist of each archetype
- **5 Nation Bosses** — the Great Antagonist of each nation
- **Giacomo** — the campaign villain (already active, Tier 4)

The design question: *What makes a Boss NPC a Boss in a game about growth?*

---

## Shaman — The Antagonist as Growth Catalyst

${text(shamanResult)}

---

## Challenger — Opposition Without Damage: The Mechanics of Resistance

${text(challengerResult)}

---

## Architect — Boss NPC Generation Pipeline: Nation × Archetype Matrix

${text(architectResult)}

---

## Sage Synthesis — The Single Governing Principle

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
  console.log((sageSynthesis.synthesis ?? '(no synthesis)').slice(0, 800) + '...')
}

main().catch(e => { console.error(e); process.exit(1) })
