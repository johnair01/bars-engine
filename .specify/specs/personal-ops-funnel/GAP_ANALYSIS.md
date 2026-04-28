# Personal Ops Funnel — Gap Analysis

**Date:** 2026-04-24
**Status:** Discovery complete — planning ready
**Vision:** 321 shadow process + 750words sentiment capture → BAR seeds → personal ops via LDM guide + Lenses

---

## PART 1: WHAT EXISTS

### 321 Shadow Process
- **UI:** Fully built at `/shadow/321` — `Shadow321Runner.tsx`
  - 17-phase runner: pre_flight → face (1-3) → talk (1-5) → ritual_choice → deep_cavern → be (1-2) → alchemy → alchemy_feeling → artifact dispatch
  - 6 NPC guides (Vorm/architect, Ignis/challenger, Aurelius/regent, Sola/diplomat, Kaelen/shaman, Witness/sage)
  - Feeling chips (Wuxing channels: wood/fire/earth/metal/water × neutral/satisfied)
  - Artifact dispatch: Quest, BAR, Daemon, Fuel, Story, Witness Note
  - Session persistence via `sessionStorage`
- **DB model:** `Shadow321Session` in Prisma (phase snapshots, charge source bar link, outcome, final shadow name, daemon merges)
- **Wiki:** `/wiki/321-shadow-process` landing page with navigation
- **Integration:** Connects to charge capture, quest wizard prefill, daemon awakening, fuel system, CYOA generator

### BAR Seed Metabolization (BSM)
- **Schema:** BSM comment on `CustomBar.metadataJson` — `soilKind`, `contextNote`, `maturity`, `compostedAt`, `releaseNote`
- **Compost ledger:** `CompostLedger` model exists (session-scoped, payload JSON)
- **Strand consult:** Complete in `.specify/specs/bar-seed-metabolization/STRAND_CONSULT.md`
- **NOT built:** No garden/nursery UI, no player-facing metabolize flow

### bars-engine substrate
- Quest system, daemon system, BAR registry, emotional alchemy engine
- Nation/archetype framework (soil candidates)
- Twine/CYOA adventure pipeline
- Personal ops wiki structure (several guide pages)
- Prisma schema with 50+ models, full API layer

### zo.space
- Current routes: `/api/pocket-webhook`, `/api/bars-engine`, `/coach-tracker`, `/six-doors`, `/six-doors-coaches`, etc.
- No 750words clone or 321 UI exists on zo.space

---

## PART 2: WHAT'S MISSING

### 1. 750words Clone (Personal Sentiment Capture)

| Component | Status | Notes |
|---|---|---|
| Writing surface (750-word goal) | **MISSING** | No UI, no word count tracking |
| Daily prompt / free-write mode | **MISSING** | 750words.com has prompts + freeform |
| Streak tracking | **MISSING** | 750words.com gamifies this |
| Sentiment tagging (per-session) | **MISSING** | Needed as input signal for BAR seed generation |
| Private storage | **MISSING** | Needs DB model + API |
| Habit calendar | **MISSING** | Visual streak calendar |
| Historical view | **MISSING** | Browse past entries |

**What it solves:** Low-friction daily sentiment capture. Generates the "charge" that feeds into the 321 process and ultimately produces BAR seeds.

**What it risks breaking:** If it becomes another obligation/streak metric, it recreates the anxiety-driven productivity stack the system is meant to dissolve.

**Decision:** Build custom. A self-hosted clone avoids the $5/month 750words fee and keeps data in bars-engine DB.

**Schema direction:** New `WritingSession` model — `playerId`, `content` (text), `wordCount`, `moodTags[]` (from feeling chip vocabulary), `streakDay`, `createdAt`. No AI analysis at MVP — user tags their own sentiment.

---

### 2. 321 UI Redesign (The Work-inspired)

The current 321 runner is complex and functional, but The Work App shows what a mobile-first, ritualized version looks like:

| Feature | Current 321 | The Work App Reference |
|---|---|---|
| Mobile-first layout | Desktop-optimized | iPhone/Android native feel |
| One-question-per-screen | Multi-question phases | Single belief per screen |
| Progress clarity | SceneCard progress bar | Yellow card + 4 questions |
| Worksheet export | None | Email worksheet PDF |
| Journal history | None | "My Work Journal" with edit |
| Turnarounds | Not applicable (Byron Katie specific) | Core mechanic |
| Continuous vs. session | Session-based | Per-inquiry session |

**What it solves:** The 321 runner has 17 phases. A "Lite" version (1 belief → 4 questions → turnaround → BAR seed) would lower activation energy significantly.

**What it risks breaking:** The deep cavern and full ritual are important. A lite version must not cannibalize depth — it should be a deliberate on-ramp.

**Decision:** Build a parallel "321 Lite" route at `/shadow/321/lite` that covers the minimum viable 321: charge → name → 4 inquiry questions → alchemical transformation → BAR seed dispatch. The existing deep version stays for full work.

---

### 3. BAR Garden / Seed Nursery UI

| Component | Status | Notes |
|---|---|---|
| List view of all BARs | Fragmentary | BAR registry exists but no garden view |
| Soil context attachment | **MISSING** | BSM schema hint exists, no UI |
| Maturity state machine | **MISSING** | Wake → Clean → Grow → Show → Integrate |
| Compost action | **MISSING** | CompostLedger exists but no player-facing flow |
| Monster Rancher draw | **MISSING** | "Random BAR" draw mechanic |
| Bulk operations | **MISSING** | High-volume user need |

**What it solves:** Transforms BAR backlog from anxiety-inducing list into explorable terrain. Compost gives permission to release.

**What it risks breaking:** Shame metrics ("200 unplanted seeds"). Must be opt-in and gentle.

**Decision:** Phase 1 of BSM — build garden list view with soil naming and compost. Feature-flagged.

---

### 4. Personal Ops Dashboard (Lenses + Lazy Dungeon Master Funnel)

| Component | Status | Notes |
|---|---|---|
| Personal ops landing | **MISSING** | No `/personal-ops` route |
| Lenses integration | **MISSING** | No lens-selection UI for filtering BAR seeds |
| Lazy Dungeon Master guide | **MISSING** | The guide exists in wiki, not as an interactive funnel |
| Obsidian sync | **MISSING** | No export of BAR seeds to Obsidian |
| BAR seed → personal ops pipeline | **MISSING** | No formal flow from 321 → BAR → personal ops entry |

**What it solves:** Closes the loop: capture (750words) → process (321) → seed (BAR) → cultivate (personal ops) → integrate (LDM guide/lenses). Without this, BAR seeds are endpoints, not pathways.

**What it risks breaking:** Over-automation of meaning-making. The LDM guide should be consulted, not fed by AI.

**Decision:** Build personal ops dashboard at `/personal-ops` showing: active BAR seeds, 321 session history, compost pile, and a "choose your lens" filter that routes BAR seeds through the LDM framework. Obsidian sync is Phase 2 (requires plugin or manual export).

---

### 5. 321 → BAR Seed → Quest Pipeline (Refinement)

The current artifact dispatch has 5 options at the end of 321. The user wants:

```
750words capture
      ↓
321 shadow process
      ↓
BAR seed (with sentiment charge + emotional alchemy metadata)
      ↓
Stewarded into quest (via LDM guide/lenses)
      ↓
Personal ops knowledge base (Obsidian)
```

**What's missing:** The "steward into quest" step is not a formal UX flow. Currently a player can turn a 321 into a quest, but there's no guidance on how the LDM lenses route a BAR seed into a specific quest type. No Obsidian export path.

---

## PART 3: PRIORITY STACK

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 0 — Signal Capture (foundation)                       │
│  750words clone: writing surface + word count + mood tags   │
│  → Output: Charge entries in DB                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1 — Process (what exists, needs integration)         │
│  321 shadow process (already built)                         │
│  + 321 Lite variant (1 belief, 4 questions, BAR seed)       │
│  → Output: Shadow321Session + BAR seed draft                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2 — Cultivate (new build)                            │
│  BAR Garden/Nursery: soil naming + maturity + compost       │
│  → Output: Metabolized BARs, composted releases             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3 — Integrate (new build)                            │
│  Personal Ops dashboard: lenses + LDM guide + BAR seed list  │
│  Obsidian sync (Phase 3b)                                   │
│  → Output: Personal ops entries from BAR seeds              │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 4: WHAT CAN BE BUILT ON ZO.SPACE vs BARS-ENGINE

| Component | Platform | Rationale |
|---|---|---|
| 750words clone | **zo.space** | Standalone writing tool, no auth needed for MVP, can prototype fast |
| 321 Lite | **zo.space** | Mobile-first, lightweight, shares auth context with bars-engine |
| BAR Garden | **bars-engine** | Needs Prisma DB, player session, existing BAR models |
| Personal Ops Dashboard | **bars-engine** | Full access to quest/daemon/BAR data, player context |
| Obsidian sync | **bars-engine** (cron job or manual export) | Needs bars-engine DB to read |

**Alternative view:** All of this could live in bars-engine as new routes, keeping one system. The 750words clone could be a new `/write` route. The tradeoff is bars-engine's heavier build/deploy cycle vs zo.space's faster iteration.

**Recommendation:** Prototype 750words clone and 321 Lite on zo.space for speed. When the signal capture flow is validated, port into bars-engine as permanent routes. Keep one system.

---

## PART 5: OPEN QUESTIONS

1. **Auth:** Does the 750words clone require bars-engine player auth, or is it write-only (no login until you want to save a BAR seed)?
2. **Sentiment tagging:** Manual (feeling chips from 321 vocabulary) or AI-assisted (transliterate tone analysis)? User said "sentiment" — manual at MVP.
3. **Obsidian:** What does the sync look like — a daily exported JSON, a plugin that reads a webhook, or manual export button?
4. **Streaks:** Does the 750words clone need streak tracking, or is that the anxiety metric we explicitly want to avoid?
5. **321 Lite scope:** Should 321 Lite produce a BAR seed directly, or route through the full 321 session? Direct BAR seed seems right for MVP.

---

*Gap analysis complete. Next step: spec for 750words clone (Phase 0) or 321 Lite (Phase 1 shortcut) — which do you want to build first?*
