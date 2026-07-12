# Spec: Inner Garden — Action Economy & Farm Fertility (Pressure 1)

## Purpose

Give the garden a **fertility economy** so that planting/capturing faster than you tend
crowds the farm and drops fertility — pressuring the player to **compost** (and harvest) to
keep the soil alive. This is **Pressure 1** of the two-pressure action economy; its sibling,
**Pressure 2** (stagnation → inferred blocker), lives in
[`inner-garden-blocker-route-hand`](../inner-garden-blocker-route-hand/spec.md). Both teach
one lesson: *act on your seeds — don't just accumulate.*

**Problem.** Nothing currently couples intake (Daily Charge + Tap the Vein + planting) to
throughput (harvest/compost). An over-planter (ADHD register) floods the farm with seeds and
nothing forces tending; the garden should make an untended, overcrowded farm *visibly
unfertile* so composting becomes the obvious, regenerative move — "composting, not necromancy."

**Practice:** Deftness Development — spec kit first, deterministic over AI. Pure lib first;
no renderer, no persistence until a surface needs it.

**Validation posture:** n=1 practitioner-player dogfooding via parallel Claude Design build.

## The governing polarity: **Abundance ↔ Cultivation**

Frame this as a polarity (per `docs/VALUES_AND_POLARITIES.md`), not a rule to optimize.

*Greater purpose:* a **living garden** — generative *and* fruitful.

|                        | **Abundance** (capture / plant freely) | **Cultivation** (tend what you have) |
|------------------------|----------------------------------------|--------------------------------------|
| **Upside (well-held)** | nothing lost; every charge/task captured; generativity | fertility; things actually mature and fruit; focus |
| **Downside (over-leaned)** | overcrowding; fertility collapse; nothing matures; overwhelm | scarcity mindset; missed real charges; under-capture |

*Deeper fear (either extreme):* a **dead garden** — choked (over-Abundance) or barren
(over-Cultivation). **Fertility is the coupling** that makes tending keep pace with capture;
**composting is the regenerative valve.** The two downsides are exactly the two pressures:
over-Abundance → **overcrowding (this spec)**; the stagnation half is the sibling spec.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Fertility unit | A per-**field** (Lens/plot) scalar `fertility` in `0..100` (starts full). Farm-level view = aggregate of fields. |
| Capacity | Each field has a `capacity` = healthy active-seed count. `crowding = activeSeeds / capacity`; `> 1` = overcrowded. |
| What drains fertility | Planting (small cost) and **overcrowding over time** (a daily decay that accelerates as `crowding` rises). Untended crowding is the punisher, not planting per se. |
| What restores fertility | **Composting** (the primary regenerative act — largest gain) and **harvesting** (completing the loop). Both also free capacity. |
| Effect of low fertility | Seeds grow slower and yield lower-quality fruit (biased toward *dissatisfied* altitude). Fertility gates *quality*, never *access* — you can always still act/compost. |
| Compost ≥ harvest gain | Composting restores **at least as much** fertility as harvesting — so when overwhelmed, letting go is rewarded, not penalized (anti-hoarding, and consistent with "no shame"). |
| Polarity, not target | There is no "correct" fertility level; the design goal is *rhythm*. Do not add a fertility score leaderboard or streak. Governed by the Calm↔Progress map. |
| Scope | Pure functions only. No renderer, no cron, no persistence. Seed lifecycle & blocker logic stay in their own libs. |

## Conceptual Model

| Dimension | This spec |
|-----------|-----------|
| **WHO** | The practitioner-player (both the ADHD over-planter and the tidy under-actor) |
| **WHAT** | A field's **fertility** + **capacity**; the crowding pressure; the compost/harvest restore |
| **WHERE** | The garden fields (Lenses/plots) |
| **Energy** | Fertility is the soil energy; planting spends it, composting/harvest renews it |
| **Personal throughput** | Plant (capture) → tend (water/grow) → **harvest or compost** (renew) |

## API Contracts (API-First)

Pure functions (extend a new `src/lib/inner-garden/ontology/fertility.ts`):

```ts
interface FieldFertility {
  capacity: number      // healthy active-seed count for this field
  activeSeeds: number   // planted, not yet harvested/composted
  fertility: number     // 0..100
}

type FertilityAction = 'plant' | 'harvest' | 'compost' | 'tick'   // 'tick' = one day passes

/** crowding ratio (>1 overcrowded). */
function crowding(f: FieldFertility): number
function isOvercrowded(f: FieldFertility): boolean

/** Growth/quality multiplier from fertility (1.0 at full → low when barren). Never 0 (you can always act). */
function growthMultiplier(fertility: number): number

/** Apply an action; pure, clamped to [0,100] fertility and activeSeeds ≥ 0. */
function applyFertilityAction(f: FieldFertility, action: FertilityAction): FieldFertility

/** Suggested regenerative move when overcrowded/barren — "compost N to restore the soil". */
function suggestTending(f: FieldFertility): { compostSuggested: number; reason: string } | null
```

Tuning constants (named, in one place, easy to dogfood-tune):
`PLANT_COST`, `HARVEST_GAIN`, `COMPOST_GAIN (≥ HARVEST_GAIN)`, `DECAY_BASE`,
`DECAY_PER_CROWD` (extra daily decay per unit of crowding over 1).

## User Stories

### P1: The over-planter is pressured to compost
**As an over-capturing player**, when I plant faster than I tend, I want my field to become
visibly crowded and unfertile, so composting becomes the obvious next move.

**Acceptance**: past `capacity`, `isOvercrowded` is true; daily `tick` drains fertility faster
the more overcrowded; `suggestTending` proposes composting N seeds with a soil-restore reason.

### P2: Composting is rewarded, not punished
**As an overwhelmed player**, when I compost seeds I'm not going to act on, I want to *feel the
soil recover*, so letting go is a win.

**Acceptance**: `applyFertilityAction(_, 'compost')` raises fertility by ≥ the harvest gain and
frees capacity; no shame copy; framed as regeneration.

## Functional Requirements

- **FR1 — Fertility state.** A field carries `capacity`, `activeSeeds`, `fertility (0..100)`.
- **FR2 — Crowding.** `crowding = activeSeeds/capacity`; `isOvercrowded` when `> 1`.
- **FR3 — Drain.** `plant` costs a little; `tick` drains `DECAY_BASE + DECAY_PER_CROWD × max(0, crowding−1)`.
- **FR4 — Restore.** `harvest` and `compost` free capacity and raise fertility; `COMPOST_GAIN ≥ HARVEST_GAIN`.
- **FR5 — Quality gate, not access gate.** Low fertility lowers `growthMultiplier` (biasing fruit
  toward dissatisfied) but never blocks acting or composting.
- **FR6 — Tending suggestion.** `suggestTending` returns a compost proposal + regenerative reason
  when overcrowded/barren; `null` otherwise. No streaks, no scores.
- **FR7 — Purity.** All functions pure, clamped, deterministic; tsx-testable.

## Non-Goals

- No renderer / UI (Claude Design).
- No cron / scheduled tick — `tick` is a pure function the caller invokes per day.
- No persistence yet; no fertility leaderboard/score (polarity, not target).
- No blocker / stagnation logic (that's the sibling spec).

## Verification

- **Overcrowding drains faster:** two fields, one at `crowding 2` and one at `1`; after one
  `tick` the overcrowded field lost more fertility.
- **Compost regenerates ≥ harvest:** from the same state, `compost` yields fertility ≥ `harvest`,
  and both decrement `activeSeeds`.
- **Access never gated:** at `fertility 0`, `growthMultiplier > 0` and `compost` still applies.
- **Suggestion:** `suggestTending` proposes composting when overcrowded; `null` when healthy.
- **Determinism / clamping:** fertility stays in `[0,100]`, `activeSeeds ≥ 0`.
- **n=1 dogfood:** the practitioner over-plants for a few days and confirms the crowding→compost
  pressure *feels* like a nudge, not a punishment.

## Related

- Sibling (Pressure 2): [`inner-garden-blocker-route-hand`](../inner-garden-blocker-route-hand/spec.md).
- Bounded-inventory precedent: `.specify/specs/hand-vault-bounded-inventory/`, `src/lib/vault-limits.ts`, `VAULT_STALE_DAYS`.
- Compost mechanics: `runVaultCompost` + `CompostLedger`; `updateTaskStatus('composted')`.
- Governing polarity: `docs/VALUES_AND_POLARITIES.md`.
- Maturation loop (fruit fates incl. compost): `docs/handoffs/2026-07-12-inner-garden-maturation-ontology.md`.
</content>
