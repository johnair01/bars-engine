# Spec: Barn Raising — Live Data (Milestone BAR backing)

## Purpose

Make the three-wall Milestone BAR ("the barn") move on **real contributions**. Today
`/event/barn` and the `/pricing` teaser render from a static config (`src/lib/event/barn-raising.ts`)
and checkout hands off to the honor-system donate flow without capturing *what* was bought
or *which wall* it raises. This spec backs the three walls with `CampaignMilestone` rows,
stands up the **July 18 event `Instance`**, and threads product/wall tagging through the
donation flow so each wall fills for real.

**Problem**: The barn UI is built but inert — wall totals are illustrative, the event
Instance doesn't exist, and pre-sale "checkout" doesn't record the SKU or credit Wall 2.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI),
deterministic over AI. No model calls anywhere in this feature.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Three walls as data | **Three `CampaignMilestone` rows** (car / pre-sale / runway), one per wall, each with its own `targetValue`/`currentValue` — cleaner than one-row-plus-segment because the walls differ in kind and cadence (runway is monthly). |
| Wall identity | Add nullable **`wallKey String?`** to `CampaignMilestone` (`'car' \| 'presale' \| 'runway'`), indexed with `campaignRef`. Additive migration; existing rows unaffected. |
| Config ↔ DB | `BARN_WALLS` config stays the **presentational source of truth** (copy, colors, targets); live `currentValue` + in-kind counts are read from the DB and merged into `BarnState`. Targets in config must match the seeded milestone `targetValue`. |
| In-kind "hands & beams" | Aggregate existing **offer BARs (OBT)** for the campaign: `hands` = count of time/host offers, `beams` = count of space offers. No new model. |
| Checkout tagging | The `/event/donate` flow reads `product`/`variant`/`wall` query params (already emitted by `checkoutHref`) and writes them into `Donation.dswMeta` + `MilestoneContribution.note`, crediting the **pre-sale** wall milestone by default. |
| Event Instance | A **seed script** creates the July 18 event-mode `Instance` (`isEventMode: true`, `goalAmountCents` = sum of one-time wall targets, dates, payment links) and the three milestones. Idempotent. No schema change for the Instance itself. |
| Real card processing | **Out of scope** (no Stripe SDK / keys). The Instance's external payment links (`stripeOneTimeUrl`, Venmo, etc.) + honor-system self-report remain the money path. A `Stripe Checkout` upgrade is a separate future spec. |

## Conceptual Model

| Dimension | This feature |
|-----------|--------------|
| **WHO** | Visitor/guest (no account needed to view the barn; account to self-report) + admin/steward (seeds the event) |
| **WHAT** | A contribution (money via DSW, or in-kind offer BAR) that raises a wall |
| **WHERE** | The event `Instance` (`campaignRef` for the barn) — surfaced on `/event`, `/event/barn`, `/pricing` |
| **Energy** | Vibeulons mint on money self-report (existing `createDonationAndPacks`) |
| **Personal throughput** | Clean Up (give) → Grow Up (pledge runway / offer skill) → Show Up (do a task / attend) — the "keep building" redirect after a wall fills |

## API Contracts (API-First)

### `getBarnSnapshot(campaignRef): Promise<BarnSnapshot>` — Server Action / query

Reads the three wall milestones + in-kind offer BAR counts for the event campaign and
returns a `BarnState`-compatible shape the existing `BarnRaisingBar` consumes.

```ts
// src/actions/barn.ts  ('use server' read)
interface BarnSnapshot {
  raisedCents: Record<'car' | 'presale' | 'runway', number>; // currentValue → cents
  hands: number;   // count of time/host offer BARs
  beams: number;   // count of space offer BARs
  milestoneIds: Record<'car' | 'presale' | 'runway', string | null>;
}
function getBarnSnapshot(campaignRef: string): Promise<BarnSnapshot>
```

### `recordContribution` (extend existing) — add wall crediting

Extend `src/actions/campaign-deck.ts::recordContribution` input with optional
`wallKey?: 'car' | 'presale' | 'runway'` and `product?: string`; when present it resolves
the correct wall milestone and records the note. Existing callers unaffected (optional fields).

### Seed: `seed:barn` — `scripts/seed-barn-raising.ts`

Idempotent. Upserts the July 18 event `Instance` and the three `CampaignMilestone` rows
(deterministic ids/`wallKey`), with `targetValue` matching `BARN_WALLS`.

- **Route vs Action**: all surfaces here are **Server Actions** (reads for RSC pages, form
  self-report). No new Route Handler — public reads happen in RSC `/event/barn`.

## User Stories

### P1: The barn moves for real
**As a guest**, I want the `/event/barn` walls to reflect actual contributions, so the
room sees genuine momentum on the 18th.
**Acceptance**: After a money self-report tagged to a wall, that wall's `currentValue`
increases and `/event/barn` (no `?preview`) shows the new total on reload.

### P2: Pre-sale credits the right wall
**As a buyer**, when I click a price on `/pricing` and self-report, my purchase credits the
**pre-sale** wall and the note records the product + variant.
**Acceptance**: `MilestoneContribution.note` contains the product/variant; pre-sale wall total rises.

### P3: Admin can stand up the event
**As a steward**, I can run one seed command to create the July 18 Instance + three walls.
**Acceptance**: `npm run seed:barn` creates/updates the Instance and three milestones idempotently; re-running is a no-op.

## Functional Requirements

### Phase 1: Schema + seed
- **FR1**: Add `wallKey String?` to `CampaignMilestone` (+ `@@index([campaignRef, wallKey])`); migration committed.
- **FR2**: `seed:barn` upserts the event Instance (event mode, goal = $8,500 + $5,000 one-time walls = $13,500; runway tracked separately) and three wall milestones with matching targets.

### Phase 2: Read path
- **FR3**: `getBarnSnapshot(campaignRef)` returns live wall totals + hands/beams counts.
- **FR4**: `/event/barn` (and `/pricing` teaser) read live state via `getBarnSnapshot` when an event Instance exists; fall back to `EMPTY_BARN_STATE` otherwise. `?preview=1` still forces illustrative fill.

### Phase 3: Write path (checkout tagging)
- **FR5**: `/event/donate` reads `product`/`variant`/`wall` query and persists them to `Donation.dswMeta`; on milestone credit, `recordContribution` tags the pre-sale wall + note.
- **FR6**: When a wall reaches `targetValue`, surface the "keep building" redirect (cross-wall → purchases → in-kind → access) — reuse `CampaignMilestoneGuidance` pattern.

## Non-Functional Requirements
- Public `/event/barn` must render even if the DB is unreachable (preview deploys) — try/catch around `getBarnSnapshot`, fall back to empty state.
- No AI calls. No `db push` — migrations only (see Persisted data & Prisma).
- Backward compatible: `wallKey` nullable; existing milestones/contributions untouched.

## Persisted data & Prisma (required)

| Check | Done |
|-------|------|
| Models/fields named: `CampaignMilestone.wallKey String?` + `@@index([campaignRef, wallKey])` | ✅ in Design Decisions |
| `tasks.md` includes `npx prisma migrate dev --name milestone_wall_key`, commit `prisma/migrations/…` + `schema.prisma`, then `db:record-schema-hash` | ✅ see tasks |
| Verification: `npm run db:sync` after edit; `npm run check` | ✅ see tasks |
| Human glance at `migration.sql` (additive — one nullable column + index) | ✅ noted |

## Verification Quest (required — UX feature)
- **ID**: `cert-barn-raising-live-v1`
- **Steps** (Twine passages, one per step; final passage no link → mints reward):
  1. Open `/event/barn` — read the three walls (car / pre-sale / runway).
  2. From `/pricing`, choose a price (e.g. the Founder Bundle) → land on `/event/donate` with the amount pre-filled.
  3. Self-report the contribution.
  4. Return to `/event/barn` — confirm the **pre-sale** wall rose by your amount.
- **Fundraiser frame**: "Confirm the barn-raising bar so the room can watch the send-off fund itself live on the 18th."
- Structure: TwineStory + CustomBar, `isSystem: true`, `visibility: 'public'`, idempotent seed `seed:cert:barn-raising-live`. Reference: `.specify/specs/cyoa-certification-quests/`.

## Dependencies
- `mtgoa-launch-barn-raising-party` (parent epic; milestone-bar-brainstorm.md design)
- DSW (`donation-self-service-wizard`), OBT (`offer-bar-timebank-wizard-modal`), BBMT (milestone throughput)
- Existing: `src/lib/event/barn-raising.ts`, `src/components/event/BarnRaisingBar.tsx`, `src/actions/campaign-deck.ts`, `src/actions/donate.ts`, `src/actions/instance.ts`

## References
- Design: [milestone-bar-brainstorm.md](../mtgoa-launch-barn-raising-party/milestone-bar-brainstorm.md)
- Prisma workflow: [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc)
- Catalog: `src/lib/marketing/products.ts` (`checkoutHref`)
