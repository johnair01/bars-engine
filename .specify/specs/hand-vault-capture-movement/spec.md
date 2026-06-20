# Spec: Hand/Vault — Capture Routing + Bidirectional Movement

> Fixes GitHub issue #132 — "Hand stays unpopulated: BAR capture doesn't save to Hand, no Vault↔Hand movement."

## Purpose

Make the **Hand** actually fill up and let BARs move freely between **Hand** and **Vault**. Today the dominant capture surface (the Seed Capture Whiteboard at `/bars/capture`) always lands a new BAR in the Vault, and there is no UI anywhere to move an existing BAR between Hand and Vault. The bounded-inventory model and its server actions already exist and are correct — this kit finishes the wiring so the player-facing flow matches the design.

**Problem**: The `HandSlot` model and the full Hand action layer (`addBarToHand`, `promoteVaultBarToHand`, `depositHandBarToVault`, `resolveOverflow`) shipped, but:
1. `captureBarFromCanvas` (the primary capture path) never calls into the Hand — every canvas capture goes to the Vault.
2. `SimpleCaptureForm` hardcodes `destination: 'vault'`.
3. No surface invokes `promoteVaultBarToHand` / `depositHandBarToVault`, so once a BAR is in the Vault there is no in-game path to pull it into the Hand (or send it back). The Hand glance's empty slot links to `/bars/create` instead.

The result: the Hand is perpetually empty, exactly as reported.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. This kit adds **no new Prisma models**; it reuses the existing `HandSlot` join table.

> Reviewed by the Six GM Faces — see [SIX_FACE_ANALYSIS.md](./SIX_FACE_ANALYSIS.md). Both product forks now decided: **Fork A** = silent Vault fallback on whiteboard when Hand full; **Fork B** = movement toggle restricted to non-planted BARs in v1.

## GM Face Routing

Primary Face: Systems Architect

Secondary Faces:
- Ontologist
- Experience Designer

Review Faces:
- Encounter Designer
- Steward
- Integrator

## Design Decisions

| Topic | Decision |
|-------|----------|
| Schema | **No new field, no new table.** Hand membership stays explicit via the existing `HandSlot` join table (a BAR is "in Hand" iff a `HandSlot` row binds it; "in Vault" iff owned + active + unbound). The issue's suggested `location` column is unnecessary and would duplicate state. |
| Canvas capture destination | **Always to Hand.** The Seed Capture Whiteboard (`/bars/capture`) routes the new BAR into the Hand via `addBarToHandForPlayer`. The whiteboard is the player's "make something now" surface, so its output should be active in hand (cf. default-Vault in [`home-vault-ia-redesign`](../home-vault-ia-redesign/spec.md)). |
| Whiteboard capture when Hand full (**Fork A — decided**) | **Silent Vault fallback + toast** ("Hand full — saved to Vault; hold it later"). No modal on the immersive canvas; capture is never lost and the player resolves later from the Hand glance. (The forced overflow modal stays only on the deliberate `CaptureBox` Hand toggle.) |
| Movement eligibility by maturity (**Fork B — decided**) | **v1 shows the toggle only on non-planted BARs** (`captured` / `shared_or_acted`). Planted Garden seeds (`context_named` / `elaborated`) stay homed in the Garden; Garden↔Hand movement is a separate follow-up. Keeps location ontology clean. |
| Quick-capture (`CaptureBox`, NOW footer) | **Unchanged** — it already offers the Hand/Vault toggle (default Vault) and wires the overflow modal correctly. |
| Capture doctrine (one principle, not two defaults) | **"Quick-keep files (Vault); deliberate make holds (Hand)."** The two capture surfaces default differently *on purpose*: the footer is a fast inbox dump, the whiteboard is a deliberate creation. This **restores** `bar-seed-capture-whiteboard` FR13's original "redirect to `/hand`" intent (Integrator). |
| Movement copy as constants | "Hold in Hand" / "Return to Vault" live in **one shared constant** so [`hand-vault-rename`](../hand-vault-rename/spec.md) can repoint the vocabulary without hunting strings (Ontologist). |
| `SimpleCaptureForm` / `/bars/kept` confirmation | Capture routes to Hand; the "kept" confirmation reads `dest=hand` and links onward (Tune / go to Hand). |
| Vault → Hand / Hand → Vault movement | Bidirectional, reusing existing actions (`promoteVaultBarToHand`, `depositHandBarToVault`). Exposed in **three** places (per product decision): BAR detail page, Vault/feed list rows, and the Hand glance on Now. |
| Movement copy | Vault → Hand = **"Hold in Hand"**. Hand → Vault = **"Return to Vault"** (the gentle "file away"/compost-adjacent action; does not archive the BAR). |
| Hand-full on a move | `promoteVaultBarToHand` returns `{ success: false, reason: 'hand-full' }`. The detail/list UIs show a non-blocking "Hand is full (6/6) — return one first" message; they do **not** force an overflow swap (only capture does that, to keep the explicit-deposit gesture rare). |
| Idempotence | Moving a BAR already in its target location is a no-op success (the actions already handle this). |

## Conceptual Model

```
CAPTURE
  ├── Whiteboard (/bars/capture) ──► HAND  (overflow modal if 6/6)   ← FIXED
  └── Quick keep (CaptureBox)     ──► toggle Hand | Vault (default Vault)  ← already works

MOVEMENT (new UI over existing actions)
  Vault ──"Hold in Hand"──►  Hand      (promoteVaultBarToHand)
  Hand  ──"Return to Vault"─► Vault     (depositHandBarToVault)

  Surfaces:  BAR detail page · Vault/feed list rows · Hand glance empty slot
```

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Player |
| **WHAT** | A `CustomBar` and its Hand/Vault location (a `HandSlot` binding) |
| **WHERE** | `/bars/capture` (whiteboard), `/bars/[id]` (detail), Vault/feed lists, Now home (Hand glance) |
| **Energy** | Captures land active in the Hand → the daily charge and the 5 moves have something to act on; throughput unblocks |
| **Personal throughput** | Capture → held in Hand → tend/advance → Return to Vault when filed; the Hand reflects current active work |

## API Contracts (API-First)

All movement actions **already exist** in `src/actions/hand.ts` and `src/lib/hand-service.ts` and need no signature change. This kit wires capture and the UI to them. The only server-side change is to **capture routing**.

### `captureBarFromCanvas` (extended) — `src/actions/bars.ts`

Route the canvas capture into the Hand instead of leaving it unbound.

```ts
// existing signature unchanged at the call site; result shape extended
function captureBarFromCanvas(payload: CaptureBarFromCanvasInput): Promise<
  | { barId: string; title: string; placedIn: 'hand' }
  | { barId: string; title: string; placedIn: 'vault' } // hand was full → silent fallback (Fork A)
  | { error: string }
>
```

- After creating the BAR (unchanged), call `addBarToHandForPlayer(playerId, bar.id)`.
- On success → `placedIn: 'hand'`.
- When the Hand is full → the BAR simply stays in the Vault (no `HandSlot` bound); return `placedIn: 'vault'`. The whiteboard shows the Vault-fallback toast — **no overflow modal on the canvas** (Fork A). No `OverflowContext` is returned here.
- Keep `revalidatePath('/bars')`, `'/bars/garden'`, `'/hand'`, `'/'`.
- Media upload (photos/voice) in `SeedCaptureWhiteboard` runs after, unchanged, keyed off `barId` in every branch.

### Reused as-is (no change)

| Action | File | Used by |
|--------|------|---------|
| `promoteVaultBarToHand({ barId, targetSlot? })` | `src/actions/hand.ts` | detail page, list rows, Hand glance empty slot |
| `depositHandBarToVault({ barId })` | `src/actions/hand.ts` | detail page, list rows |
| `resolveOverflow({ newBarId, depositBarId })` | `src/actions/hand.ts` | whiteboard + CaptureBox overflow modals |
| `getPlayerHand()` | `src/actions/hand.ts` | detail page (is-this-BAR-in-hand? + empty-slot count) |

### Is-this-BAR-in-hand? — computed inline, **no new action**

The BAR detail page and list rows are **server components**; they read `HandSlot` rows directly and pass `inHand` / `handFull` as props to the client `HandLocationToggle`. (Architect simplification — avoids a new server action and an extra round-trip.) No new persistence; determined from `HandSlot`.

## User Stories

### P0 — Capture lands in the Hand

**HV-MV-1**: As a player completing a capture on the Seed Capture Whiteboard, the new BAR appears in my Hand (not the Vault), so my Hand reflects what I just made.

**Acceptance**: After `/bars/capture` → Keep, `/` Hand glance shows the BAR in a slot and the Vault count does not increment (unless the Hand was full).

**HV-MV-2**: If my Hand is full (6/6) when I capture on the whiteboard, the BAR is saved to my Vault with a toast telling me so — capture is never blocked or lost — and I can hold it later from the Hand glance.

**Acceptance**: With 6 BARs in Hand, a whiteboard capture lands in the Vault, shows the fallback toast, and no modal interrupts the canvas. (The forced overflow swap remains exercised by the `CaptureBox` Hand toggle.)

### P0 — Vault → Hand

**HV-MV-3**: As a player viewing a Vault BAR (detail page or list row), I can **Hold in Hand**; it moves into an empty Hand slot.

**Acceptance**: "Hold in Hand" appears only for owned Vault BARs; tapping it fills the lowest empty slot and the control flips to "Return to Vault". If the Hand is full, a non-blocking "Hand is full — return one first" message shows and nothing moves.

**HV-MV-4**: As a player on the Now home, tapping an **empty Hand slot** lets me pull an existing Vault BAR into the Hand (instead of only creating a new one).

**Acceptance**: The empty slot opens a Vault picker; selecting a BAR promotes it into that slot and the glance refreshes.

### P0 — Hand → Vault

**HV-MV-5**: As a player viewing a Hand BAR, I can **Return to Vault**; its slot frees up.

**Acceptance**: "Return to Vault" appears only for owned Hand BARs; tapping it clears the `HandSlot` binding and the control flips to "Hold in Hand". The BAR is **not** archived/composted.

### P1 — Honest confirmation copy

**HV-MV-6**: Post-capture confirmation and toasts say where the BAR landed ("Added to hand" / "Saved to vault") matching the actual destination.

### Verification quest

**HV-MV-7**: A certification quest walks a tester through whiteboard-capture → confirm in Hand → fill Hand → capture again → resolve overflow → Return one to Vault → Hold it back in Hand.

## Functional Requirements

### Phase 1 — Capture routes to Hand (API → UI)

- **FR1**: Extend `captureBarFromCanvas` to call `addBarToHandForPlayer` and return `placedIn` + optional `overflow` (contract above). Type-check green.
- **FR2**: `SeedCaptureWhiteboard.handleCapture` confirms "in your Hand" on `placedIn: 'hand'`, shows errors on `error`, and on `placedIn: 'vault'` (Hand was full) shows a **silent Vault-fallback toast** ("Hand full — saved to Vault; hold it later") — **no modal on the canvas** (Fork A, decided). Media upload runs in every non-error branch. Coordinate the return type with `bar-capture-consolidation`.
- **FR3**: `SimpleCaptureForm` routes to Hand (pass `destination: 'hand'` to `captureBar`); `/bars/kept` reads `dest=hand` and its copy + onward links reflect the Hand.

### Phase 2 — Bidirectional movement UI

- **FR4**: Compute `inHand` / `handFull` inline in the server components (detail page + list rows) from `HandSlot`; **no new server action**. Movement copy lives in one shared constant. **Fork B (decided)**: in v1 the toggle is shown only for non-planted BARs (`captured` / `shared_or_acted`); `context_named`/`elaborated` (Garden) are deferred to a Garden↔Hand follow-up.
- **FR5**: BAR detail page (`src/app/bars/[id]/page.tsx`): a contextual `HandLocationToggle` client component — "Hold in Hand" when in Vault, "Return to Vault" when in Hand; hand-full message handled; `router.refresh()` after. **Gate strictly to `isOwner`** (never `isRecipient`) — a talisman recipient must not move someone else's BAR (Steward).
- **FR6**: Vault/feed list rows: an inline quick-action (same toggle, compact) on owned-BAR rows. Reuse `HandLocationToggle`. (Identify the row component(s) during planning — candidates under `src/components/hand/Vault*` and the feed/garden lists.)
- **FR7**: Hand glance empty slot (`src/components/now/HandGlance.tsx`): replace the `/bars/create` link with a control that opens a Vault picker and calls `promoteVaultBarToHand`; keep a "create new" affordance available too.

### Phase 3 — Verification

- **FR8**: Implement certification quest `cert-hand-vault-movement-v1` (Twine + seed) per Verification Quest section.

## Non-Functional Requirements

- **Mobile-first**: all movement controls usable one-thumb; no horizontal scroll at 360px.
- **Graceful without AI**: capture routing and all movement are deterministic DB operations; no model calls.
- **Backward compatibility**: `CaptureBox` Hand/Vault toggle behavior is unchanged; no data migration (HandSlot already shipped). Existing Vault BARs remain in the Vault until a player moves them.
- **Authorization**: every movement action verifies `creatorId === playerId` (already enforced in `hand.ts`); the new UI only renders movement controls for owned BARs.
- **No four-move hardcoding**: untouched here, but Hand glance edits must not regress the existing maturity/next-move rendering.

## Persisted data & Prisma (required when schema changes)

**No schema change.** This kit reuses the existing `HandSlot` model owned by [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md).

| Check | Done |
|-------|------|
| Prisma models/enums/fields named in Design Decisions or API Contracts | none (reuses `HandSlot`) |
| `tasks.md` migration task | n/a — no migration |
| Verification: `npm run check` after wiring | yes (tasks.md Phase 4) |
| Human glanced at new `migration.sql` | n/a |

## Verification Quest (required for UX features)

- **ID**: `cert-hand-vault-movement-v1`
- **Steps** (one Twine passage each; final passage has no link → completion mints reward):
  1. Open `/bars/capture`, make a seed, Keep → confirm it shows **in your Hand** on `/`.
  2. Open the BAR detail; use **Return to Vault**; confirm it left the Hand.
  3. From the Vault (or the detail page), use **Hold in Hand**; confirm it's back in a slot.
  4. Fill the Hand to 6/6, capture once more on the whiteboard, resolve the **overflow modal** (send one BAR to the Vault).
  5. On `/`, tap an empty Hand slot and pull a Vault BAR in.
- **Narrative**: framed as stocking your Hand with live seeds before the Bruised Banana Fundraiser.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/), [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Dependencies

- [`hand-vault-bounded-inventory`](../hand-vault-bounded-inventory/spec.md) — **prerequisite** (HandSlot model + all base Hand actions; already shipped).
- [`home-vault-ia-redesign`](../home-vault-ia-redesign/spec.md) — companion IA layer (CaptureBox, HandGlance, NowHome). This kit fixes the canvas-capture and movement gaps it left open.
- [`hand-vault-rename`](../hand-vault-rename/spec.md) — `/hand` route/title alignment (capture revalidates `/hand`).
- [`bar-seed-capture-whiteboard`](../bar-seed-capture-whiteboard/spec.md) — the whiteboard capture surface.
- [`bar-seed-metabolization`](../bar-seed-metabolization/spec.md) — maturity phases shown in the Hand glance.

## References

- `src/actions/bars.ts` (`captureBarFromCanvas` ~L1044) — capture path to extend
- `src/actions/capture-bar.ts` (`captureBar`) — working reference pattern
- `src/actions/hand.ts`, `src/lib/hand-service.ts` — movement actions (reused)
- `src/components/bars/SeedCaptureWhiteboard.tsx` (`handleCapture` ~L1525), `src/components/bars/SimpleCaptureForm.tsx`
- `src/components/now/CaptureBox.tsx` (overflow modal pattern to reuse), `src/components/now/HandGlance.tsx` (empty slot ~L102)
- `src/app/bars/[id]/page.tsx` (owner actions block ~L216+), `src/app/bars/kept/page.tsx`
- Prisma workflow: [prisma-migration-discipline skill](../../../.agents/skills/prisma-migration-discipline/SKILL.md), [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc)
</content>
</invoke>
