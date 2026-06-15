# UI Design Spec: "Now" Homepage (Capture-First)

> **For: Claude Design.** Self-contained handoff for the home (`/`) redesign — the "Now" surface. The **backend is already built and merged**; this spec is visuals + interaction only.
>
> **Session-start requirement (non-negotiable):** Read [`UI_COVENANT.md`](../../../UI_COVENANT.md), [`src/lib/ui/card-tokens.ts`](../../../src/lib/ui/card-tokens.ts), [`src/styles/cultivation-cards.css`](../../../src/styles/cultivation-cards.css), and [`src/components/ui/CultivationCard.tsx`](../../../src/components/ui/CultivationCard.tsx) before writing a line. Three channels only (element=color, altitude=border, stage=density). Tailwind = layout; game aesthetic = CSS classes + tokens. No hardcoded hex, no arbitrary Tailwind aesthetic values.

---

## 1. The one job

> **Get people capturing ideas and metabolizing them as fast as possible.**

The homepage is **the active loop**, not a dashboard. One screen, mobile-first, thumb-first. Capture is dominant; the daily charge guarantees ≥1 BAR/day; the hand stays visible so people know what they're holding.

**The loop the screen must make obvious:** *Capture a seed → (daily charge guarantees one) → see it in your Hand → take its one next move → it graduates into the Garden / Quests.*

---

## 2. What already exists (do not rebuild — wire to it)

**Server actions** — all result-shaped (`{ success, error?, … }`):

| Action | File | Use |
|--------|------|-----|
| `captureBar({ content, title?, destination })` | [`src/actions/capture-bar.ts`](../../../src/actions/capture-bar.ts) | Capture box. `destination: 'vault'` (default) or `'hand'`. Returns `{ placedIn }` or `{ overflow }` when hand full. |
| `getPlayerHand()` | [`src/actions/hand.ts`](../../../src/actions/hand.ts) | Hand glance: `slots`, `filledCount`, `carryingBarId`. |
| `addBarToHand` / `resolveOverflow` | `src/actions/hand.ts` | Overflow resolution (shared `OverflowModal` from the Hand/Vault UI work). |
| `getTodayChargeTargets()` | [`src/actions/daily-charge.ts`](../../../src/actions/daily-charge.ts) | `{ alreadyDoneToday, handBars: [{ barId, title, maturity }] }`. |
| `applyDailyCharge({ mode })` | `src/actions/daily-charge.ts` | `mint` (new charge) or `advance` (push a Hand BAR's maturity). Rejects `already-done-today`, `bar-not-in-hand`. |
| `promoteVaultBarToHand({ barId })` | `src/actions/hand.ts` | When the player wants to advance a Vault BAR — promote first. |

**Maturity → home helper** — [`src/lib/bar-home.ts`](../../../src/lib/bar-home.ts): `resolveBarHome(maturity, inHand)` → `hand | vault | garden | quests`, and `BAR_HOME_ROUTE` for "go to this BAR" links.

**Maturity phases:** `captured → context_named → elaborated → shared_or_acted → integrated`.

**Surface to build/replace:** `src/app/page.tsx` (the `Home` server component) → render a new `NowHome`. New components: `src/components/now/NowHome.tsx`, `CaptureBox.tsx`, `DailyChargePanel.tsx`, `HandGlance.tsx`.

**Must preserve from current `page.tsx`:** auth/instance gating, onboarding (`WelcomeScreen`, `OnboardingChecklist`), and the `DatabaseUnreachable` / `SetupRequired` fallbacks. The Now loop renders only for an onboarded, authenticated player with a reachable DB.

---

## 3. Layout — mobile-first, thumb-first (Law 5)

Single column, vertical priority. **Primary actions live in the bottom 40%.** At 360px width: no horizontal scroll, all touch targets ≥ 44px.

```
┌─────────────────────────────┐
│  (minimal header — identity, │  ← top: low-priority chrome only
│   not the focus)             │
│                             │
│  ░░ HAND GLANCE ░░          │  ← ambient: X/6 + each BAR's next move
│  [seed][seed][seed] 3/6     │
│                             │
│  ◆ DAILY CHARGE             │  ← the guaranteed ≥1/day ritual
│  (done ✓  or  mint/advance) │
│                             │
│  ╔═══════════════════════╗  │
│  ║  CAPTURE (dominant)   ║  │  ← bottom 40%, thumb zone, always-on
│  ║  [ one line / voice ] ║  │
│  ║  → Hand | Vault       ║  │
│  ╚═══════════════════════╝  │
└─────────────────────────────┘
```

Order rationale: capture is the most-used action → it owns the thumb zone at the bottom. Hand + daily charge sit above as glance/ritual. (Designer may tune vertical order, but **capture stays in the thumb zone** and **nothing critical sits at the very top**.)

---

## 4. The three zones

### 4.1 CaptureBox — dominant, always-on
**What the player is doing:** dropping a raw seed. GM-face zone: **Shaman** (felt signal, pre-form).

- **One action to save.** A single field (text) + voice/photo affordance. **Zero required fields** beyond a line of content. No title, no category, no move picker — *capture now, contextualize later.* The heavy form is gone.
- **Pre-card aesthetic (Law 10).** The capture input is **raw/unformatted** — it must look visually distinct from an element-coded card. This is the alchemical "before." When `captureBar` succeeds, the new seed animates into the Hand glance as a **post-card** (element-coded). That transition *is* the product metaphor — make it land.
- **Destination choice.** After (or alongside) submit: **Add to Hand** / **Send to Vault**. **Vault is the default** (pressing the primary capture button with no choice → vault; capture is never blocked). "Add to Hand" routes via `captureBar({ destination: 'hand' })`.
- **Overflow.** If `captureBar` returns `{ overflow }`, open the shared **OverflowModal** (from the Hand/Vault UI spec) to deposit one BAR; the seed is already safe in the vault meanwhile.
- **States:** Default, Hover, Focus (visible ring), Active, Loading (during `captureBar` — shimmer the submit, not the field), Disabled (empty input), plus a brief **Ritual** confirmation on successful capture (haptic `navigator.vibrate?.([15,5,10])` + 432Hz tone, reduced-motion safe).

### 4.2 DailyChargePanel — the guaranteed floor
**What the player is doing:** spending today's one charge. GM-face zone: **Diplomat** (ritual/relationship to the daily practice).

- **Two states from `getTodayChargeTargets`:**
  - `alreadyDoneToday: true` → a calm **done** state (satisfied altitude, no nagging). One ambient change only (Law 12) — e.g. a gentle glow, not a call to action.
  - `alreadyDoneToday: false` → the **ritual is available**: choose **Mint** (capture a fresh charge → `applyDailyCharge({ mode:'mint' })`) or **Advance** (pick a Hand BAR → `applyDailyCharge({ mode:'advance', barId })`).
- **Advance picker** lists `handBars` (each `{ title, maturity }`) as small seed cards; the maturity phase is shown as the BAR's **stage/altitude**, and advancing animates it one step forward.
- **Vault BAR intent:** if the player wants to advance something not in the hand, surface "Pull it into your hand first" → `promoteVaultBarToHand`, then advance. (Matches the rule: the daily charge only elaborates Hand BARs.)
- **Reject handling:** `already-done-today` → show the done state; `bar-not-in-hand` → the promote prompt.
- **States:** all 8; committing the charge is a **Ritual** moment (this is the day's guaranteed progress — make it feel earned).

### 4.3 HandGlance — ambient awareness
**What the player is doing:** knowing what they're holding without leaving Now. GM-face zone: **Architect** (structure).

- Reads `getPlayerHand()`: render `filledCount / 6` (Futura Bold **tabular-nums**) + the slot cards at **seed** density.
- Each filled slot shows the BAR title (body font), element gem, and **its one next move** toward maturity (derive the next phase label from the maturity → use the `bar-home` mapping / phase order). This is the "always know what's in your hand" requirement.
- The **carrying** BAR (`carryingBarId`, slot 0) gets the **Selected** state (full-brightness border, satisfied glow, 2s pulse).
- Empty slots are **visible** (dissatisfied styling) so the 6-slot bound is felt.
- Tapping the glance opens the full HandModal (built in the Hand/Vault UI work) — this component is the compact read-only view, not the manager.
- A small **Garden** affordance: BARs that have matured to `garden` (planted) link out via `BAR_HOME_ROUTE.garden` — so the player sees the loop's next stage.

---

## 5. Three-channel mapping (for every card on this screen)

| Channel | Source | Notes |
|---------|--------|-------|
| **Element** (color) | BAR element field / tint; capture seeds may be element-less until tinted | Frame/glow/gem only, never body fill (`#1a1a18`). Element-less raw capture = pre-card neutral. |
| **Altitude** (border) | BAR charge/altitude if present; else **neutral** | dissatisfied=1px/30%/no-glow · neutral=2px/70%/4px · satisfied=2px/100%/12px+inner ring |
| **Stage** (density) | maturity phase → density | `captured` = **seed** (30% art, 1–2 lines). Growing phases can read as **growing**. The HandGlance always uses **seed** density. |

Full hand (`6/6`) uses a Fire **glow accent** as a "full" cue — accent only, not a fourth color channel (Law 8/1).

---

## 6. Covenant acceptance checklist (build gate)

```
[ ] Capture is in the thumb zone (bottom 40%); nothing critical at the top
[ ] Capture saves with one action, zero required fields; Vault is the default destination
[ ] Pre-card (raw capture) visually distinct from post-card (element-coded seed in hand)
[ ] Hand glance shows filledCount/6 (tabular-nums) + each BAR's next move; empty slots visible
[ ] Daily charge: calm done-state when alreadyDoneToday; mint/advance otherwise; promote-first for vault BARs
[ ] All text contrast ≥ 4.5:1 (no text-zinc-600 at text-xs); touch targets ≥ 44px
[ ] No hardcoded hex / arbitrary Tailwind aesthetic values — tokens + cultivation-cards.css only
[ ] All 8 interaction states; Ritual on successful capture + on committing the daily charge
[ ] One ambient change per screen (idle float on active/carrying card only)
[ ] prefers-reduced-motion guard on every animation; aria-labels encode element/altitude/stage
[ ] Existing gating preserved: auth, onboarding, DatabaseUnreachable, SetupRequired
[ ] No horizontal scroll at 360px
```

## 7. Verification Quest (required for UX)

- **ID:** `cert-now-home-v1`
- **Steps** (one Twine passage each; final has no link → completion mints reward):
  1. On `/`, capture a seed in one action — confirm it appears in the Hand glance.
  2. Choose **Send to Vault** on a second capture — confirm it does *not* enter the hand.
  3. Do the **Daily Charge** by **advancing** a Hand BAR — confirm its maturity moved one step.
  4. Try the daily charge again — confirm the calm **already-done-today** state.
  5. Attempt to advance a Vault BAR — confirm the **promote-to-hand-first** prompt.
- **Narrative frame:** preparing fast capture so guests can drop and metabolize ideas at the **Bruised Banana Fundraiser**.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/), [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## 8. References

- Backend: [`capture-bar.ts`](../../../src/actions/capture-bar.ts) · [`daily-charge.ts`](../../../src/actions/daily-charge.ts) · [`hand.ts`](../../../src/actions/hand.ts) · [`bar-home.ts`](../../../src/lib/bar-home.ts)
- Spec/plan/tasks: [spec.md](./spec.md) · [plan.md](./plan.md) · [tasks.md](./tasks.md)
- Covenant: [`UI_COVENANT.md`](../../../UI_COVENANT.md) · Tokens: [`src/lib/ui/card-tokens.ts`](../../../src/lib/ui/card-tokens.ts) · CSS: [`src/styles/cultivation-cards.css`](../../../src/styles/cultivation-cards.css) · Primitive: [`src/components/ui/CultivationCard.tsx`](../../../src/components/ui/CultivationCard.tsx)
- Current surface: `src/app/page.tsx`
- Companion UI spec: [hand-vault-bounded-inventory/UI_DESIGN_SPEC.md](../hand-vault-bounded-inventory/UI_DESIGN_SPEC.md) (shares the OverflowModal + HandModal)
