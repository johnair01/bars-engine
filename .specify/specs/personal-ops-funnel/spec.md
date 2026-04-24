# Personal Ops Funnel — Umbrella Spec

## ID
`POF` | Personal Ops Funnel | Priority 2

---

## Purpose

Define the complete personal ops system for a single practitioner (Wendell, Phase 1) and establish the contracts that allow each component to operate independently while feeding into bars-engine as a unified system.

**This is not a product feature — it is a personal practice operating system.**

---

## The Daily Loop

```
┌─────────────────────────────────────────────────────────────┐
│  MORNING (SPC — 750words)                                   │
│  Write 750 words. Surface what's alive.                     │
│  Private. No system touch.                                   │
│  Output: WritingSession with mood tags + raw text          │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTRACT STUCKNESS                                          │
│  "What's the one thing stopping you from playing full out?" │
│  Single field. Free-form. Player decides what to surface.   │
│  Private until BAR seed dispatched.                         │
│  Output: stuckness signal → routing decision               │
└────────────────┬────────────────────────────────────────────┘
                 ↓
        ┌──────────────────┐
        │  CHOOSE PRACTICE │
        │  Introspection   │  ← 321 (animist parts work)
        │  Inquiry         │  ← The Work (mindfulness)
        │  (player choice) │
        └────────┬─────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  PROCESS (321 or INQ)                                       │
│  Session stored in sessionStorage only until complete.     │
│  Emotional alchemy hook: "How do I react / How do I want    │
│  to feel?" captures EA channel pair → deterministic        │
│  Output: completed session with EA tags + belief leave    │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  TRANSLATION LAYER                                          │
│  Deterministic algorithm extracts game-metabolizable       │
│  content from practice output. User reviews and confirms. │
│  Personal narrative → pattern labels (never raw narrative) │
│  Output: BAR seed (draft review before POST)               │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  BAR SEED DISPATCH                                         │
│  Planted in bars-engine via API. No OAuth — personal       │
│  admin key from Zo secrets (BARS_ENGINE_API_KEY).           │
│  Output: CustomBar in bars-engine with BSM metadata        │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  STEWARDSHIP (BRS)                                          │
│  Dedicated action: tend the planted seed.                 │
│  - Name soil (campaign/thread/holding pen)                  │
│  - Write next action                                        │
│  - Route to LDM guide                                       │
│  - Link to existing quest or create new quest              │
│  - Compost if nothing useful remains                        │
│  Output: seed moves to active state or composts             │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│  QUEST + PLAY                                              │
│  Seed produces quest → player completes → receives BAR     │
│  → new charge surfaces → loop continues                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Inventory

### SPC — 750words Personal Sentiment Capture

**What:** Morning pages writing surface with 750-word goal and daily streak tracking.

**Where it lives:** zo.space or standalone program in Zo.

**What it does:**
- Free writing in a text area, counter showing words written
- 750-word target with visual progress
- Streak tracking (black-hat gamification acceptable)
- Manual mood tag selection from Wuxing vocabulary (5 channels × neutral/satisfied)
- All data private — stored in browser/localStorage only

**What it outputs:**
- `WritingSession` stored locally
- Extracted: mood tags, word count, date, (no narrative leaves session)

**What it does NOT output:** raw writing text to any system

**Status:** Not started — spec in `/specs/personal-ops-funnel/spec.md § SPC` (stub only)

---

### Stuckness Capture

**What:** Single field after SPC: "What's the one thing stopping you from playing full out?"

**Where:** Inline with SPC flow, or standalone on bars-engine homepage.

**Design:**
- One textarea, placeholder: "What's between you and playing full out?"
- Free-form — no taxonomy enforcement yet
- Multiple sessions per day allowed (one stuckness per session)
- Private until dispatched

**Routing:** Player chooses Introspection (321) or Inquiry (The Work) after entering stuckness. No automated routing — player sovereignty.

**Status:** Not started — defined here, spec in SPC or standalone TBD

---

### INQ — Inquiry (The Work)

**What:** Byron Katie-style 4-question practice with emotional alchemy integration.

**Where:** zo.space (fast iteration) or bars-engine `/shadow/inquiry` (production).

**Canonical reference:** Byron Katie's The Work — four questions + turnaround.

**Key hooks from The Work:**
- Q1: "Is it true?" → No = skip to Q4 (who would I be without it)
- Q2: "Can I absolutely know it's true?" → Yes = show Q3
- Q3: "How do I react when I believe that thought?" → **+ EA sub-question: "How do I feel?"**
- Q4: "Who would I be without the thought?"
- Turnaround: 3 ways (self, other, opposite)

**Emotional alchemy integration (added by Wendell):**
- Q3 + 1: "How do I feel when I react this way?" → dissatisfied feeling
- Q3 + 2: "How do I want to feel instead?" → desired feeling
- If both present → deterministic EA channel detection → alchemical move recommendation shown to player

**What leaves the session:**
- Belief (player-facing — this is what the BAR is about)
- EA channel pair (from Q3+1 / Q3+2)
- Alchemical move
- Turnaround excerpts (player-selected)
- Allyship domain suggestion (from EA channel → four moves mapping)

**What stays private (never leaves):**
- Full Q3 text
- Full turnaround text
- Any narrative from the session

**Status:** Spec written at `/specs/inquiry-lite/spec.md` — needs full rewrite to match this spec

---

### 321 — Introspection (Shadow Process)

**What:** Full 17-phase animist parts work — externalize charge, dialogue with presence, merge with awareness.

**Where:** bars-engine `/shadow/321` (already built).

**Output that feeds this funnel:**
- Belief
- EA channel pair (from alchemy step)
- Alchemical move
- Shadow name (can become daemon)
- Turnaround excerpts
- Allyship domain

**Key distinction from INQ:**
- Produces daemon-capable output (shadow name → daemon seed)
- No Byron Katie-style Q1/Q2 routing
- 6 NPC guides
- Deep Cavern optional path

---

### Translation Layer

**Purpose:** Convert practice output (personal, private) into game-metabolizable data (shared, pattern-based).

**Principle:** Deterministic algorithm first, user confirmation second. The algorithm extracts pattern labels. The user reviews and edits before anything leaves the session.

**Extraction rules (per practice):**

*From INQ:*
- EA channel: keyword matching on Q3+1 / Q3+2 free text
  - fear/anxiety → Metal
  - sadness/grief → Water
  - anger/frustration → Fire
  - overwhelm/fatigue → Earth
  - confusion/stuck → Wood
- Allyship domain: EA channel → four moves mapping (TBD — needs design)
  - e.g., Metal/Fear → Clean Up (uncertainty blocks action)
- Alchemical move: dissatisfied channel → desired channel

*From 321:*
- EA channel: from alchemy step (already structured)
- Allyship domain: aligned action chosen in alchemy phase
- Daemon candidate: shadow name (if player chose Daemon dispatch)

**User review step:** Player sees extracted pattern labels before dispatch. Can edit. Can cancel entirely.

---

### BAR Seed Format

**What gets POSTed to bars-engine:**

```
POST /api/bars/from-practice

{
  source: 'inquiry' | '321',
  belief: string,              // player-facing — what the BAR is about
  emotionalAlchemyTag: string, // e.g., "metal→fire"
  allyshipDomain: string,      // wakeUp | cleanUp | growUp | showUp
  alchemicalMove: string,     // e.g., "guarded → open"
  tags: string[],             // curated: [EA channel, domain, practice]
  turnaroundExcerpts: string[], // 1-3 player-selected lines
  soilRef?: string,           // campaign | thread | holding-pen (BSM)
  maturity: 'captured',        // BSM starts all planted seeds here
  sessionCompletedAt: ISO timestamp,
  playerId: string            // from Zo secrets env
}
```

**What is NOT in the BAR seed:**
- Full session text
- Personal narrative from Q3/Q4
- Detailed turnaround content
- Any data that would make the BAR traceable to specific emotions or events

**Why belief leaves but other content doesn't:** The belief is what makes the BAR meaningful as a social/display artifact. The emotional detail is the player's private material to compost or process.

---

### BRS — BAR Stewardship Flow

**What:** Dedicated action in bars-engine for tending planted BAR seeds.

**Gap:** No dedicated BAR stewardship flow exists today.

**Actions available:**
1. **Name soil** — attach campaign / thread / holding pen reference
2. **Write next action** — what is the smallest next step with this seed?
3. **Route to LDM guide** — Lazy Dungeon Master guide path for the seed
4. **Link to quest** — connect seed to an existing quest or start a new quest wizard
5. **Compost** — release with optional one-sentence witness note

**Entry points:**
- From POD (Personal Ops Dashboard) — active stewardship
- From BAR seed dispatch confirmation — immediate next step
- From bars-engine homepage — "Tend your seeds" CTA when seeds exist

**Output:** CustomBar.metadata updated with BSM fields (soilRef, maturity, releaseNote)

**Status:** Not started — spec stub here, full spec in `/specs/personal-ops-funnel/spec.md § BRS`

---

### BSM — BAR Seed Garden / Nursery UI

**What:** Player-facing view of their planted BAR seeds as explorable terrain.

**Features:**
- List of all planted seeds with maturity state (captured → integrated)
- Soil filter (by campaign/thread/holding pen)
- Compost filter (hide/show composted)
- Random draw (Monster Rancher moment — one seed from the collection)
- Compost action with release note

**Emotional framing:** Curiosity and exploration, not backlog anxiety. "What is one seed willing to be known today?" — not "you have 47 unprocessed items."

**Status:** Spec exists at `/specs/bar-seed-metabolization/spec.md` — BSM Phase 1 data model ready

---

### POD — Personal Ops Dashboard

**What:** Unified view of personal ops practice and BAR seeds.

**Sections:**
- Streak + practice history (SPC + INQ + 321 sessions)
- Planted BAR seeds (from BSM garden)
- Active quests (from bars-engine)
- Compost pile (composted seeds)
- LDM guide funnel (seeds routed to LDM)

**Closes the loop:** 750words → stuckness → practice → BAR seed → stewardship → quest → play → new charge → loop

**Phase 2:** Obsidian sync (delayed — requires Obsidian account setup + Zo integration)

**Status:** Future — spec in `/specs/personal-ops-funnel/spec.md § POD`

---

## Privacy Architecture

```
PRIVATE (never leaves browser/sessionStorage)
─────────────────────────────────────────────
- SPC raw writing text
- INQ/321 full Q3, Q4 responses
- INQ/321 full turnaround text
- Stuckness field input (until dispatch)
- Any session not explicitly dispatched

SEMI-PRIVATE (player reviews before leaving)
─────────────────────────────────────────────
- Extracted EA channel
- Extracted allyship domain
- Alchemical move

PUBLIC (confirmation before POST to bars-engine)
─────────────────────────────────────────────
- Belief (what the BAR is about)
- Turnaround excerpts (1-3 lines, player-selected)
- EA tag (e.g., "metal→fire")
- Tags array

PLANTED (in bars-engine, circulates)
─────────────────────────────────────────────
- CustomBar with all above
- BSM metadata (soilRef, maturity)
- No free-form text from sessions
```

---

## Auth & Access

**Phase 1 (personal):**
- No player login for SPC, INQ, 321 Lite (self-hosted interfaces)
- bars-engine API accessed via `BARS_ENGINE_API_KEY` in Zo secrets
- Key is Wendell's personal admin key
- All data is Wendell's own

**Phase 2 (multiplayer):**
- Standard bars-engine auth required
- Personal ops funnel becomes a player-facing feature
- SPC / INQ sessions become account-scoped
- Stewardship and garden become player dashboards

---

## Build Sequence

| # | Component | Notes |
|---|---|---|
| 1 | SPC (750words) | Standalone zo.space — fastest path to practice |
| 2 | INQ (The Work) | Rewrite inquiry-lite/spec.md to match this spec |
| 3 | Translation Layer | Deterministic algorithm + review step |
| 4 | BAR Seed Dispatch API | `POST /api/bars/from-practice` endpoint |
| 5 | BRS (Stewardship) | New action + UI in bars-engine |
| 6 | BSM (Garden UI) | Phase 1: soil + maturity on existing BARs |
| 7 | POD (Dashboard) | Full loop closure |
| 8 | Obsidian Sync | Phase 2 — delayed |

---

## Open Questions

1. **EA → allyship domain mapping:** What is the deterministic rule for mapping an EA channel (Metal/Fear) to a four-move domain (Wake/Clean/Grow/Show)? Need design + testing.
2. **Stuckness routing:** Should bars-engine homepage have a "Where are you stuck?" entry point that routes to practice choice? Or is SPC the only entry?
3. **SPC + INQ connection:** Should SPC surface stuckness directly into INQ's belief field, or should the player manually enter the stuckness in INQ? Preference: auto-prefill with option to clear.
4. **321 vs INQ naming in UI:** Both are Clean Up moves. How does a player know which to choose? Simple: "Do you want to talk to the part (321) or question the thought (INQ)?"

---

## Dependencies

- SPC → stuckness field (inline)
- stuckness → INQ or 321 (player choice)
- INQ → translation layer → BAR seed dispatch
- 321 → translation layer → BAR seed dispatch
- BAR seed → BRS (stewardship) → BSM (garden)
- BSM → POD (dashboard)

## Specs Referenced

- [inquiry-lite/spec.md](../inquiry-lite/spec.md) — INQ spec (needs rewrite)
- [bar-seed-metabolization/spec.md](../bar-seed-metabolization/spec.md) — BSM spec
- [bar-seed-metabolization/BAR_SEED_FORMAT.md](../bar-seed-metabolization/BAR_SEED_FORMAT.md) — cross-protocol BAR seed definition
- [321-shadow-process/spec.md](../321-shadow-process/spec.md) — 321 (introspection)