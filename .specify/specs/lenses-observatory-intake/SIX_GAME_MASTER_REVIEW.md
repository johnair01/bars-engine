# Six Game Master Review: Lenses Goal-Setting Onboarding

## Verdict

The Lenses flow is ready to move toward implementation if we keep the authored workshop loop as the center:

```text
vague movement -> free-write -> options -> keep -> descend -> Tap the Vein -> explicit BAR planting
```

The main implementation risk is not the UI. It is preserving the emotional contract while adding structure. If Lenses becomes a productivity planner, it fails. If it becomes a mystical mood board without lineage into Tap the Vein and BARs, it also fails.

## Shaman Review

**Protects:** threshold, mystery, initiation, contact with what is not yet fully known.

**What works:**
- Starting with vague movement honors the threshold before goals.
- The 10-minute free-write gives desire room before metrics.
- The Plant-a-BAR confirmation can feel like a small ritual instead of a database action.

**Risks:**
- Superpower prompts could over-explain the mystery and flatten the player into a type.
- The descent could become too mechanical if every step is framed as planning.

**Implementation guidance:**
- Keep the first movement soft: "What are you moving toward?" before "What is your goal?"
- Let dream notes remain messy and revisitable.
- Use ritual language sparingly at transitions: beginning Lenses, locking year frame, planting BAR.

## Challenger Review

**Protects:** testing, confrontation, sharpening, courage.

**What works:**
- The keep phase forces useful narrowing.
- Explicit BAR planting asks, "Is this worth growing?"
- The five-action cap in Tap the Vein prevents avoidance-by-capturing-everything.

**Risks:**
- Too much softness can let players drift without choosing.
- Parking could become a disguised avoidance path if there is no gentle accountability.

**Implementation guidance:**
- Make the keep step real: max 5 means max 5.
- Use brave but non-shaming copy: "Narrowing is focus, not loss."
- When a player parks a domain, ask for a lightweight reason or revisit date, not a guilt prompt.

## Regent Review

**Protects:** authority, coherence, law, stewardship of order.

**What works:**
- Year -> Quarter -> Month -> Week -> Today gives the system a legitimate spine.
- Parent-child lineage prevents loose task buckets.
- Explicit BAR planting protects the BAR economy from task spam.

**Risks:**
- If every kept goal must descend immediately, the system may overburden players.
- If parked/skipped states are underspecified, reporting and future editing will get muddy.

**Implementation guidance:**
- Define statuses clearly: `draft`, `active`, `parked`, `skipped`, `complete`.
- Preserve lineage on every child goal/task/BAR.
- Use a parent goal picker and progress indicator for descent across all active goals.

## Architect Review

**Protects:** structure, pattern recognition, system design, logic.

**What works:**
- The reusable workshop engine is the right abstraction.
- `LensGoal` plus `LensWorkshopDraft` is the right data split: locked goals vs messy authoring material.
- Tap the Vein resonance can be modeled as task-to-goal attachment without changing daily capture.

**Risks:**
- "Up to five goals per domain" can explode into too many descent threads.
- If the prototype HTML is copied directly, implementation will diverge from app patterns.

**Implementation guidance:**
- Build one reusable workshop component/state machine.
- Store kept order explicitly.
- Treat the Claude HTML as reference only; build in the existing Next.js/component system.
- Consider a first version that visually highlights one primary goal per domain while still retaining up to five kept items.

## Diplomat Review

**Protects:** relationship, alignment, trust, translation.

**What works:**
- The flow makes room for Relationships and Allyship as first-class domains.
- Calendly/guided session support can help players who cannot self-facilitate.
- Tap the Vein resonance frames alignment as noticing, not command.

**Risks:**
- A solo app flow may not serve people who need co-regulation or facilitation.
- If the weekly drop-in offer interrupts the ritual too aggressively, it can feel like a pitch at a vulnerable moment.

**Implementation guidance:**
- Offer guided support at opt-in moments: entry, save-for-later, after year frame, or after multiple parked domains.
- Make the drop-in product adjacent to the Lenses ritual, not embedded inside every step.
- Use trust-building language: "Do this with support" rather than "Need help?"

## Sage Review

**Protects:** spaciousness, witness, perspective, integration.

**What works:**
- The flow gives players a year frame without pretending it is a life sentence.
- Parked goals as wise focus is philosophically correct.
- The system can help a player see continuity from today’s task to a larger life direction.

**Risks:**
- Too much gamified feedback could narrow the contemplative field.
- The app may overstate certainty about what a task "means" if resonance is automated too early.

**Implementation guidance:**
- Keep resonance player-confirmed in v1.
- Avoid completion theater. The win is clarity and authorship, not filling every box.
- Preserve quiet review moments after year frame and after BAR planting.

## Cross-Face Implementation Gates

Before implementation is considered ready, the design must pass these gates:

- **Shaman:** Does the flow begin with desire and threshold before metrics?
- **Challenger:** Does the player actually narrow, choose, and plant intentionally?
- **Regent:** Does every lower-level artifact preserve lineage or a clear parked/maintenance/recovery state?
- **Architect:** Is the authoring loop reusable and persisted cleanly?
- **Diplomat:** Are guided support and drop-in offers opt-in, well-timed, and non-extractive?
- **Sage:** Does the experience leave space, avoid shame, and treat the year frame as living?

## Recommendation

Proceed to implementation with two protective constraints:

1. Build the `LensGoal`/workshop/lineage foundation before polishing every screen.
2. Keep the v1 resonance path player-confirmed. Heuristic suggestions can come later once the authored goal graph exists.

