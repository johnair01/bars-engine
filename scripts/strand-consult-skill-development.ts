#!/usr/bin/env npx tsx
/**
 * Strand Consult: Skill Development + Attribute System
 *
 * Four-face consultation on:
 *   1. (Shaman)    The phenomenology of attributes — what it feels like to develop
 *                  a capacity through play, not through rolling dice
 *   2. (Regent)    The canonical attribute list + governance of skill unlock conditions —
 *                  what "demonstrated via quest" means structurally
 *   3. (Architect) Data model — PlayerAttribute, Skill, PlayerSkill — and what the
 *                  player profile page looks like as a character sheet
 *   4. (Sage)      Synthesis — the single governing principle that makes attributes +
 *                  skills feel like a character sheet, a growth record, AND a
 *                  gameplay mechanic simultaneously
 *
 * Design context:
 *   - No dice. Attributes are scores (0–5) visible on the player page.
 *   - Skills emerge from attributes — leveling an attribute unlocks skills tied to it.
 *   - Skills are archetype-specific (your archetype determines your skill tree).
 *   - Skills unlock when demonstrated via a completed quest — proof-of-work, not time-gating.
 *   - GM faces are level gates (like Pokémon Gym Leaders) ordered by Integral altitude:
 *       Shaman (Magenta) → Challenger (Red) → Regent (Amber) →
 *       Architect (Orange) → Diplomat (Green) → Sage (Teal)
 *   - Shadow boxing: boss NPC encounters at each face level deepen the player's
 *     relationship with the shadow of their archetype — the integrated version of
 *     the shadow is the skill that gets unlocked.
 *   - Reference: Kids on Bikes uses Brawn / Charm / Fight / Flight / Brains / Grit
 *     as attributes rated on die types. We want something analogous but:
 *       (a) no dice — scores instead
 *       (b) mapped to this system's elemental + Integral + shadow-work ontology
 *       (c) emerges from play, not from character creation choices
 *
 * Output: .specify/specs/skill-development/CONSULT.md
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
[Strand Consult — Shaman: The Felt Sense of an Attribute]

Context: BARs Engine is building an attribute system. There are no dice. Attributes
are scores (0 to 5) that grow through play — specifically through completing quests
that demonstrate the attribute. Everyone starts at zero. Attributes are visible
on the player's profile page like a character sheet.

The reference system is Kids on Bikes, which uses:
  Brawn, Charm, Fight, Flight, Brains, Grit — each rated on a die type (d4 to d20).

We do not use dice. We use score. And our system is built on:
  - Integral Theory (developmental altitude: Magenta → Red → Amber → Orange → Green → Teal)
  - Wuxing five elements (Wood/Joy, Fire/Anger, Earth/Neutrality, Metal/Fear, Water/Sadness)
  - Shadow work (the 321 process — Face It, Talk to It, Be It)
  - 8 archetypes (Bold Heart, Danger Walker, Decisive Storm, Devoted Guardian,
    Joyful Connector, Still Point, Subtle Influence, Truth Seer)

Your task (Shaman — somatic, pre-rational, felt sense):

1. What does it feel like in the body to go from 0 to 1 in an attribute?
   Not "you unlocked a new move" — what is the actual felt-sense shift?
   Name it the way a somatic practitioner would name it.

2. What are the 5 or 6 attributes this system needs?
   They should:
   - Mean something viscerally (not abstract categories)
   - Map to this system's emotional + developmental ontology
   - Feel like something you'd want to see on YOUR character sheet
   - Start at 0 for everyone — no one is born with high Craft or Presence
   Propose names and one-sentence felt-sense descriptions.

3. How does the shadow boxing mechanic connect to attribute development?
   When a player encounters their archetype boss (e.g., Baldric the Hollow
   for a Bold Heart player) and metabolizes the encounter, which attribute
   increases? Is it always the same attribute, or does it depend on which
   GM face is running the encounter (Shaman/Challenger/Regent/Architect/Diplomat/Sage)?

4. What is the somatic signature of being "maxed out" (score of 5) in an attribute?
   Not "you have unlocked all skills" — what does it feel like to be someone
   who carries a 5 in Presence, or a 5 in Edge?

Be embodied. Name the attributes from the inside.
`.trim()

const REGENT_TASK = `
[Strand Consult — Regent: Canonical Attributes + Unlock Governance]

Context: BARs Engine is building an attribute + skill system.

Structure so far:
  - Attributes: scores 0–5, start at 0, visible on player profile
  - Skills: archetype-specific, emerge from attributes, unlock when demonstrated via quest
  - GM faces as level gates (like Pokémon Gym Leaders) in Integral order:
      Shaman (Magenta) → Challenger (Red) → Regent (Amber) →
      Architect (Orange) → Diplomat (Green) → Sage (Teal)
  - Boss NPCs hold the shadow of each archetype and nation; encountering + metabolizing
    them is one of the ways skills get unlocked
  - Reference: Kids on Bikes attributes (Brawn, Charm, Fight, Flight, Brains, Grit)

Your task (Regent — conventional authority, governing rules, canonical structures):

1. What is the canonical attribute list?
   Propose 5 or 6 attributes that:
   - Map to the 6 GM faces as developmental lines
   - Every archetype has all 6 attributes (just starts at 0)
   - Each attribute has a clear governance rule: what actions increase it?
   Provide: attribute name + which GM face governs it + what player action raises it.

2. What does "demonstrated via quest" mean as an unlock condition?
   Design the rule precisely:
   - Which quest types count? (321 quest, Grow Up quest, Show Up quest, etc.)
   - What metadata on the quest triggers the skill unlock? (moveType? alignedAction? BAR type?)
   - Can a skill unlock be appealed or contested? (Regent says: probably not, but...)
   - Is there a cooldown or minimum interval between unlocks?

3. Skill unlock governance:
   - A skill requires attribute score N to unlock — what should N be?
     (e.g., skill tier 1 = attribute ≥ 1; skill tier 2 = attribute ≥ 3; mastery = 5)
   - Should skills have prerequisites (you need Skill A before Skill B)?
   - What does skill "mastery" look like vs just "unlocked"?

4. Cross-archetype learning:
   The player asked: how do you learn skills from other archetypes?
   Regent rules: is this via a quest unlock? A campaign event? An NPC offering?
   Propose the governance rule for cross-archetype skill access.

Be precise. Propose specific rules. Think about edge cases and exploits.
`.trim()

const ARCHITECT_TASK = `
[Strand Consult — Architect: Data Model + Player Profile Page]

Context: BARs Engine is adding an attribute + skill system to an existing
Next.js 14+ / Prisma / PostgreSQL stack.

Existing relevant models:
  - Player { id, nationId, archetypeId, ... }
  - CustomBar { type: 'quest' | 'bar' | ..., moveType, status, ... }
  - NpcConstitution { tier, status, archetypalRole, ... }
  - PlayerNationMoveUnlock { playerId, moveId } — existing "unlock" pattern

New system to design:
  - 5–6 attributes per player (everyone, archetype-agnostic)
  - Skills are archetype-specific (your archetype has a specific skill tree)
  - Skills emerge from attributes reaching thresholds
  - Skills are unlocked by completing quests that demonstrate the skill
  - This all needs to look good on a player profile page (character sheet aesthetic)

Your task (Architect — rational, structural, systemic):

1. Propose the Prisma schema additions:
   - PlayerAttribute model
   - Skill model (the registry — what skills exist)
   - PlayerSkill model (which skills a player has and their status)
   Consider: how are Skill records identified? By key (archetype_key + face_key + level)?
   How do PlayerAttribute scores tie to PlayerSkill unlocks?

2. Where does attribute increase get triggered?
   Map the trigger points in the existing codebase:
   - Quest completion (which action? createQuestFrom321Metadata? moveQuestToGraveyard?)
   - BAR creation and publication (which action?)
   - Boss NPC defeat condition (which NpcAction verb?)
   What is the service function signature?

3. Player profile page design:
   Sketch the data shape for a player character sheet. What does
   \`GET /api/player/[id]/profile\` return?
   Include: attributes with scores, skills with status, archetype + nation,
   boss NPC encounter history.

4. Skill tree display: how do you represent a skill tree on a page
   without a graphical node editor? Propose a flat list format that is
   still visually compelling (the player should feel like they are
   looking at their own legend).

Be concrete. Write actual Prisma schema. Think about query efficiency.
`.trim()

const SAGE_SYNTHESIS = (shaman: string, regent: string, architect: string) => `
[Sage Synthesis — Skill Development: The Governing Principle]

Three faces have consulted on the attribute + skill system for BARs Engine.

The system must accomplish three things simultaneously:
  1. CHARACTER SHEET — looks compelling on a player profile; tells the story of who this player is becoming
  2. GROWTH RECORD — every score reflects actual demonstrated behavior, not chosen preferences
  3. GAMEPLAY MECHANIC — attributes and skills create real differences in how the game plays

SHAMAN said:
${shaman}

REGENT said:
${regent}

ARCHITECT said:
${architect}

Your synthesis task:

1. What are the canonical 5 or 6 attributes — final answer?
   Name them. One sentence each. These are the attributes that go on every player sheet.

2. What is the governing principle that makes this feel earned rather than grinded?
   The difference between "I completed 10 quests and my Craft went up" (grind)
   and "I built something real and my Craft reflects that" (earned).
   Name the principle in one sentence.

3. How does shadow boxing (boss NPC encounter) map to specific attribute gains?
   Which attribute does each boss NPC encounter advance?
   (Nation Bosses and Archetype Bosses may advance different attributes.)

4. What does a player page look like that honors both the character sheet aesthetic
   AND the shadow work / integral development ontology?
   Describe it in terms of layout and felt-sense — not wireframe, but atmosphere.

5. What is the one thing this system must protect against?
   (The mechanic that, if it went wrong, would turn growth into performance of growth.)

Be direct. Final answers only. Name the attributes.
`.trim()

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })
  console.log('✓ Backend live\n')

  console.log('1. Shaman: The felt sense of an attribute...')
  const shamanResult = await faceTask('shaman', SHAMAN_TASK)

  console.log('2. Regent: Canonical attributes + unlock governance...')
  const regentResult = await faceTask('regent', REGENT_TASK)

  console.log('3. Architect: Data model + player profile page...')
  const architectResult = await faceTask('architect', ARCHITECT_TASK)

  console.log('4. Sage: Synthesizing the governing principle...')
  const sageSynthesis = await sageConsult(
    SAGE_SYNTHESIS(text(shamanResult), text(regentResult), text(architectResult))
  )

  const outputDir = join(process.cwd(), '.specify', 'specs', 'skill-development')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = join(outputDir, 'CONSULT.md')

  const markdown = `# Skill Development + Attribute System
**Date**: ${new Date().toISOString().slice(0, 10)}
**Source**: \`npx tsx scripts/strand-consult-skill-development.ts\`

---

## The Design Problem

BARs Engine needs an attribute + skill system that is:
- **A character sheet** — tells the story of who this player is becoming
- **A growth record** — every score reflects demonstrated behavior, not preferences
- **A gameplay mechanic** — attributes and skills create real differences in play

### Constraints
- No dice — scores (0–5), not die types
- Everyone starts at 0 — attributes emerge from play
- Skills are archetype-specific — your archetype determines your skill tree
- Skills unlock when demonstrated via completed quest (proof-of-work)
- GM faces are level gates in Integral altitude order:
  Shaman → Challenger → Regent → Architect → Diplomat → Sage
- Shadow boxing: boss NPC encounters deepen the relationship with the archetype's shadow;
  the integrated shadow becomes the skill

### Reference
Kids on Bikes: Brawn / Charm / Fight / Flight / Brains / Grit — die-typed attributes.
We want the same legibility and character-sheet feel, without dice.

---

## Shaman — The Felt Sense of an Attribute

${text(shamanResult)}

---

## Regent — Canonical Attributes + Unlock Governance

${text(regentResult)}

---

## Architect — Data Model + Player Profile Page

${text(architectResult)}

---

## Sage Synthesis — The Governing Principle

${sageSynthesis.synthesis}

*Consulted agents: ${sageSynthesis.consulted_agents?.join(', ') || 'N/A'}*

---

## Immediate Action Items

> Extract from Sage synthesis above. Fill in after reading.

- [ ] Finalize canonical attribute list (from Sage synthesis)
- [ ] Write Prisma schema additions (PlayerAttribute, Skill, PlayerSkill)
- [ ] Define unlock trigger points in existing actions
- [ ] Design player profile page data shape
- [ ] Write spec: .specify/specs/skill-development/spec.md
`

  writeFileSync(outputPath, markdown, 'utf-8')
  console.log(`\n✅ Consultation written to ${outputPath}`)
  console.log('\n--- Sage Synthesis Preview ---')
  console.log((sageSynthesis.synthesis ?? '(no synthesis)').slice(0, 800) + '...')
}

main().catch(e => { console.error(e); process.exit(1) })
