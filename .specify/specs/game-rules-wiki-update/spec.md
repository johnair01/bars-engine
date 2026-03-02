# Spec: Game Rules Wiki Update — BAR Ecology, Decks, Quests, Vibeulons, Compost, Slot Market

## Purpose

Update the game rules wiki (source of truth: bars-engine repo wiki/docs) to include the newly designed mechanics. Deliver a coherent "Rules" section with crisp definitions, state machines, and player-facing explanations. Admin details go in a separate subpage.

**Scope**: Wiki update only. No code changes to game logic, schema, or constraints. No new constraints on BAR creation (players can always create private BARs).

## Non-Goals

- No heavy AQAL jargon in onboarding language; keep it human
- No advanced hat mechanics in this pass (hats are post-dojo unlock)
- Focus on BAR/Quest/Vibeulon loops

## Core Principles (Document in Wiki)

### P0: Vibes Must Flow
The system rewards movement of emotional charge into clear signal and then into action. Stagnation is allowed privately; stagnation in the public spellbook is metabolized through attention scarcity, composting, and eventual destruction.

### P1: Signal → Seed → Cultivation → Action → Treasure
- BARs are seeds/cards that carry charge and become leverage
- Quests are actions-in-the-field; completing them crystallizes value
- Vibeulons are the "treasure" minted from completed transformations, with provenance linking back to BARs

### P2: Sense and Respond (Holacracy-style)
Governance is not pre-emptive policy. Tension becomes a BAR; traction becomes a quest; action continues while charge remains.

## Canon Entities (Wiki Definitions)

### BAR (Basic Artifact Resource)
A compact, shareable unit of signal: a "seed packet" for eventual action. BARs can be private (notebook) or public (spellbook).

Fields (conceptual): id, title, content, tags, visibility (private | public), steward (none | player_id), quadrant (me | it | we | its), state (library | equipped | in_play | composted | destroyed), provenance_links.

### Vibeulon
A unit of crystallized value minted from completing quests. Vibeulons can be attached to BARs (locking them) and are destroyed if left attached when compost expires.

Fields (conceptual): id, owner_id, provenance (bar_id(s), quest_id, timestamps).

### Quest
An actionable commitment in the field. Quests have limited BAR slots; BARs "played" into a quest can mint vibeulons on completion.

Fields (conceptual): id, status (open | active | completed | failed/expired), slots_total, slots_filled, slot_entries, thread/log.

### Compost Heap
A public zone for BARs removed from active play. Compost is temporary; untransformed composted BARs are destroyed after a time window (with any attached vibeulons).

## User Stories

### P1: BARs — Private vs Public
**As a player**, I want to understand the difference between private and public BARs, so I know when my notes stay private and when they enter play.

**Acceptance**: Wiki section "BARs: Private vs Public" explains: Private (notebook) = unlimited, freeform, no scarcity, no compost/destruction. Public (spellbook) = cards used in play, require refinement before entering. Membrane rule: private → public requires refinement (shortened, structured, categorized).

### P2: BAR Format — Brevity + Quadrant
**As a player**, I want to know how to format a public BAR, so I can publish correctly.

**Acceptance**: Wiki section "BAR Format: Brevity + Quadrant" explains: (1) Quadrant in human language: About me, About something happening (observable), About us (relational/cultural), About the system (structural). (2) Brevity constraint (short form expectation). (3) Optional: tags, Yes/And additions. Avoid forcing "I feel" syntax.

### P3: Anonymity + Stewardship Adoption
**As a player**, I want to understand anonymous BARs and stewardship, so I can take up others' signal or post anonymously.

**Acceptance**: Wiki section "Anonymity + Stewardship Adoption" explains: Anonymous toggle per BAR; anyone can adopt stewardship (does not claim authorship); stewardship persists unless released/composted; stewardship as practice (carrying, refining, upgrading, converting to quest, composting).

### P4: Decks — Library / Equipped / In Play
**As a player**, I want to understand BAR zones and deck management, so I know where my BARs live.

**Acceptance**: Wiki section "Decks: Library / Equipped / In Play" explains: Library (spellbook) = all public BARs you steward; Equipped (hand) = curated subset for current play, capacity limits, scarcity; In Play = attached to quest slot; Compost = removed from circulation, temporary; Destroyed = gone permanently. Rule: Equipped BARs do nothing passively; they matter only when actively played.

### P5: Quests + BAR Slots + Minting
**As a player**, I want to understand how quests work with BAR slots and vibeulon minting, so I can complete the loop.

**Acceptance**: Wiki section "Quests + BAR Slots + Minting" explains: Fixed slot count; FCFS claiming; each BAR played on quest mints 1 vibeulon on completion; provenance links to BAR and quest; allocation to BAR's steward.

### P6: Compost Heap — Clean Up + Destruction
**As a player**, I want to understand composting and destruction, so I know what happens when BARs leave play.

**Acceptance**: Wiki section "Compost Heap: Clean Up Mechanics + Destruction" explains: Composting removes BAR from deck; composted BARs cannot be equipped or played; can be adopted/transformed; transformation required to re-enter (merge, fork, rewrite); expiration + destruction (BAR and attached vibeulons destroyed); destruction logged publicly; tone: ecological, not moralistic; "returned to the fire" language allowed.

### P7: Slot Offers — Merge / Buyout + Public Override
**As a player**, I want to understand how displacement works on quest slots, so I can propose better-suited BARs.

**Acceptance**: Wiki section "Slot Offers: Merge / Buyout + Public Override" explains: Voluntary withdrawal (costs 1 vibeulon, burned); displacement via Merge Offer (merge incumbent + proposed into transformed BAR) or Buyout/Seat Transfer (offer vibeulons to incumbent); offers public + transparent (attunement note, countdown); time-based override (auto-execute if no response in window); one active offer per slot; escrow; optional cooldown. Default response window (e.g., 12 hours). Tone: consent + flow, not forced seizure.

### P8: Capacity + Refinement Progression
**As a player**, I want to understand how hand size expands, so I can grow my capacity.

**Acceptance**: Wiki section "Capacity + Refinement Progression" explains: Capacity = equipped limit; expands via refinement (merging, forking, upgrading, converting to quest, composting with lesson); capacity starts small; increases after repeated refinements; deck management is core skill.

### P9: Design Principles
**As a player**, I want to understand the core design principles, so I get the vibe of the system.

**Acceptance**: Wiki section "Design Principles: Vibes Must Flow + Sense/Respond" explains P0, P1, P2 in player-facing language.

### P10: Glossary
**As a player**, I want a glossary of terms, so I can look up definitions quickly.

**Acceptance**: Glossary includes: BAR, Vibeulon, Quest, Stewardship, Compost, Equipped, In Play, Quadrant.

## Vibeulon Economics (Detail)

- **Minting**: Quest completion → each played BAR mints 1 vibeulon; provenance includes BAR + quest
- **Attachment locking**: Vibeulons can attach to BARs (consecration); attached = locked; unlock via detach or quest completion
- **Compost destruction**: BAR with attached vibeulons composted and not transformed before expiry → BAR + vibeulons destroyed; public/visible

## Governance (Minimal)

Domain governance decides what BARs get formalized into official quests. Tensions become BARs; traction becomes quests; action continues while energy remains. Avoid neurotic "what if steward ignores" sections. Hats: separate page, post-dojo unlock.

## Player-Facing Core Loop Summary

1. Capture raw signal privately (Private BAR)
2. Refine into a public seed (Public BAR) — short, structured, quadrant-tagged
3. Equip a small hand (deck management)
4. Play BARs onto quests (limited slots)
5. Complete quests → mint vibeulons with BAR provenance
6. Tend the garden: yes/and, refine, merge/fork, compost
7. Compost expires → destruction event (public); neglected charge burns

## Functional Requirements

- **FR1**: Wiki contains coherent end-to-end explanation of the loop for new players
- **FR2**: Rules internally consistent (minting, compost, equipping, slot claiming)
- **FR3**: Emotional tone: dojo/ecology, not bureaucratic or therapeutic
- **FR4**: AQAL present only as human-language quadrant tagging
- **FR5**: Clear "what happens when" state transitions for BARs and vibeulons
- **FR6**: Admin details (if any) in separate subpage

## Deliverables (Wiki Pages / Sections)

| Page/Section | Path | Content |
|--------------|------|---------|
| Rules index | `/wiki/rules` | Links to all rules sections |
| BARs: Private vs Public | `/wiki/rules/bar-private-public` | P1 |
| BAR Format | `/wiki/rules/bar-format` | P2 |
| Anonymity + Stewardship | `/wiki/rules/stewardship` | P3 |
| Decks | `/wiki/rules/decks` | P4 |
| Quests + Slots + Minting | `/wiki/rules/quests-slots` | P5 |
| Compost Heap | `/wiki/rules/compost` | P6 |
| Slot Offers | `/wiki/rules/slot-offers` | P7 |
| Capacity + Refinement | `/wiki/rules/capacity` | P8 |
| Design Principles | `/wiki/rules/design-principles` | P9 |
| Glossary (expand) | `/wiki/glossary` or `/wiki/rules/glossary` | P10 |

## Reference

- FOUNDATIONS.md (BAR as kernel, vibeulons)
- Existing glossary: [src/app/wiki/glossary/page.tsx](../../src/app/wiki/glossary/page.tsx)
- Wiki layout: [src/app/wiki/layout.tsx](../../src/app/wiki/layout.tsx)
