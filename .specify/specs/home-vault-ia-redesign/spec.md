# Spec: Home / Vault IA Redesign — Capture-First, Pokémon Rules

## Purpose

Redesign the home (`/`) and Hand/Vault information architecture so that **capturing an idea and metabolizing it is as fast as possible**. Adopt **Pokémon-style inventory rules**: a BAR is created into a bounded **Hand** or an unbounded **Vault**, the player chooses at capture time, and a full Hand forces a deposit. The homepage becomes the **active loop** (capture + daily charge + ambient Hand), not a dashboard. A BAR's **home location follows its maturity**.

**Problem**: Today `/` is a dashboard and `/hand` is *titled "Vault"*; Hand, inventory, and vault are the same `CustomBar` query, so there is no felt difference between what you play with and deep storage. The capture form is heavy and not mobile-ergonomic.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

See companion: [DESIGN_BRIEF.md](./DESIGN_BRIEF.md).

## Design Decisions

| Topic | Decision |
|-------|----------|
| Inventory ontology | **Bounded Hand (6 slots) + unbounded Vault.** Per [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md). This kit is the **IA/home layer** on top of that model. |
| Capture destination (Pokémon rule) | At creation, the player **chooses Hand or Vault**. Default destination is **Vault** (zero-friction, never blocks capture). Choosing Hand with a full Hand triggers the **overflow modal**: move one card from Hand → Vault to make room. |
| Capture friction | **Capture now, contextualize later.** A new BAR needs only minimal content to be saved as `captured`. `context_named`/`elaborated` happen as follow-up moves, never as a blocking form. |
| Daily charge target | The **daily charge operates on the Hand.** It can mint a new `captured` BAR *or* **advance/elaborate a BAR already in the Hand**. To have the daily charge elaborate a Vault BAR, the player must first **promote it Vault → Hand**. Guarantees ≥1 BAR/day. |
| Location follows maturity | `captured` → Hand or Vault (player's capture choice) · `context_named`/`elaborated` (planted) → Garden · `shared_or_acted` → Hand (playable) · `integrated` → Quests/Adventures. |
| Navigation | Cleaned **top nav is the single primary shell** (Now · Garden · Hand · Play · Events). The **OS map** is the spatial world surface *inside Play*, not a competing shell. |
| Rename `/hand` | Route/title/concept must agree: the page you play from is the **Hand**; the **Vault** is overflow reachable from it. Delegated to [`hand-vault-rename`](../hand-vault-rename/spec.md). |
| Form factor | **Mobile-first.** Capture-on-the-fly is the primary use; design the capture affordance and "Now" for thumb reach first. |
| Fifth move | Make room for **Open Up** (Wake · **Open** · Clean · Grow · Show). `WaveStage` is still 4 in code — extension is a flagged follow-on (see Non-Functional). |

## Conceptual Model

```
HOME ("Now")  — the active loop, mobile-first
  ├── CAPTURE (dominant, always-on)  → new BAR (captured)
  │        └── choose destination: [Add to Hand] or [Send to Vault (default)]
  │                 └── Hand full → OVERFLOW MODAL (deposit one Hand BAR → Vault)
  ├── DAILY CHARGE (guarantees ≥1 BAR/day)
  │        └── targets the HAND: mint new captured BAR, or advance a Hand BAR's maturity
  └── HAND GLANCE (ambient): X / 6 slots, each with its ONE next move

Maturity → location:
  captured ─────────────► Hand or Vault (capture choice)
  context_named ─┐
  elaborated ────┴──────► Garden (planted; soil = campaign | thread | holding_pen)
  shared_or_acted ──────► Hand (playable)
  integrated ───────────► Quests / Adventures
```

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player |
| **WHAT** | BARs (CustomBar) moving through maturity; the player's bounded Hand + unbounded Vault |
| **WHERE** | Home ("Now"), Garden, Hand, Vault, Play (spatial/OS map) |
| **Energy** | Capture velocity + daily charge keep vibeulon-generating throughput flowing |
| **Personal throughput** | Capture → (daily charge) → tend in Hand → plant in Garden → graduate to Quests; the 5 moves are what the player DOES with Hand BARs |

## API Contracts (API-First)

> Builds on the Server Actions in [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md) (`getPlayerHand`, `addBarToHand`, `resolveOverflow`, `promoteVaultBarToHand`, …). New/extended contracts below. All are **Server Actions** (`'use server'`, form/React `useTransition`) returning `{ success, error?, data? }`-shaped results — no external/webhook consumer.

### `captureBar` (extended)

Create a BAR and route it to a chosen destination in one call.

```ts
type CaptureDestination = 'hand' | 'vault'

action captureBar(input: {
  content: string            // minimal; may be a transcript/voice note ref
  title?: string             // optional — derived if absent
  destination?: CaptureDestination   // default 'vault'
}): Promise<
  | { success: true; barId: string; placedIn: 'hand'; slot: HandSlot }
  | { success: true; barId: string; placedIn: 'vault' }
  | { success: false; overflow: OverflowContext; barId: string }  // requested hand but full
  | { error: string }
>
```

- On `destination: 'hand'` with a full Hand → returns `overflow`; the BAR is created and parked in the Vault until the player resolves via `resolveOverflow` (existing action).
- New BAR maturity = `captured`. No required contextualization fields.

### `getTodayChargeTargets`

Drive the daily-charge picker: what can today's charge act on.

```ts
action getTodayChargeTargets(): Promise<{
  alreadyDoneToday: boolean
  handBars: Array<{ barId: string; title: string; maturity: MaturityPhase }>  // advanceable
} | { error: string }>
```

### `applyDailyCharge`

Spend today's charge to mint or advance.

```ts
action applyDailyCharge(input:
  | { mode: 'mint'; content: string; destination?: CaptureDestination }
  | { mode: 'advance'; barId: string }   // barId MUST be in the Hand
): Promise<
  | { success: true; barId: string; maturity: MaturityPhase }
  | { success: false; reason: 'already-done-today' | 'bar-not-in-hand' }
  | { error: string }
>
```

- `mode: 'advance'` rejects with `bar-not-in-hand` if the BAR is Vault-only — the UI must prompt the player to promote it first (existing `promoteVaultBarToHand`).

## User Stories

### P0 — Capture-First Home

**HV-IA-1**: As a player on `/` (mobile), I see a dominant always-on capture affordance; I can drop a seed in one action with no required fields, so capture is instant.

**HV-IA-2**: After capturing, I choose **Add to Hand** or **Send to Vault** (Vault is the default if I do nothing). Capture is never blocked.

**HV-IA-3**: If I choose Add to Hand and my Hand is full, I get the overflow modal and pick one Hand BAR to deposit to the Vault.

### P0 — Daily Charge on the Hand

**HV-IA-4**: As a player, the daily charge lets me either mint a fresh BAR or **advance a BAR already in my Hand**, guaranteeing ≥1 BAR of progress per day.

**HV-IA-5**: If I want the daily charge to elaborate a Vault BAR, the UI tells me to pull it into my Hand first, then advance it.

### P1 — Ambient Hand + Maturity Home

**HV-IA-6**: On `/`, I see my Hand as `X / 6` with each BAR's single next move, so I always know what I'm holding without leaving Now.

**HV-IA-7**: As a BAR matures it moves to its home (captured→Hand/Vault, planted→Garden, ready→Hand, integrated→Quests), so location tells me its state.

### P1 — Clean Navigation

**HV-IA-8**: The top nav reads Now · Garden · Hand · Play · Events; "Vault" is no longer a top-level mislabel — it's overflow reachable from the Hand.

### Verification quest

**HV-IA-9**: A certification quest walks a tester through capture → choose Hand → overflow → daily-charge-advance, framed toward the Bruised Banana Fundraiser (preparing fast capture for party guests).

## Functional Requirements

### Phase 1 — Capture-First Home ("Now")

- **FR1**: New `/` ("Now") layout, mobile-first: capture affordance dominant; Daily Charge ritual; ambient Hand strip. Replace the dashboard-first layout in `src/app/page.tsx`.
- **FR2**: `captureBar` server action with `destination` and overflow handling (contract above). Default destination `vault`.
- **FR3**: Capture UI offers Add-to-Hand / Send-to-Vault; wires the existing `OverflowModal` when Hand is full.

### Phase 2 — Daily Charge on the Hand

- **FR4**: `getTodayChargeTargets` + `applyDailyCharge` (contracts above). `advance` restricted to Hand BARs.
- **FR5**: Daily Charge UI: choose **mint** or **advance a Hand BAR**; if a Vault BAR is wanted, prompt to promote first (reuse `promoteVaultBarToHand`).

### Phase 3 — Maturity-Home IA + Nav

- **FR6**: Route BARs to their home surface by maturity phase (Garden for planted, Quests for integrated). Garden glance + Hand glance on `/`.
- **FR7**: Cleaned top nav (Now · Garden · Hand · Play · Events) in `src/components/NavBar.tsx`; depends on `hand-vault-rename`.

### Phase 4 — Verification

- **FR8**: Implement certification quest `cert-home-vault-ia-v1` (Twine + seed) per Verification Quest section.

## Non-Functional Requirements

- **Mobile-first**: capture + Now usable one-thumb; no horizontal scroll at 360px.
- **Graceful without AI**: capture, destination choice, daily charge, and tending all work deterministically; AI only accelerates contextualization (respect the community AI-allergy).
- **Backward compatibility**: existing `getTodayCharge`/`getTodayCheckIn` flows remain until "Now" supersedes them; no data migration beyond the Hand migration owned by `hand-vault-bounded-inventory`.
- **Fifth move (flagged, separate slice)**: extending `WaveStage` from 4→5 (`Open`) ripples through `src/lib/quest-grammar/types.ts` + `move-engine.ts`; out of scope here but the "Now" and Garden UIs must not hardcode exactly four moves.

## Persisted data & Prisma

This kit adds **no new Prisma models** of its own — the `HandSlot` model and Hand migration are owned by [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md) and are a **prerequisite**. The daily-charge "done today" / target state reuses existing charge/check-in persistence (`getTodayCharge`, `getTodayCheckIn`).

| Check | Done |
|-------|------|
| New Prisma models named here | none (HandSlot is a dependency, not new here) |
| `tasks.md` migration task | only if HandSlot not yet shipped → defer to dependency spec |
| Verification: `npm run check` after wiring | yes (tasks.md) |

## Verification Quest (required)

- **ID**: `cert-home-vault-ia-v1`
- **Steps** (one Twine passage each; final passage has no link → completion mints reward):
  1. Open `/` and capture a new BAR with one action.
  2. Choose **Add to Hand**; confirm it appears in the Hand glance (`X / 6`).
  3. Fill the Hand, capture again to Hand, resolve the **overflow modal** (deposit one to Vault).
  4. Use the **Daily Charge** to **advance** a Hand BAR; confirm its maturity advanced.
  5. Try to advance a Vault BAR; confirm the prompt to promote it first.
- **Narrative**: framed as preparing fast capture so guests can drop ideas at the Bruised Banana Fundraiser party.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/), [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Dependencies

- [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md) — **prerequisite** (HandSlot model + base Hand actions + OverflowModal).
- [`hand-vault-rename`](../hand-vault-rename/spec.md) — `/hand` route/title/concept alignment.
- [`bar-seed-metabolization`](../bar-seed-metabolization/spec.md) — maturity phases.
- [`world-portal-save-state`](../world-portal-save-state/spec.md) — Hand persistence across leaving play.
- [`narrative-os-map-v0`](../narrative-os-map-v0/spec.md) — OS map as the in-Play spatial surface.

## References

- `src/app/page.tsx` (home), `src/components/NavBar.tsx` (top nav)
- `src/actions/charge-capture.ts` (`getTodayCharge`), `src/actions/alchemy.ts` (`getTodayCheckIn`)
- `src/components/charge-capture/ChargeCaptureForm.tsx`, `src/components/dashboard/DailyCheckInQuest.tsx`
- `src/lib/bar-seed-metabolization/types.ts` (`MATURITY_PHASES`, `SOIL_KINDS`)
- Prisma workflow: [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc)
