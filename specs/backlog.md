# BARS Engine — Design Backlog

Items captured from GM sessions, player feedback, and architectural insight.
Ordered within priority tiers. Not a sprint plan — a living record.

---

## P0 — Blocks ritual integrity

### Privacy Policy Page (Sage-authored, Teal lens)
**Trigger**: The word "privacy" anywhere in 321 flow, and eventually across the full UI, should become a link to `/privacy`.

**The page**:
- Written by the Sage, speaking fluently from all agent voices but held within a teal developmental frame
- Teal = systems-aware, integrative, post-conventional; the language honors interiority without collapsing into relativism
- It does not hide behind legalese. It speaks to why we protect inner work, what we do and don't capture, and why the structural extraction model (tension vector, not journal text) is a design choice not just a legal one
- It should feel like the Sage is sitting across from someone who just asked "wait, where does this actually go?" — and answering honestly
- The Steward face reviews for accuracy and edge cases before publish
- Until page exists: link should render as a `[privacy →]` styled badge next to any "private" claim in the UI

**Implementation note**:
- In `Shadow321Runner.tsx` face_1 scene: `subtext="Write freely. This stays private."` → append link when `/privacy` exists
- Extend this pattern to EFA, character creator fears, and any future contemplative input

---

## P1 — Significant design improvements

### Operationalized GM NPCs & Ritual Choice — "The Descent Guide"
**Design principle from GM session**:

> "The 321 shouldn't just be an automated form; it should be a guided descent. Choosing your guide—whether it's the Architect for logic or the Shaman for myth—is the first act of sovereignty in the ritual."

**What this means concretely**:
- **NPC Guides**: The 6 GM faces are now operationalized as named NPCs (Vorm, Ignis, Aurelius, Sola, Kaelen, The Witness) with distinct worldbuilding ties to the 5 Nations.
- **Pre-Flight Selection**: Players select their NPC guide before starting the 321. This choice determines the voice, tone, and specific branching logic of the session.
- **Lore Integration**: The session prompts are injected with the player's Nation and Archetype context, making the 321 a lore-immersive experience rather than a generic contemplative tool.
- **The Ritual Fork**: If a player goes deep (detected via `session_depth_signal`), the NPC guide offers a choice: metabolize the BAR immediately (fast path) or descend further into a "lower cavern" (deep path).

**Deftness move**:
> "Turning a static process into an agency-driven game loop."

**Implementation notes**:
- **Near term**: Create `worldbuilding_lore.md` artifact (Done).
- **Near term**: Update 321 Runner UI to include the NPC selection pre-flight.
- **Medium term**: Update agent system prompts to reflect NPC identities.
- **Medium term**: Build the `session_depth_signal` to trigger the "Ritual Fork" branching choice.
- **Longer term**: NPCs remember past sessions, referencing previous "descents" to build long-term narrative continuity.

---

### Descent / Anabasis Pattern — Design Doctrine
**From GM session**:

> "The most savvy players know that learning to descend into hell is often the fastest way to reach anabasis."

**Anabasis** = the return journey upward (Xenophon's march, the hero's ascent after descent).

**What this means for the UI**:
- The 321 shadow process IS the descent. The artifact IS the anabasis. These are not two separate things — they are one continuous movement
- Players who resist the descent (skip questions, give surface answers, exit early) often get weaker artifacts and slower progress
- The UI should honor the descent without dramatizing it. The Shaman voice holds the space. The Challenger names what's being avoided. The Sage witnesses the turn
- The scene card arc from Face It → Talk to It → Be It → Alchemy Reveal is structurally a descent into the mask followed by an ascent through the artifact
- This should be *felt*, not explained. The design should not say "you are descending." It should create the conditions for descent through pacing, voice, and spaciousness

**Implication for artifact quality**:
- Players who go deep (many scenes, long answers, genuine fear-naming) should receive richer artifact suggestions — more specific BAR titles, stronger quest hooks
- This is a future deftness evaluation hook: `session_depth_signal → artifact_richness_modifier`

---

## P2 — Enhancement and extension

### Privacy Link Badge Component
A small reusable inline badge: `[privacy →]`
- Renders as an unobtrusive link inline with any "private" or "stays private" copy
- Styled: `text-zinc-600 hover:text-zinc-400 text-xs underline underline-offset-2`
- Links to `/privacy`
- Used across: 321 runner, EFA sessions, character creator fears, any contemplative input field

### Scene Depth Signal
A lightweight signal computed from session answers:
```typescript
type SessionDepthSignal = {
  avgAnswerLength: number        // chars per scene answer
  deepPhraseCount: number        // "fear", "shame", "always", "never", "can't", etc.
  maskNameSpecificity: number    // generic vs. specific (0–1)
  totalScenes: number
  depth: 'surface' | 'engaged' | 'deep'
}
```
Used by: artifact richness modifier, future adaptive pacing engine.

---

## Doctrine

### The Concierge Principle
The gift of context delivered at the exact moment it becomes useful — not earlier (anxiety-inducing) and not later (too late to matter). This is what expensive human coaching provides. The agent system approximates it through:
1. GM voice lines timed to scene transitions
2. Artifact previews that appear only after enough data exists to make them meaningful
3. Pacing that slows when depth increases

### The Descent / Anabasis Doctrine
Shadow work is not a detour from growth — it is the fastest path. The system should honor descent as a first-class action. Resistance to descent (surface answers, premature dispatch) is a signal, not a failure. The system should hold space for descent without forcing it.

### Teal as the Privacy Voice
The privacy page is written from a teal developmental frame because:
- Pre-teal frames will either over-legalize (orange) or over-moralize (green) the privacy question
- Teal holds the systemic view: why structural extraction protects both the player and the collective; why inner work data has different ethics than behavioral data
- The Sage is the right voice because the Sage orchestrates across all voices without collapsing into any one

---
*Last updated: 2026-03-13*
