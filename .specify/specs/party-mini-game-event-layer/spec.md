# Spec: Party mini-game — event game layer

## Purpose

Define a **lightweight, playable behavioral layer** for real-world events: before, during, and after gathering. It amplifies connection and momentum **without** pretending to be a full game system.

**Taxonomy:** This is a **party mini-game** (also: **event mini-game**) — short-lived, room-behavior lens, optional persistence, **BAR as capture** into the existing vault/compost/quest metabolism. It is **not** a replacement for quest grammar, campaign deck spokes, or full CYOA trees.

**v1 pilot:** Bruised Banana residency — **April 4 (dance)** and **April 5 (scheming)** — implemented in-app in a way that can generalize to other campaigns/events later.

**Design source:** Stakeholder draft (“Invite Bingo → Event Bingo → optional CYOA → optional BAR capture”). Strand consult (bars-agents `strand_run`, backlog) produced initial synthesis BARs; this spec kit is the **canonical** implementation authority.

---

## Principles (non-negotiable)

- **Invitations > instructions** — priming copy feels like an invite, not a syllabus.
- **Behavior > interface** — minimal UI chrome; the room is the game.
- **Momentum > completion** — progress hints are optional; no grind.
- **Optionality > obligation** — no required login for read-only / tap-local state where product allows; see [Auth & privacy](#auth--privacy).
- **Clarity > completeness** — ship thin slices; compost later.

---

## User stories

1. **As a guest**, I can see a **3×3 bingo grid** for tonight’s event (dance or scheming flavor) on my phone, tap squares as I do them, and optionally see how many I’ve checked — without feeling scored or ranked.
2. **As a guest**, I can optionally **add a short note** and/or **tag someone** on a square (deferred if v1 is tap-only).
3. **As a logged-in player**, I can **convert a completed moment** (or the whole card) into a **BAR** that lands in my vault with **provenance** (`source: party_mini_game`, `eventId` / `campaignRef`, mini-game definition id).
4. **As an organizer**, I can surface **invite bingo** copy (pre-event priming) via **event page**, invite BAR, or static block — same taxonomy, optional tracking.
5. **As a campaign steward**, I want **Bruised Banana** Apr 4/5 to use **deterministic, reviewable** copy (markdown or CMS-like config) before any LLM touches tone.
6. **As the product**, we reserve a path for **author-defined mini-games** (JSON or admin config → grid + labels) that emit BAR-shaped payloads for metabolism — **not** hard-coded only to one party.

---

## Scope by phase

### Phase 1 — Static surface

- Render **event-specific** bingo copy in the app (e.g. `/event` block or campaign-scoped route).
- **April 4 — Dance bingo** (3×3) and **April 5 — Scheming bingo** (3×3) as **content**, not yet interactive persistence.
- Mobile-first typography and spacing; **UI Covenant** for any new surfaces ([`UI_COVENANT.md`](../../../UI_COVENANT.md)).

### Phase 2 — Interactive grid (client state)

- **Tap to toggle** square completion; optional **progress** (e.g. `3/9`).
- Persist in **`sessionStorage`** or **anonymous local** preference when logged out; **merge to account** when user logs in (optional v1.1).
- Subtle check animation (CSS); no vibeulon rewards.

### Phase 3 — BAR capture

- **“Metabolize to BAR”** (or gentler label) creates a `CustomBar` with:
  - Title/description from template + optional user line
  - `completionEffects` or dedicated JSON: `{ grammar: 'party-mini-game-v1', miniGameId, eventKey, squaresCompleted: string[], ... }`
  - `campaignRef` when event is tied to Bruised Banana (or `Instance`)
- **Non-goal v1:** full quest assignment flow; vault visibility default **private**.

### Phase 4 — Optional CYOA / playstyle (defer)

**Stub (no implementation until Phase 1–3 stable):** After an event or on “wrap-up,” offer a **2–3 node CYOA** (or single choice) that maps to a **playstyle label** (e.g. Connector, Instigator) stored as copy on a BAR or profile-adjacent field — **no** automatic quest-pack routing. Implementation would reuse existing Twine/adventure patterns where possible; **no new tables** until product commits.

- Short branch → **playstyle label** (Connector, Instigator, etc.) — **non-binding**, copy-only for v1.
- **Playstyle → quest pack** mapping is explicitly **out of scope** until Phase 4+ (see stakeholder “future extension”).

---

## Data model (conceptual)

```ts
// Config (file, DB row, or admin JSON — implementation choice in plan)
type PartyMiniGameDefinition = {
  id: string                    // e.g. 'bb-apr4-dance-bingo'
  campaignRef?: string | null   // e.g. 'bruised-banana'
  eventKey?: string | null      // links to EventArtifact slug or block id
  title: string
  grid: { rows: 3; cols: 3 }
  squares: Array<{ id: string; text: string }>
  flavor: 'invite' | 'live_dance' | 'live_scheming' | string
}

type PartyMiniGameCompletion = {
  miniGameId: string
  squareIds: string[]
  optionalNote?: string
  taggedPlayerIds?: string[]    // future
  completedAt: string           // ISO
}

// BAR provenance (stored in completionEffects or parallel JSON field)
type PartyMiniGameBarStamp = {
  grammar: 'party-mini-game-v1'
  miniGameId: string
  eventKey?: string
  campaignRef?: string
  squareIds: string[]
}
```

Prisma changes are **optional for Phase 1–2** (content in markdown/TS const). Introduce tables only when multi-tenant authoring or analytics require it (see `plan.md`).

---

## Auth & privacy

- **Phase 1–2:** Prefer **no login** for viewing + local toggle; align with Portland-facing **non-AI-first** posture (no model calls for core grid).
- **Phase 3:** BAR creation requires **authenticated** player (existing `CustomBar` rules + vault caps).
- Do **not** require account to **enjoy the event**; BAR is an **opt-in metabolize** step.

---

## Cross-links

- **Event / campaign:** [`event-campaign-engine`](../event-campaign-engine/spec.md) (GH) — `EventArtifact`, `/event` patterns, BB residency ops.
- **Vault:** [`vault-page-experience`](../vault-page-experience/spec.md) (VPE) — caps, compost, hand IA.
- **Campaign hub / spoke:** [`campaign-hub-spoke-landing-architecture`](../campaign-hub-spoke-landing-architecture/spec.md) (CHS) — emotional/alchemy tone; do not duplicate spoke CYOA here.
- **Strand / agents:** [`strand-system-bars`](../strand-system-bars/spec.md) — optional backlog consult; not runtime dependency for players.

---

## Explicit non-goals

- Scoring ladders, leaderboards, or **vibeulon** payouts for bingo.
- Complex quest trees or **required** onboarding before the event page.
- Replacing Partiful / external RSVP; this layer **complements** IRL invites.

---

## Success criteria

- People interact and **introduce** more than baseline; a **few honest BARs** appear from optional capture.
- Organizers can **update copy** without a deploy war (within reason — file-based OK for v1).
- The layer feels **invisible** (“great event”), not “I used a system.”

---

## Acceptance criteria (v1 pilot shipped)

- [x] Apr 4 and Apr 5 **distinct** 3×3 grids are visible on the agreed route (see `plan.md`).
- [x] Mobile layout: readable, tappable targets, no horizontal scroll on common phones.
- [x] Phase 2: toggles persist for the session (and document behavior when logged out).
- [x] Phase 3: logged-in user can create a **private BAR** per square with **party-mini-game-v1** stamp (`completionEffects`), including **in-game player** or **guest name**.
- [x] `npm run check` passes after implementation (`npm run build` subject to local `.next` env).
- [x] Spec kit `tasks.md` checked through the shipped phase.

---

## Appendix — Strand provenance (optional)

Initial `strand_run` (backlog) for this theme produced:

- Strand BAR id: `au5txxll3lpkggkgweiix0ge`
- Architect output BAR id: `zlk3zmcnqg6cl3jiupt4rbi0`

Treat as **historical note** only; **this spec** supersedes for requirements.
