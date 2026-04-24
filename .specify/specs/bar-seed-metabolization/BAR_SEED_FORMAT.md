# BAR Seed Format — Cross-Protocol Spec

## ID
`BSF` | Priority 2.03a

## Status
Draft — informs both The Work (Lite) and 321-Lite BAR dispatch

---

## Purpose

Define what a **BAR seed** is as a data artifact — the minimum fields required for bars-engine to plant, route, and cultivate a seed that came from any personal ops practice (The Work, 321, CYOA, etc.).

A BAR seed is **not a full BAR**. It is a **pre-planted draft** that the player reviews and confirms before it enters the game's circulation. It can be composted before planting, revised, or abandoned.

---

## What leaves the session (privacy spectrum)

```
ZONE A: Session-private     — never enters bars-engine
ZONE B: BAR seed (review)  — player reviews before planting
ZONE C: Planted BAR        — in-game circulation
```

### ZONE A — Session-private (never leaves the interface)
- Turnarounds (The Work)
- Mask name + shape + dialogue (321)
- Full Q&A narrative
- Q3 body response
- Q4 narrative

### ZONE B — BAR seed (shown to player for review before planting)
- **Belief** (player-facing, becomes BAR body)
- **Distilled stuckness signal** — 1-line summary of what blocks the game
- **Emotional alchemy tags** — dissatisfied channel + desired channel
- **Allyship domain** — Wake/Clean/Grow/Show (user confirms or selects)
- **Source protocol** — `'the-work'` | `'321'` | `'cyoa'` | etc.
- **Stuckness category** — future taxonomy; initially blank

### ZONE C — Planted BAR (after player confirms seed)
- All ZONE B fields, now persisted as CustomBar
- Player may edit title/body before confirming

---

## BAR Seed Fields

```typescript
type BarSeed = {
  // Identity
  id: string               // generated client-side; stable across edits
  source: 'the-work' | '321' | 'cyoa' | 'manual'
  
  // What the BAR is about (PLAYER-FACING — shown in review)
  belief: string           // The Work: the limiting belief; 321: the mask name + charge
  body: string            // Player-editable; default = belief
  
  // Emotional alchemy (deterministic + user confirm)
  dissatisfiedChannel: WuxingChannel   // Metal|Fire|Wood|Water|Earth
  desiredChannel: WuxingChannel
  alchemyMove: string     // e.g. "Fear → Peace" or "Sadness → Ease"
  
  // Game routing
  allyshipDomain: AlignedAction        // Wake Up|Clean Up|Grow Up|Show Up
  allyshipDomainConfirmed: boolean     // false = suggestion pending user confirm
  
  // Stuckness signal (future taxonomy)
  stucknessCategory?: string          // future: blank for now
  stucknessSignal: string              // 1-line: "What this stops" — player-written
  
  // Metadata
  createdAt: ISO timestamp
  practiceDuration?: number           // minutes; for personal ops stats
  dispatchChoice: 'bar-seed' | 'full-321' | 'full-work' | 'journal' | 'close'
}
```

---

## Translation Layer

**Deterministic algorithm → user confirmation → final seed**

### Step 1 — Deterministic (auto-extracted from practice answers)

| Input | Extracted |
|-------|-----------|
| The Work Q3 "how do I react?" keywords | `dissatisfiedChannel` (fear→Metal, anger→Fire, grief→Water, etc.) |
| The Work Q4 / EA desired feeling | `desiredChannel` |
| The Work final aligned action choice | `allyshipDomain` |
| Practice type | `source` |
| "Where are you stuck?" + belief | `stucknessSignal` + `belief` |

### Step 2 — User review screen (ZONE B gate)

Before anything is POSTed, player sees:
- The extracted fields (auto-filled)
- Editable `allyshipDomain` (can change from suggested)
- Editable `body` (can change from belief)
- **Confirm and plant** / **Edit before planting** / **Compost this**

### Step 3 — Plant or compost

**Plant:** POST to bars-engine API → returns `barId` → player sees planted BAR  
**Compost:** Optional release note → session closes, no POST  
**Edit:** Return to practice or edit fields directly  
**Discard:** No note, session closes

---

## UX Principles

1. **Belief is the BAR** — the belief itself is the primary body text. This is intentional: players will know what the BAR was about. Turnarounds and narrative stay private.
2. **Distill, don't dump** — the algorithm extracts signal, not text. The player writes `stucknessSignal` themselves (1-line "what this stops").
3. **Domain is a choice, not a form field** — `allyshipDomain` is auto-suggested and shown as a toggle; player confirms or changes.
4. **Session ends cleanly** — no partial states. Either a BAR is planted, or the session is witnessed and closed with zero residue.

---

## Naming (open question)

The Work (Byron Katie) is the lineage. The game-world container needs a name that:
- Acknowledges the practice
- Lives naturally in bars-engine UI
- Doesn't conflict with `321` or other named rituals

Candidate names:
- **Liberation** — freedom from stuckness
- **The Mirror** — seeing what runs you
- **Inquiry** — what Byron Katie calls her process
- **Witness** — already used as Sage face in 321
- **The Turnaround** — descriptive, but dry

**Decision needed:** What does this practice appear as in the bars-engine nav and UI?

---

## Dependencies

- CustomBar schema (`allyshipDomain`, `emotionalAlchemyTag`, `source`)
- BSM spec (maturity, soil attachment happens after planting)
- SPC/750words (potential prefill input → belief)
- Bars-engine API: `POST /api/bars/from-practice` (consolidated endpoint for both The Work and 321)

---

## Verification Criteria

- [ ] BAR seed shows belief as editable body on review screen
- [ ] `allyshipDomain` auto-suggested and user-confirmable
- [ ] Turnarounds never appear in POST payload
- [ ] Compost path available without forcing note
- [ ] Planted BAR visible in bars-engine vault after successful POST
- [ ] Source field correctly identifies protocol origin
