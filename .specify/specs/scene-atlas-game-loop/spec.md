# Spec: Scene Atlas Game Loop (Personal vs Collective Throughput)

## Purpose

Position **Scene Atlas** inside the **broader BARs game loop** so players understand **what it is for**, **how it relates to Charge**, and how it **differs from I Ching** and **campaign** work. Implement **navigation**, optional **economy limits** (daily deck use), **campaign-scoped I Ching**, a **north star** surface, and **Wii Sports–style demos** — without rewriting Scene Atlas storage ([creator-scene-grid-deck](../creator-scene-grid-deck/spec.md)).

**Practice:** Deftness — one integrated mental model (personal compass vs collective field); Charge as shared fuel; specs stay API-first where persistence is added.

## Product thesis (player-facing)

| Lane | Throughput | Primary surfaces | Tone |
|------|------------|------------------|------|
| **Personal** | Private planning, inner work, “what’s my next step” | **Charge** → BAR → **Scene Atlas** (52-cell map) | Compass, self-authored |
| **Collective** | Shared intention, campaign coordination | **I Ching** cast → quest / thread / instance; campaign board | We interpret together in this field |

- **North star** — A single **promise line** (intention / direction) visible on dashboard or home, optionally sourced from strand/book analysis or `Player` / `storyProgress` fields. **Not** the same as Scene Atlas axes; it **names why** both lanes exist.
- **Demos** — Short, skippable **vertical slices** (Charge capture → one Atlas cell; campaign I Ching → micro-quest) so new players **feel** the loop before depth.

## User stories

### P1: New player

**As a** new player, **I want** the home/dashboard to show **personal vs campaign** paths clearly **so** I know where Scene Atlas fits and where I Ching fits.

**Acceptance:** Documented IA (two lanes + north star + demos); at least one **in-app link** to Scene Atlas from dashboard or Hand (see tasks).

### P2: Returning player (personal)

**As a** player using Scene Atlas for throughput, **I want** a **daily limit** on new card binds (or opens) **so** the habit stays bounded and Charge stays meaningful.

**Acceptance:** Server-enforced cap; clear UI (“N uses left today”); operator-tunable default (env or config).

### P3: Campaign participant

**As a** player in a **campaign / instance**, **I want** I Ching casts to be **attributable to that field** **so** readings feel collective, not only private dashboard divination.

**Acceptance:** Optional `instanceId` / `campaignRef` on cast + persistence of reading context where schema allows; UI copy reflects “for this campaign” when scoped.

### P4: Operator / design

**As** product, **I want** a **north star** string and **demo** entry points **so** strand analysis and onboarding stay aligned with one promise.

**Acceptance:** North star stored or documented; demo route or quest thread type `demo` spec’d; wiki links updated.

## Functional requirements

### FR1 — Information architecture (UI)

- **Dashboard / home:** Three bands — (1) **North star** (headline + optional CTA), (2) **two lanes** — Personal (Charge, Scene Atlas, Hand) vs Collective (active campaign, I Ching entry when in context), (3) **Try it / Demos** row (Wii Sports–style cards).
- **Hand (`/hand`):** Secondary block linking to **Scene Atlas** with one-line copy (personal throughput). **Prompt deck:** same **deck picker + draw / shared hand** UX as on Scene Atlas ([prompt-deck-draw-hand](../prompt-deck-draw-hand/spec.md)) — eligibility = instances the player belongs to that have a `BarDeck`; labels = instance name + **Nation** or **Scene Atlas**.
- **Scene Atlas** remains at `/creator-scene-deck`; no requirement to rename route in v1.

### FR2 — Daily limit (Scene Atlas)

- Enforce **maximum N successful binds** (or “answer card” actions) per player per **UTC day** (or configurable timezone later).
- Check in **`createCustomBar`** (Scene Atlas hidden fields) or **`bindSceneGridCardToExistingBar`** **before** completing binding.
- Store counters: prefer **`Player` JSON field** or **`storyProgress`** slice `sceneAtlasDaily: { date, used }` to avoid migration in v1 — **or** Prisma fields if migration acceptable (tasks decide).

### FR3 — I Ching + campaign (collective)

- Extend **`castIChing` / `castIChingTraditional`** (or wrapper) to accept optional **`instanceId`** / **`campaignRef`** / **`threadId`**.
- Persist reading with context when tables exist; else document **minimum** persistence (e.g. append to `storyProgress.ichingReadings[]` or new table in follow-up).
- **UI:** When launched from campaign board, pass context; show subtitle “Cast for [campaign name].”

### FR4 — North star

- Display field: **`Player.intention`**, **`storyProgress.northStar`**, or dedicated **`northStarLine`** — pick one in implementation; must be **editable** in profile or orientation.
- Optional: admin **content** from strand/book analysis → seed default copy (non-blocking).

### FR5 — Demos

- Route **`/play`**, **`/try`**, or **quest threads** with `threadType: 'demo'` — each demo **&lt; 2 min**, skippable, links to wiki.
- Minimum three demo stubs: (1) Charge capture, (2) Scene Atlas one cell, (3) I Ching → tiny quest (reuse `generateQuestFromReading` where possible).

## Non-goals (this spec)

- Replacing [creator-scene-grid-deck](../creator-scene-grid-deck/spec.md) 2×2 or 52-card storage.
- Full economy rebalance (vibeulon costs for Atlas) — optional follow-up.
- Multiplayer real-time Scene Atlas.

## Dependencies

- [creator-scene-grid-deck](../creator-scene-grid-deck/spec.md) — Scene Atlas implementation.
- [cast-iching.ts](../../../src/actions/cast-iching.ts), [CastingRitual](../../../src/components/CastingRitual.tsx), [DashboardCaster](../../../src/components/DashboardCaster.tsx).
- [game-loop-charge-quest-campaign](../game-loop-charge-quest-campaign/spec.md) — alignment on Charge → quest.
- [dominion-style-bar-decks](../dominion-style-bar-decks/spec.md) — long-term deck/hand; this spec is **loop placement**, not Dominion hand UX.

## Acceptance criteria

- [ ] Spec kit complete (`spec.md`, `plan.md`, `tasks.md`).
- [ ] IA documented; at least **one** prominent link to Scene Atlas (dashboard or Hand).
- [ ] Daily limit **specified and implemented** OR explicitly deferred with task checkbox.
- [ ] Campaign context for I Ching **specified**; minimal implementation or documented stub.
- [ ] North star **display + storage** decision recorded.
- [ ] Demo path **stub** (route or thread) + copy.
- [ ] `npm run build` / `npm run check` pass for touched code.

## Safety & consent

- Scene Atlas remains **private-by-default**; demos must not imply public publish.
- I Ching in campaign: respect instance membership and visibility rules.

## Appendix — Storage (v1)

- **`storyProgress.northStar`** — optional string; dashboard shows an amber **North star** card when set (distinct from **My intention**).
- **`storyProgress.sceneAtlasDaily`** — `{ date: 'YYYY-MM-DD' (UTC), count: number }`; cap from env **`SCENE_ATLAS_DAILY_LIMIT`** (default **15**; **`0`** = unlimited). Enforced in **`createCustomBar`** (new BAR) and **`bindSceneGridCardToExistingBar`** (attach).
- **`storyProgress.ichingReadings`** — optional array (last **50**): `{ at, hexagramId, instanceId?, campaignRef?, threadId?, instanceName? }` — appended by **`persistIChingReadingForPlayer`** (`cast-iching.ts`), used by **`acceptReading`**, **`/iching`** accept, and **`generateGrammaticQuestFromReading`** after a successful publish (dashboard modal + quest modal). **`state.ichingCastContext`** may be set by **`persistHexagramContext`** (traditional / adventure modal flows).

## References

- Wiki: `/wiki/grid-deck`, `/wiki/iching`, `/hand`
- Strand / book analysis (admin): operator-authored north star; not required for v1 code path.
