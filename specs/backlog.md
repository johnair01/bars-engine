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

### Adaptive Scene Pacing — "Gift of Context" Engine
**Design principle from GM session**:

> "As a GM I only plan 2–3 emotional beats ahead of the players so I can be responsive to their authentic motivations. The UI should give the gift of context at the exact moment it might be needed."

**What this means concretely**:
- Scene cards should not frontload structure. Players should not feel the 10-scene arc from the first card
- Context (GM voice lines, reframe language, artifact previews) should arrive *just before* the moment it becomes useful — not earlier, not as a menu
- The system should be able to sense when a player is going deeper than expected (long answers, emotional language) and slow the pacing — fewer cards per "scene", more space
- Concierge principle: expensive human coaching gives you individualized pacing. The agent system can approximate this through adaptive reveal

**Deftness move**:
> "Learning to anticipate how many scenes an emotional transformation might take."

This is a game mechanic — a learnable skill for players who run 321 for others, and an architectural property of the scene card system itself. A player who has done 30 sessions begins to feel when a transformation is a 6-card arc vs a 14-card arc. The system should eventually surface this signal.

**Implementation notes**:
- Near term: don't display total scene count upfront — show only the progress strip, no "Step 3 of 10" label
- Near term: GM voice lines should reference what just happened (e.g., "You named it quickly. Let's stay here a moment.") — currently static
- Medium term: build a `session_depth_signal` that detects long-form answers and can insert a "Stay here" scene before advancing
- Longer term: the adaptive scene count itself becomes a deftness metric

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
