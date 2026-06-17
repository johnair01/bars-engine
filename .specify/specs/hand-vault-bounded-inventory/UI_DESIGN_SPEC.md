# UI Design Spec: Hand / Vault Bounded Inventory

> **For: Claude Design.** Self-contained handoff for the Hand/Vault UI (Phases 2–3 of [hand-vault-bounded-inventory](./spec.md)). The data layer is **already built and merged** — this spec covers visuals + interaction only.
>
> **Session-start requirement (non-negotiable):** Read [`UI_COVENANT.md`](../../../UI_COVENANT.md), [`src/lib/ui/card-tokens.ts`](../../../src/lib/ui/card-tokens.ts), [`src/styles/cultivation-cards.css`](../../../src/styles/cultivation-cards.css), and [`src/components/ui/CultivationCard.tsx`](../../../src/components/ui/CultivationCard.tsx) before writing a line. Apply the three-channel encoding (element=color, altitude=border, stage=density). Tailwind = layout only; game aesthetic = CSS classes + tokens. No hardcoded hex, no arbitrary Tailwind aesthetic values.

---

## 1. What already exists (do not rebuild)

**Server actions** — [`src/actions/hand.ts`](../../../src/actions/hand.ts), all return `{ success, error?, … }`:

| Action | Use in UI |
|--------|-----------|
| `getPlayerHand()` → `HandContents` | Load the 6 slots, `filledCount`, `carryingBarId` |
| `addBarToHand({ barId })` | Pickup; returns `{ success:false, overflow }` when full → open OverflowModal |
| `resolveOverflow({ newBarId, depositBarId })` | Commit the overflow choice |
| `depositHandBarToVault({ barId })` | "Send to vault" from a hand slot |
| `promoteVaultBarToHand({ barId, targetSlot? })` | Vault → hand; `{ success:false, reason:'hand-full' }` |
| `setCarryingFromHand({ barId \| null })` | Set/clear the carrying slot |
| `reorderHandSlots({ newOrder })` | Drag-to-reorder result |

**Types** (from `hand.ts`):

```ts
HAND_SIZE = 6
type HandSlotDTO = { slotIndex: number; barId: string|null; isCarrying: boolean; bar: { id; title; type; moveType }|null }
type HandContents = { slots: HandSlotDTO[]; filledCount: number; size: number; carryingBarId: string|null }
type OverflowContext = { newBarId: string; newBarTitle: string; currentHand: Array<{ slotIndex; barId; title; type }> }
```

**Surfaces to build/replace:**
- `src/components/world/HandModal.tsx` (currently a stub reading the old heuristic) → real 6-slot grid
- `src/components/world/PlayerHud.tsx` → `Hand X / 6` indicator
- `src/components/world/OverflowModal.tsx` (**new**) → two-column deposit chooser
- `/vault` page → vault→hand promotion + compost

---

## 2. Three-channel mapping for a BAR-in-hand card

Every BAR renders as a **Cultivation Card** (`CultivationCard`). Map the three channels from BAR data:

| Channel | Source | Notes |
|---------|--------|-------|
| **Element** (color) | BAR's element (derive from `moveType` / element field; fallback per existing `BarCardFace`) | Frame border + glow + gem. Never the body fill. |
| **Altitude** (border) | The BAR's altitude/charge if available; else **neutral** | dissatisfied=1px/30%/no-glow · neutral=2px/70%/4px · satisfied=2px/100%/12px+inner ring |
| **Stage** (density) | **seed** in compact grid/strip; **growing** when expanded/inspected | Hand slots show the **seed** density (30% art, 1–2 lines, stat block hidden). Tapping a slot can expand to **growing**. |

The **carrying** BAR (slot 0, `isCarrying`) is the one card allowed the **Selected** state (full-brightness border, satisfied-intensity glow, 2s pulse) so it reads as "in hand, active."

---

## 3. Surface-by-surface design brief

### 3.1 HUD Hand indicator — `PlayerHud.tsx`
- Shows `Hand  X / 6` using Futura Bold **tabular-nums** (stat typography). Min touch target 44px; tappable → opens HandModal.
- Empty (`0/6`) vs full (`6/6`) must be legible at a glance. Full = subtle warning accent (Fire glow accent, not a fourth color channel — accent only per Law 8).
- Thumb-first: the indicator/button lives in the bottom 40% of the screen.
- States: Default, Hover, Focus, Active, Disabled (no player), Loading (while `getPlayerHand` resolves — shimmer the count, not the whole HUD).

### 3.2 HandModal — the 6-slot inventory
**What the player is doing:** inspecting and managing the bounded set they carry. GM-face zone: **Architect** (structure/inventory).

- **Layout:** a bottom sheet (`--surface-elevated #242420`), thumb-first. A **fixed 6-slot grid** (2×3 or 3×2 by viewport) — **empty slots are visible** as inert placeholder frames (dissatisfied altitude styling: 1px/30%, no glow), so scarcity is felt.
- **Filled slot:** a `CultivationCard` at **seed** density showing the BAR title (body font), element gem, and the BAR `type`. The carrying BAR shows the **Selected** state.
- **Per-slot actions** (revealed on tap/long-press, thumb-reachable): **Send to vault** (`depositHandBarToVault`), **Compost** (see 3.5), **Carry** (`setCarryingFromHand`).
- **Reorder:** drag-to-reorder → `reorderHandSlots`. Provide a non-drag fallback (move up/down) for accessibility.
- **Leaving-the-space ceremony:** the "Open Vault" link navigates to `/vault` (this is the intended ceremony — the modal itself never navigates).
- **States:** all 8 on the slot cards; modal entry uses the card entry animation; respect `prefers-reduced-motion`.

### 3.3 OverflowModal — full-hand pickup (**new**)
**Trigger:** `addBarToHand` returns `overflow`. **The alchemical decision moment** — make it feel like a real tactical choice, not an error.

- **Two columns, thumb-first:**
  - **Your hand (6)** — the `overflow.currentHand` BARs as selectable seed cards.
  - **Incoming** — the `overflow.newBarTitle` BAR, visually distinct (pre-card → post-card metaphor, Law 10: the incoming one can read as "not yet placed").
- **The choice:** player taps ONE BAR to send to the vault. Selecting a current-hand BAR → `resolveOverflow({ newBarId, depositBarId: <chosen> })` (new BAR takes the freed slot). Selecting/cancelling the incoming → `resolveOverflow({ newBarId, depositBarId: newBarId })` (new BAR goes to vault; **nothing is lost, nothing forced** — make this reassuring, not punitive).
- **Ritual moment:** committing the swap is a **Ritual** state (glow 24px, scale 1.05, `navigator.vibrate?.([15,5,10])` + 432Hz tone) — the deposited card composts/leaves, the new card seats.
- **States:** Selected (the chosen deposit), Disabled (until a choice is made), Loading (during the action), Ritual (on commit).

### 3.4 Vault → Hand promotion — `/vault`
- On the vault page, each BAR card gets a **Promote to hand** affordance, enabled **only when an empty slot exists**.
- Full hand → affordance shows **Disabled** state + helper text "Make room in your hand first" (link to HandModal). Drives `promoteVaultBarToHand`; handle `reason:'hand-full'`.
- Keep the vault's existing layout; this is an added action on existing cards.

### 3.5 Compost confirmation — the flow-not-hoarding ritual
- Composting (vault → discard, or hand → discard) **destroys a BAR for vibeulons**. Requires explicit confirmation ("This BAR is gone forever").
- This is the strongest **Ritual** moment in the feature: the card visibly **composts** (Stage = composted: 20% opacity + crosshatch overlay) before removal, then the vibeulon reward animates in. Encourages flow over hoarding (the 6-slot scarcity IS the lesson).

---

## 4. Covenant acceptance checklist (build gate)

```
[ ] All text contrast ≥ 4.5:1 (no text-zinc-600 at text-xs)
[ ] All touch targets ≥ 44px; primary actions in bottom 40%
[ ] No hardcoded hex / arbitrary Tailwind aesthetic values — tokens + cultivation-cards.css only
[ ] Empty hand slots visible (scarcity felt); filledCount drives HUD X/6
[ ] All 8 interaction states on every card (incl. Selected for carrying, Ritual for swap/compost)
[ ] prefers-reduced-motion guard on every animation
[ ] aria-label on cards encoding element/altitude/stage
[ ] Three channels only — full hand uses Fire glow ACCENT, not a 4th color
[ ] Pre-card (incoming/raw) visually distinct from post-card (placed/element-coded)
```

## 5. Verification Quest (required for UX)

- **ID:** `cert-bounded-hand-v1`
- **Steps** (one Twine passage each; final has no link → completion mints reward):
  1. Open the HandModal — confirm `X / 6` and visible empty slots.
  2. Pick up a BAR into an empty slot (auto-fill).
  3. Fill the hand, pick up once more → resolve the **OverflowModal** (deposit one to vault).
  4. From `/vault`, **promote** a BAR back into a freed slot.
  5. **Compost** a BAR and confirm the vibeulon reward.
- **Narrative frame:** preparing a tight, well-specced hand so guests can play fast at the **Bruised Banana Fundraiser**.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/), [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## 6. References

- API: [`src/actions/hand.ts`](../../../src/actions/hand.ts) · Spec: [spec.md](./spec.md) · Plan: [plan.md](./plan.md) · Tasks: [tasks.md](./tasks.md)
- Covenant: [`UI_COVENANT.md`](../../../UI_COVENANT.md) · Tokens: [`src/lib/ui/card-tokens.ts`](../../../src/lib/ui/card-tokens.ts) · CSS: [`src/styles/cultivation-cards.css`](../../../src/styles/cultivation-cards.css) · Primitive: [`src/components/ui/CultivationCard.tsx`](../../../src/components/ui/CultivationCard.tsx)
- Current surfaces: `src/components/world/HandModal.tsx`, `src/components/world/PlayerHud.tsx`
