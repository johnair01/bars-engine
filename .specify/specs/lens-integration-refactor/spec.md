# Spec: Lens Integration Refactor

## Purpose

Replace the flat planning flow with a **Lens-driven developmental architecture**.
**Lenses** become first-class temporal objects (navigable in a new **Observatory**),
every BAR is grown **under a Lens, in a Garden**, through an explicit developmental
arc (capture → … → harvest), and a **queryable provenance graph** ties BARs ↔
Lenses ↔ Quests ↔ Campaigns ↔ Vibeulons together.

**Problem**: planning is flat and disconnected — there's no temporal scaffolding
(year/quarter/…/today), BARs have no developmental home, provenance is implicit
(`rootId`/`parentId` only), and energy (Vibeulons) isn't attributed to *what
grew it*. This refactor makes development legible end to end.

**Practice**: Deftness Development — spec kit first, API-first, deterministic over
AI. Heavily phased; each phase ships independently with a verification quest.

## Relationship to existing specs (read first)

This refactor **extends and reshapes** work already in flight:

| Existing | How this relates |
|----------|------------------|
| [core-game-loop-audit](../core-game-loop-audit/spec.md) | The new flow **IS** the audited loop with a Lens/Garden dimension. **H1 (TTV→BAR, shipped)** is the substrate. **H2 (unified BAR view)** is subsumed by the **Garden**. **H3 (3·2·1-from-BAR)**, **H4 (charge-on-BAR)**, **H5 (daemon hub)** remain as loop moves. |
| [tap-the-vein-tier-2](../tap-the-vein-tier-2/spec.md) | **Reshaped.** Daily TTV now **attaches to today's Lens**. **TTVE** (♦ economy) must populate the new Vibeulon attribution (lens/channel/growthSource). **TTVS/TTV3** still apply but inside the lens flow. Re-scope Tier 2 IDs after P2–P4 here land. |
| [bar-seed-metabolization](../bar-seed-metabolization/spec.md) | The 5-phase `maturity` machine is **superseded by `developmentStage`** (mapping below). |
| Vibulon model | Gains attribution fields; `mintVibulon` refit. |

## Conceptual Model (WHO / WHAT / WHERE / Energy / Throughput)

| Dimension | Mapping |
|-----------|---------|
| WHO | Player (lenses + gardens are player-scoped; future: friendship/guild/campaign gardens) |
| WHAT | BAR (`CustomBar`) grown under a Lens, living in a Garden |
| **WHERE / time** | **Lens** — Observatory levels (orientation → vision → year → quarter → month → week → today) |
| Energy | Vibeulons, attributed to `lensId` / `emotionalChannel` / `growthSource` |
| Throughput | the developmental arc: capture → tune → plant → cultivate → harvest |

## New section — Observatory

A new app section `/observatory` for **temporal navigation**. Seven levels, each
**independently navigable**:

`orientation · vision · year · quarter · month · week · today`

Each level is backed by one or more **Lens** rows. **Today** is the daily attach
point for Tap the Vein. Routes: `/observatory` (overview) + `/observatory/[level]`.

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
  bars         CustomBar[]  // BARs grown under this lens
  @@index([playerId, type])
  @@map("lenses")
}
```

**Migrate existing**: `TapTheVeinDailySession.lensLevel/lensCategory/lensFaceKey`
and `TapTheVeinTask.lens*` become references into `Lens` (the daily lens).

## BAR changes (+ reconciliation)

Add to `CustomBar`:
- `lensId String?` — the Lens this BAR was grown under (FK to `Lens`).
- `gardenId String?` — which Garden it's planted in (see Garden, below).
- `experienceIntent String?` — the felt intent behind the BAR *(open decision: enum vs free text — § Open decisions)*.
- `developmentStage String?` — the canonical arc stage (replaces `maturity`).
- Provenance is **normalized** (see Provenance graph) using existing `parentId`/
  `rootId`/`forkedFromId`/`mergedFromIds` **plus** new `lensId` + `parentQuestId`
  + `campaignRef` (exists). `provenanceChain` is a **derived query**, not a stored
  blob *(open decision — § Open decisions)*.

### developmentStage state machine (supersedes `maturity`)

```
Captured → Tuned → Germinating → Planted → Cultivating → Harvested
                                     │
                              (Composted — terminal exit from any stage)
```

**Legacy mapping** (for migration off `seedMetabolization.maturity`):

| legacy maturity | developmentStage |
|---|---|
| captured | Captured |
| context_named | Tuned |
| elaborated | Germinating |
| (planted in a garden) | Planted |
| shared_or_acted | Cultivating |
| integrated | Harvested |
| (compostedAt set) | Composted |

Garden visibility = `developmentStage ∈ {Planted, Cultivating, Harvested}`.

## New flow

```
Capture → Tune → Choose Lens → Six Questions → Plant → Garden → Cultivate → Harvest
```

| Step | Maps to | New? |
|------|---------|------|
| Capture | `captureBar` (`src/actions/capture-bar.ts`) → stage `Captured` | exists |
| Tune | `/bars/[id]/tune` (CGLA H6: inline) → stage `Tuned` | exists |
| Choose Lens | pick the Lens to grow under → set `lensId` | **new** |
| Six Questions | a planting reflection gate *(open decision: reuse the Six Unpacking Questions?)* | **new** |
| Plant | set `gardenId` + stage `Planted` | **new** |
| Garden | appears in the Garden (Planted+) | extends existing `/bars/garden` |
| Cultivate | loop moves on the BAR — 3·2·1 (H3), grow-to-quest/daemon, charge (H4) → `Cultivating` | exists (wire) |
| Harvest | completion/integration → `Harvested`, mints attributed Vibeulons | **new** |

## Daily Tap the Vein (lens-attached)

```
Morning Pages → generate candidate actions → choose 5 → auto-create BARs (H1, shipped) → attach provenance to today's Lens
```

Reshape `commitTask` (already creates a BAR via H1) to also set the new BAR's
`lensId = today's daily Lens` and `developmentStage = Captured`. The daily Lens is
auto-minted on first ritual of the day (get-or-create, like the daily session).

## Provenance graph (queryable)

Every BAR's provenance is a **queryable graph**, not a static field:
- **Parents**: `parentBar` (`parentId`/`rootId`), `parentLens` (`lensId`),
  `parentQuest` (`parentQuestId` — new), `parentCampaign` (`campaignRef`).
- **Children**: BARs whose `parentId` = this BAR.
- **Resulting artifacts**: quests/daemons/scenes grown from it (`sourceBarId` on
  the grown rows already exists for quests/daemons).
- **Minted Vibeulons**: `Vibulon.completedBARId` = this BAR (new field).
- **Relationship links**: arbitrary typed edges → new `ProvenanceLink` table
  `{ id, fromBarId, toBarId, relation, createdAt }`.
- **API**: `getBarProvenance(barId)` → the assembled graph (parents, children,
  artifacts, vibeulons, links). Read-only; deterministic.

## Garden updates

Garden becomes **first-class and separate** from **Hand / Vault / World**:
- Only **Planted+** BARs appear (by `developmentStage`).
- `gardenId` allows **multiple gardens** (personal now; Friendship / Guild /
  Campaign gardens are future hooks). A `Garden` entity:
  `{ id, playerId, kind: 'personal'|'friendship'|'guild'|'campaign', title, … }`.
- Growth stage is visible per BAR (reuse the `CultivationCard` stage channel).
- Reconcile with the existing `/bars/garden` surface (it becomes the personal Garden view).

## Vibeulon integration

Extend `Vibulon` so every mint references **what grew it**:
- `completedBARId String?`, `lensId String?`, `campaignId String?`,
  `emotionalChannel String?`, `growthSource String?`.
- `growthSource ∈ { Quest, TapTheVein, 321, Conversation, Harvest, Repair, Friendcraft }`.
- Keep `originSource/originId/originTitle` for back-compat (or migrate into the above).
- **Refits TTVE** (Tier 2): the mint-on-complete must populate these.

## Future hooks (out of scope now, design so they fit)
3·2·1 on a BAR (CGLA H3) · Tap the Vein on a BAR · Lens switching · Friendship
Gardens · Guild Gardens · Campaign Gardens.

## Phasing

- **P1 — Lens + Observatory skeleton**: `Lens` model + migration; `/observatory`
  with 7 navigable levels; auto-mint today's daily Lens. No BAR changes yet.
- **P2 — BAR.lensId + developmentStage**: add columns + migration; map legacy
  `maturity` → `developmentStage`; Daily TTV `commitTask` sets `lensId` +
  `developmentStage`.
- **P3 — Garden first-class + Plant flow**: `Garden` entity + `gardenId`;
  Choose-Lens → Six Questions → Plant; Garden shows Planted+ only.
- **P4 — Provenance graph + Vibeulon attribution**: `ProvenanceLink` +
  `parentQuestId`; `getBarProvenance`; Vibeulon fields; refit TTVE mint.
- **P5 — Cultivate/Harvest moves + future hooks**: stage transitions on loop
  moves; Harvest mint; wire 3·2·1/TTV-on-BAR.

## Open decisions (resolve before/within the relevant phase)

1. **developmentStage vs maturity** — supersede (recommended; mapping above) vs
   coexist. Affects P2.
2. **provenanceChain** — derived query (recommended) vs a stored JSON snapshot
   field on `CustomBar` (the source brief listed it as a BAR field). Affects P4.
3. **The "Six Questions"** — define them: reuse the **Six Unpacking Questions**
   (spec-kit ontology) or lens-specific? Affects P3.
4. **experienceIntent** — enum (e.g. emotional-alchemy channels) vs free text? meaning/usage?
5. **"Replace the current planning flow"** — what concretely is removed? (the
   `/adventures` planning surfaces? the TTV `lens*` string fields?) Scope of deletion.
6. **Lens auto-creation** — daily lens auto-minted; are higher levels
   (vision/year/…) player-authored, templated, or auto-seeded?
7. **Garden multiplicity timing** — ship one personal Garden in P3 (`gardenId`
   nullable) and defer multi-garden to future hooks?

## Verification
- Per phase: `npm run build` + `npm run check`; a `cert-*` verification quest for
  each user-facing surface (Observatory nav, Plant flow, Garden).
- Provenance: `getBarProvenance` unit test over a seeded graph.
- Loop smoke (L4): capture → tune → choose lens → six questions → plant → see in
  Garden → cultivate (3·2·1/quest) → harvest → Vibeulon minted with lens +
  growthSource attribution.

## Out of scope (now)
Friendship/Guild/Campaign gardens, lens-switching UX, rich Observatory
visualizations, AI candidate-action generation (deterministic first).
