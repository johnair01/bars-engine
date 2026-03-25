# Tasks: Dashboard two-channel hub

**Spec:** [spec.md](./spec.md) · **Plan:** [plan.md](./plan.md)

## Phase 0 — Audit & decisions

- [x] Read `UI_COVENANT.md` and skim **dashboard sections below** the hub in `src/app/page.tsx`; note **1–2 UI patterns** to align with (reference in PR description).
- [x] **Title + subtitle**: choose player-facing strings; **no** visible “Throughput” (Challenger).
- [x] **Try it / loop**: decide target URL(s) and label(s); fix or document `/play` vs `/adventures` mismatch per [SIX_FACE_ANALYSIS.md](../player-main-tabs-move-oriented-ia/SIX_FACE_ANALYSIS.md).

## Phase 1 — Row primitive & channels

- [x] Implement a **reusable row** (component or internal helper): primary action, optional muted description, `next/link`, **min-h-[44px]**, **focus-visible** ring, covenant vars for border/glow by channel.
- [x] **Personal** channel: map existing three links (**Capture**, Scene Atlas, Hand/Vault) through the primitive.
- [x] **Collective** channel: map existing five links (**I Ching** with `instanceId` when set, **Game map**, **Campaign**, **Residency events**, **Lobby**) through the primitive.

## Phase 2 — Section chrome

- [x] Replace section header: new title, subtitle, CTA area per Phase 0.
- [x] Channel containers: **two** distinct visual territories (Shaman + tokens); avoid fourth decorative color channel (Covenant).
- [x] Optional: **single** subtle ambient treatment for the section only if covenant-compliant; otherwise skip.

## Phase 3 — Optional rename & cleanup

- [x] (Optional) Rename `ThroughputLanesSection.tsx` → `DashboardTwoChannelHub.tsx` (or similar) + update `page.tsx` import; or defer to follow-up PR.

## Verification

- [x] Manual: **Campaign** link uses `campaignHomeHref`; **I Ching** includes `instanceId` when `activeInstanceId` passed.
- [x] Manual: mobile width ~375px — **no horizontal scroll** in this section; tap targets feel good.
- [x] `npm run check` and `npm run build` pass.
- [x] Check off acceptance criteria in [spec.md](./spec.md).

## Post-ship (backlog hooks)

- [ ] If global rename of “Personal Throughput” in wiki/content is desired, open a **separate** thin spec or docs task (non-blocking for this hub).
