# Spec: Lens Integration Refactor

## Purpose

Replace the flat planning flow with a **Lens-driven developmental architecture**.
**Lenses** become first-class temporal objects (navigable in a new **Observatory**),
every BAR can be grown **under a Lens, in a Garden**, and a **queryable provenance
graph** ties BARs ↔ Lenses ↔ Quests ↔ Campaigns ↔ Vibeulons together.

**Problem**: planning is flat and disconnected — there's no temporal scaffolding
(year/quarter/…/today), BARs have no garden home, provenance is implicit
(`rootId`/`parentId` only), and energy (Vibeulons) isn't attributed to *what
grew it*. This refactor makes development legible end to end.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over
AI. Heavily phased; each phase ships independently with a verification quest.

## Governing principle — the core model is agnostic

> **The core model is nation-agnostic and developmental-level-agnostic.**

Nation and **developmental level are not part of the core loop**. They are richer
overlays a player **picks up through play** — developmental level emerges as a
function of **Game Master face**, and nation likewise. Entering the world more
deeply *adds to* the core model; it is never a prerequisite.

Therefore: **`developmentStage` is NOT a BAR field, and there is no new stage
state machine.** One can run Lenses, the Garden, provenance, and Vibeulon
attribution **without** any notion of developmental stage. (The existing
`seedMetabolization.maturity` and the `CultivationCard` UI density "stage" are
*retained as-is* and are **not** elevated into the core model by this spec.)

## Relationship to existing specs (read first)

| Existing | How this relates |
|----------|------------------|
| [core-game-loop-audit](../core-game-loop-audit/spec.md) | The new flow **IS** the audited loop with a Lens/Garden dimension. **H1 (TTV→BAR, shipped)** is the substrate. **H2 (unified BAR view)** is subsumed by the **Garden**. **H3 (3·2·1-from-BAR)**, **H4 (charge-on-BAR)**, **H5 (daemon hub)** remain as loop moves. |
| [tap-the-vein-tier-2](../tap-the-vein-tier-2/spec.md) | **Reshaped.** Daily TTV attaches to today's **Lens**; **TTVE** (♦ economy) must populate the new Vibeulon attribution (lens/channel/growthSource); **TTVS/TTV3** run inside the lens flow. Re-scope Tier 2 after Lens P2/P4 land. |
| [bar-seed-metabolization](../bar-seed-metabolization/spec.md) | **Unchanged and not elevated.** `maturity` stays an optional, play-emergent property — the core loop does not require it. Garden membership is tracked by `gardenId`, **not** by a stage enum. |
| Vibulon model | Gains attribution fields; `mintVibulon` refit. |
| [living-world-experience](../living-world-experience/spec.md) | The **experience/UI layer** over this model — Observatory nav, the five destinations, Garden growth language, and the provenance living-timeline UI. |

## Conceptual Model (WHO / WHAT / WHERE / Energy / Throughput)

| Dimension | Mapping |
|-----------|---------|
| WHO | Player (lenses + gardens are player-scoped; nation/developmental level are emergent overlays, not required) |
| WHAT | BAR (`CustomBar`) grown under a Lens, optionally planted in a Garden |
| **WHERE / time** | **Lens** — Observatory levels (orientation → vision → year → quarter → month → week → today) |
| Energy | Vibeulons, attributed to `lensId` / `emotionalChannel` / `growthSource` |
| Throughput | the player's journey (capture → tune → plant → cultivate → harvest) — **activity, not a stored stage** |

## New section — Observatory

A new app section `/observatory` for **temporal navigation**. Seven levels, each
**independently navigable**:

`orientation · vision · year · quarter · month · week · today`

Each level is backed by one or more **Lens** rows. **Today** is the daily attach
point for Tap the Vein. Routes: `/observatory` (overview) + `/observatory/[level]`.

**Cold-start (decided)**: **auto-seed the calendar lenses** (today / this week /
month / quarter / year) deterministically on first visit — they have canonical
calendar identities, so the hierarchy is never empty. **Vision** and
**orientation** are **player-authored** (gentle prompts, never auto-filled — they
are felt, not generated). The Observatory always has a populated time-scaffold.

### Review cadence (PMA B2)

| Cadence | Where | What happens |
|---------|-------|--------------|
| **Daily** | Tap the Vein close | Carry / compost today's moves (≤5 cap); optional Daily Reflection ([tap-the-vein-tier-2](../tap-the-vein-tier-2/spec.md)) |
| **Weekly** | Observatory `week` + Lenses workshop **review** | Three-beat ritual: Clear → Current → Creative ([lenses-observatory-intake § Weekly reflection](../lenses-observatory-intake/spec.md)) |
| **Year frame** | After yearly workshop lock-in | Review kept vs parked domains — no metric guilt |

**Not in scope:** automated email reminders, streak punishment, PARA folder labels in UI.

## New entity — Lens

```prisma
model Lens {
  id           String   @id @default(cuid())
  playerId     String
  type         String   // orientation | vision | yearly | quarterly | monthly | weekly | daily
  title        String
  description  String?  @db.Text
  parentLensId String?  // hierarchy: vision → year → quarter → month → week → today
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  player       Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  parent       Lens?    @relation("LensHierarchy", fields: [parentLensId], references: [id])
  children     Lens[]   @relation("LensHierarchy")
  bars         CustomBar[]
  @@index([playerId, type])
  @@map("lenses")
}
```

**Migrate existing**: `TapTheVeinDailySession.lensLevel/lensCategory/lensFaceKey`
and `TapTheVeinTask.lens*` become references into `Lens` (the daily lens). These
remain optional — a player who hasn't gone deeper still runs the loop.

## BAR changes

Add to `CustomBar` (all **nullable** — the core loop works without them):
- `lensId String?` — the Lens this BAR was grown under (FK to `Lens`).
- `gardenId String?` — which Garden it's planted in (membership = planted). No
  developmental stage; planted is simply "has a `gardenId`."
- **EA-triad** (the unpacking mechanics — *required for lens/campaign alignment +
  emotional-alchemy moves*; reuse `unpacking-constants` vocab):
  - `experienceIntent String?` — the **desired outcome** the BAR is aimed at.
  - `dissatisfaction String?` — the **current dissatisfaction** (EA "from" state).
  - `satisfaction String?` — the **desired satisfaction** (EA "to" state).
  These are captured at the plant gate (see New flow) and align a BAR up its lens
  and power EA moves (`dissatisfaction → satisfaction` *is* the transformation).
- **Lazy BAR creation (decided)**: TTV tasks become BARs only on a deliberate
  gesture (keep / plant / upgrade), **never on every commit** — avoids Vault
  flooding + task↔BAR drift. Promotion is atomic; composting a task composts its
  BAR (archive, not delete).
- Provenance is **normalized** (see Provenance graph) using existing `parentId`/
  `rootId`/`forkedFromId`/`mergedFromIds` **plus** new `lensId` + `parentQuestId`
  + `campaignRef` (exists). `provenanceChain` is a **derived query**, not a stored
  blob *(open decision — § Open decisions)*.

**No `developmentStage` column.** Garden visibility = "has a `gardenId`." Growth
can be *shown* using the existing `CultivationCard` density channel (UI only), but
that is not a developmental level and is never required.

## New flow

```
Capture → Tune → Choose Lens → Six Questions → Plant → Garden → Cultivate → Harvest
```

These name a **player journey**, not stored stages. Only `lensId` and `gardenId`
are persisted; cultivate/harvest are ordinary loop activity.

| Step | Maps to | New? |
|------|---------|------|
| Capture | `captureBar` (`src/actions/capture-bar.ts`) | exists |
| Tune | `/bars/[id]/tune` (CGLA H6: inline) | exists |
| Choose Lens | pick the Lens to grow under → set `lensId` | **new** |
| Six Questions | the **unpacking mechanics** — captures the **EA triad** (desired outcome + current dissatisfaction + desired satisfaction; reuse `unpacking-constants` vocab). Load-bearing for lens/campaign alignment + EA moves. Present *light*, but the data is required. | **new** |
| Plant | lazily promote the task→BAR (if needed) + set `gardenId` (membership) | **new** |
| Garden | appears in the Garden (has `gardenId`) | extends `/bars/garden` |
| Cultivate | loop moves on the BAR — 3·2·1 (H3), grow-to-quest/daemon, charge (H4) | exists (wire) |
| Harvest | completion → mints attributed Vibeulons | **new** |

## Daily Tap the Vein (lens-attached)

```
Morning Pages → generate candidate actions → choose 5 → auto-create BARs (H1, shipped) → attach provenance to today's Lens
```

Reshape `commitTask` (already creates a BAR via H1) to set the new BAR's
`lensId = today's daily Lens`. The daily Lens is auto-minted on first ritual of
the day (get-or-create, like the daily session). **No stage is set.**

## Provenance graph (queryable)

Every BAR's provenance is a **queryable graph**, not a static field:
- **Parents**: `parentBar` (`parentId`/`rootId`), `parentLens` (`lensId`),
  `parentQuest` (`parentQuestId` — new), `parentCampaign` (`campaignRef`).
- **Children**: BARs whose `parentId` = this BAR.
- **Resulting artifacts**: quests/daemons/scenes grown from it (`sourceBarId`
  already recorded on grown rows).
- **Minted Vibeulons**: `Vibulon.completedBARId` = this BAR (new field).
- **Relationship links**: arbitrary typed edges → new `ProvenanceLink`
  `{ id, fromBarId, toBarId, relation, createdAt }`.
- **API**: `getBarProvenance(barId)` → assembled graph. Read-only; deterministic.

## Garden updates

Garden becomes **first-class and separate** from **Hand / Vault / World**:
- A BAR is **in a Garden when it has a `gardenId`** (planting = membership). No
  stage gate.
- `gardenId` allows **multiple gardens** (personal now; Friendship / Guild /
  Campaign gardens are future hooks). A `Garden` entity:
  `{ id, playerId, kind: 'personal'|'friendship'|'guild'|'campaign', title, … }`.
- Growth may be *shown* via the existing card density channel (UI only).
- Reconcile with the existing `/bars/garden` surface (it becomes the personal Garden view).

## Vibeulon integration

Extend `Vibulon` so every mint references **what grew it** (none of these are
developmental level):
- `completedBARId String?`, `lensId String?`, `campaignId String?`,
  `emotionalChannel String?`, `growthSource String?`.
- `growthSource ∈ { Quest, TapTheVein, 321, Conversation, Harvest, Repair, Friendcraft }`.
- **Minimal/additive (decided)**: fields are **nullable** and populated **only on
  loop/harvest mints** (TTV/harvest path). Do **NOT** refit the other ~7
  `mintVibulon` callers (onboarding, donate, conclave, forge, admin, campaign) —
  they keep `originSource/originId/originTitle` and leave the new fields null.
- **TTVE** (Tier 2) populates these on the loop mint.

## Future hooks (out of scope now; design so they fit)
3·2·1 on a BAR (CGLA H3) · Tap the Vein on a BAR · Lens switching · Friendship
Gardens · Guild Gardens · Campaign Gardens · **nation & developmental-level
overlays acquired through play** (layer onto, never gate, the core model).

## First slice (decided — build this before the full chain)

The thinnest end-to-end loop that proves the feel, to validate before committing
to the whole chain: **daily Lens + lazy player-planted BAR + a minimal Garden
view.** Needs only `Lens` (daily) + `CustomBar.lensId` + `gardenId` + a Garden
list. No Observatory viz, no economy/attribution, no nav overhaul, no provenance
UI. Ship it, feel it, then proceed.

## Phasing

- **P1 — Lens + Observatory skeleton**: `Lens` model + migration; `/observatory`
  with 7 navigable levels; **auto-seed calendar lenses** (today/week/month/quarter/
  year), vision/orientation authored. No BAR changes.
- **P2 — BAR.lensId + EA triad**: add `lensId` + `experienceIntent` +
  `dissatisfaction` + `satisfaction` columns + migration; Daily TTV `commitTask`
  sets `lensId` (no auto-BAR — lazy). **No stage column.**
- **P3 — Garden first-class + Plant flow**: `Garden` entity + `gardenId`;
  Choose-Lens → capture the **EA triad** (light) → **lazily promote task→BAR** +
  set `gardenId`; Garden shows BARs with a `gardenId`.
- **P4 — Provenance graph + Vibeulon attribution**: `ProvenanceLink` +
  `parentQuestId`; `getBarProvenance`; **additive** Vibeulon fields (loop/harvest
  mints only — no broad refit).
- **P5 — Cultivate/Harvest activity + future hooks**: harvest mint; wire
  3·2·1-on-BAR / TTV-on-BAR. (No stored stage transitions.)

## Open decisions (resolve before/within the relevant phase)

1. **provenanceChain** — derived query (recommended) vs a stored JSON snapshot
   field on `CustomBar`. Affects P4.
2. **"Replace the current planning flow"** — what concretely is removed? (the
   `/adventures` planning surfaces? the TTV `lens*` string fields?) Scope of deletion.
3. **Garden multiplicity timing** — ship one personal Garden in P3 (`gardenId`
   nullable) and defer multi-garden to future hooks?

> **Resolved (Six GM panel):** developmental stage is **not** modeled (core stays
> nation/developmental-level agnostic; overlays emerge through play). The plant gate
> **preserves the unpacking mechanics — the EA triad** (desired outcome + current
> dissatisfaction + desired satisfaction), required for lens/campaign alignment +
> EA moves. **Lazy** task→BAR promotion (keep/plant/upgrade), atomic + compost-sync.
> **Calendar lenses auto-seeded**; vision/orientation authored. Vibeulon attribution
> is **additive, loop/harvest-only** (no broad refit). **White-hat gamification is
> embraced** (streaks/progress/celebration; mint on reflection) — see
> [living-world-experience](../living-world-experience/spec.md); only black-hat
> manipulation is avoided.

## Verification
- Per phase: `npm run build` + `npm run check`; a `cert-*` verification quest for
  each user-facing surface (Observatory nav, Plant flow, Garden).
- Provenance: `getBarProvenance` unit test over a seeded graph.
- Loop smoke (L4): capture → tune → choose lens → six questions → plant → see in
  Garden → cultivate (3·2·1/quest) → harvest → Vibeulon minted with lens +
  growthSource attribution. (No developmental stage anywhere in the path.)

## Out of scope (now)
Friendship/Guild/Campaign gardens, lens-switching UX, rich Observatory
visualizations, AI candidate-action generation, and any developmental-level /
nation gating of the core model.
