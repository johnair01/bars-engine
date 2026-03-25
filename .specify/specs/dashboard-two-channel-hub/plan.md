# Plan: Dashboard two-channel hub

**Spec:** [spec.md](./spec.md) · **Tasks:** [tasks.md](./tasks.md)

## Goal

Implement the redesigned **NOW dashboard hub** (today `ThroughputLanesSection`): player-facing naming, covenant-aligned tactile rows, two-channel IA preserved, `/play` vs `/adventures` CTA resolved per spec.

## Phases

### Phase 0 — Audit & naming (short)

1. Skim **sections below** the hub on `src/app/page.tsx` (e.g. charge, compass, quests) and note **1–2 reference patterns** for “juice” to align row weight (Architect + Sage).
2. Pick **section title + subtitle** candidates (3 options). Challenger gate: no “Throughput” in UI.
3. **PLAY routing (shipped):** dual CTAs — **Play →** `/adventures` (matches main PLAY tab); **New? Demo loop →** `/play` (short onboarding loop). Resolves SIX_FACE disconnect without removing `/play` discovery.

**Shipped title + subtitle:** “Practice & field” + one line on feel it / give it form (solo vs field).

### Phase 1 — Component primitive

1. Extract or inline a **`DashboardChannelRow`** (name TBD): primary label, optional description, `href`, optional icon; renders as **focusable button-like link** using cultivation-card vars where appropriate.
2. Apply **element tokens** per channel: e.g. Personal → wood/emerald register already used; Collective → fire/amber — must map to **card-tokens**, not one-off purple decorative.

### Phase 2 — Section shell

1. Replace flat `<ul><li><Link>` with **grid of rows** or **stacked cultivation-card-light** containers per channel.
2. Section header: title, subtitle, tertiary CTA row.
3. **One** idle/ambient rule if any (Shaman + UI Covenant § one ambient change).

### Phase 3 — Integration & QA

1. Wire `src/app/page.tsx`; verify `campaignHomeHref` + `iching` query unchanged.
2. Keyboard + screen reader pass on the block.
3. `npm run check`, `npm run build`.

## File impacts (expected)

| Area | Files |
|------|--------|
| Hub UI | `src/components/dashboard/DashboardTwoChannelHub.tsx` |
| Dashboard | `src/app/page.tsx` (import/name only if file renamed) |
| Styles | `src/styles/cultivation-cards.css` only if new modifier justified; prefer existing classes |
| Tokens | `src/lib/ui/card-tokens.ts` — read-only unless new shared helper needed |

## Naming candidates (for tasks / PR discussion)

- **Title ideas**: “Two channels”, “Practice & field”, “Solo & circle”, “Your move”, “Where to put it” (pick one with Diplomat review).
- **Internal code name**: may stay `ThroughputLanesSection` until rename task to avoid churn; or rename in same PR if trivial.

## Risks

- **Over-building** decorative sliders with no state — Regent says skip unless v1.1 scoped.
- **Regression** on `campaignHomeHref` or I Ching `instanceId` — add manual test steps to `tasks.md`.

## Implementation rule

All feature work **follows [tasks.md](./tasks.md)** in order; this plan is the strategic overlay only.
