# Tap the Vein — UI Design Spec (hand-off to Claude design)

**Date:** 2026-06-24
**For:** Claude design — design surfaces (2) the `/tap-the-vein` page and (3) the NOW-hub panel.
**Engineering (Layer A page route + data) is being built in parallel; this doc owns the *visual/UX* layer only.**
**Authority:** This spec is subordinate to [`UI_COVENANT.md`](../../UI_COVENANT.md) and [`src/lib/ui/card-tokens.ts`](../../src/lib/ui/card-tokens.ts). Where they disagree, the covenant wins.

---

## 0. Required session-start prompt (paste this first)

> "Read `UI_COVENANT.md` before writing any UI code. Apply the three-channel encoding system (element=color, altitude=border, stage=density). Use CSS classes from `src/styles/cultivation-cards.css` for all game aesthetic. Use Tailwind only for layout. Reference `src/lib/ui/card-tokens.ts` for all color values. Use the `CultivationCard` primitive (`src/components/ui/CultivationCard.tsx`) for every card-shaped surface."

Read order before writing: `UI_COVENANT.md` → `card-tokens.ts` → `src/styles/cultivation-cards.css` → `src/components/ui/CultivationCard.tsx` → the two reference components in §6.

---

## 1. What Tap the Vein is (one paragraph)

Tap the Vein (TTV) is the **daily morning ritual**: the player free-writes the day's raw charge, then distills it into **up to 5 committed tasks** they will actually do. Each task then moves through a lifecycle — start, complete, push to tomorrow (carry), compost (discard with a reason), assign to a campaign, or upgrade to a quest. It sits at the top of the morning sequence (`lenses → TTV → 321`) and is the upstream feeder for the rest of the game. The free-write is **raw, pre-card material**; the committed tasks are the **first formed artifacts**. That raw→formed transition is the heart of the screen and must be the strongest visual moment (UI_COVENANT Law 10).

There are exactly **two surfaces to design**:
- **(2) The page** `/tap-the-vein` — the full ritual.
- **(3) The panel** — a compact daily-ritual card on the NOW hub (`/`) that launches the ritual and reflects today's state.

---

## 2. Three-channel mapping for TTV (the design decisions)

UI_COVENANT requires every card to declare Element / Altitude / Stage. Here is the mapping for TTV's objects. **This is the spec's core guidance — follow it; flag any token gaps rather than inventing a 4th channel.**

| Object | Element | Altitude | Stage | Notes |
|---|---|---|---|---|
| **Free-write / brainstorm well** | *none — pre-card* | n/a | n/a | This is **pre-card raw material**. It must look visually distinct from any element-coded card (Law 10): unframed, no element glow, no gem — a raw "well" using `--surface-inset` (`#111110`). This distinction is the product metaphor; do not skip it. |
| **Committed task (just committed)** | player's nation element (via `useNation()`) | `neutral` | `seed` | A task is a freshly planted seed. `seed` stage → 30% art window, stat block hidden, 1–2 description lines (`STAGE_TOKENS.seed`). |
| **Task in progress** | player's nation element | `satisfied` | `seed` | Raise altitude to `satisfied` (full border + 12px glow) to signal "active right now." |
| **Completed task** | player's nation element | `satisfied` | `growing` | Promote to `growing` density (stat block visible) — it earned detail. |
| **Composted task** | player's nation element | `dissatisfied` | `composted` | `composted` stage: 20% opacity, crosshatch overlay, 40% stat opacity. Carries `compostReason`. |
| **Carried-over task** | player's nation element | `neutral` | `seed` | Same as committed, but badge it "carried ×N" from `carryCount`. Surface these at the **top** of the work list. |
| **Upgrade-to-quest action** | — | — | — | This is the **Ritual** interaction state (UI_COVENANT §"Eight Interaction States": 24px glow, scale 1.05, haptic + 432Hz tone). It is the alchemical exit — treat it as a ceremony, not a button. |

**Element source:** TTV is upstream of nations, so a task has no intrinsic element. Use the **player's nation element** via `useNation()` for personal accent (handle `null` → fall back to neutral chrome `text-zinc-400` / `◇` sigil, per the covenant's null-handling rule). Never hardcode an element.

**Accent for the *pre-card* / ritual chrome:** use the liminal **purple** (`#7c3aed` range) — the covenant reserves purple for liminal/primary-action states, which is exactly what the raw free-write and the "commit"/"upgrade" actions are. This also visually distinguishes TTV from the NOW hub's existing **Daily Charge** panel, which owns earth-gold (`#d4a017`).

---

## 3. Surface (2): the `/tap-the-vein` page

Mobile-first, **thumb-first** (primary actions in bottom 40%). The NOW hub renders inside a 432px phone frame; design the page to the same width discipline. Structural sibling for layout/pacing: the 321 runner (`src/app/shadow/321/`), which is deliberately slow and step-based.

The page is a **single ritual with phases**. Design each phase's screen state and the transitions between them:

### Phase A — Morning open
- Header: "Tap the Vein", date, and (if present) **carried-over tasks from yesterday** surfaced at the top as seed cards with a "carried ×N" badge.
- If lenses were active, show the `lensIntentionTextSnapshot` as a quiet brainstorm seed prompt. **Lenses is not built yet** — design the empty state as the default (no seed prompts; blank, inviting well).

### Phase B — Brainstorm (the pre-card moment)
- A large raw **free-write well** (pre-card aesthetic — see §2). Running **word count** indicator (the model stores `wordCount`; the daily practice floor is 750 words — show progress toward it but do **not** hard-block).
- This is where the player dumps. Calm, low-chrome, lots of room. One ambient motion max (UI_COVENANT Law 12).

### Phase C — Commit (raw → formed = the alchemical transition)
- Player extracts **up to 5 tasks** from the brainstorm. Each extraction is the **pre-card → seed-card** transformation — design this as the screen's signature moment (a card forming/condensing out of the raw text). Enforce the ≤5 cap visually (show "3 / 5 committed").
- Each task may be tagged with `lensLevel` / `lensCategory` (optional; design the controls but they can be empty/hidden when lenses is absent).

### Phase D — Work (the day's tasks)
- A list/stack of today's committed tasks as **seed cards** (CultivationCard, element = nation, altitude per state in §2). Carried tasks pinned to top.
- Per-task actions (design as a card action set, thumb-reachable): **Start** (→ in_progress), **Complete** (→ growing), **Carry to tomorrow**, **Compost** (opens a reason picker — `compostReason` is required), **Assign to campaign** (with a **privacy toggle**, default OFF: "Share with campaign stewards & members"), **Upgrade to quest** (the **Ritual** state).
- Design the **compost reason picker** (options: not_relevant · already_done · assigned_elsewhere · too_small · too_big · other) and the **assign-to-campaign** sheet with its visibility toggle.

### Phase E — Seal (evening close)
- A "seal the day" action sets the session `sealedAt` / `status = sealed`. Tasks not moved to an exit state should prompt an explicit carry-or-compost decision — **no silent carryover** (this is a hard product rule).
- Sealed state: a quiet, satisfied "day complete" treatment (sibling in tone to Daily Charge's "A yellow brick is paved" done state).

**Deliverables for the page:** all phase screen states above, the raw-well (pre-card) treatment, the commit transition animation, the task card in all six lifecycle states from §2, the compost picker, the assign sheet, the seal/done state, and the empty/first-time state. Plus all **8 interaction states** per the covenant for every card and the upgrade-to-quest **Ritual** moment.

---

## 4. Surface (3): the NOW-hub panel

Lives in `src/components/now/NowHome.tsx`, rendered in the scrollable `<main>` stack **directly above** `<DailyChargePanel>` (currently `NowHome.tsx:117-120`). It must read as a **sibling of Daily Charge** in weight and rhythm, but with TTV's purple/liminal accent (Daily Charge owns earth-gold). Study `src/components/now/DailyChargePanel.tsx` for the exact pattern — section label + state-driven card body.

Design these **panel states** (mirroring DailyChargePanel's state machine):

1. **Not started today** — invitation. Section label "Tap the Vein", one-line "what this is" ("Free-write the morning charge, then commit up to 5 tasks"), primary CTA → `/tap-the-vein`. This copy is the discoverability/"know what it does" payload.
2. **In progress** (session open, some tasks committed) — compact summary: "N tasks committed · M carried" with a "continue" CTA. Optionally a tiny row of seed dots (like Daily Charge's hand-bar list).
3. **Sealed / done today** — completed treatment mirroring "A yellow brick is paved": e.g. "The vein is tapped — N tasks set for today," satisfied altitude, quiet.

The panel does **not** run the ritual inline; it launches/links to the page. Keep it to ~the visual height of DailyChargePanel.

**Deliverables for the panel:** the three states above, matched to DailyChargePanel's anatomy, in TTV's accent. Thumb-first (it's in a scrollable column, but the CTA must be a ≥44px target).

---

## 5. Data available to the UI (from PR #138 models)

The UI binds to these fields (already migrated; Prisma models `TapTheVeinDailySession` + `TapTheVeinTask`). Engineering will expose them via server actions — design to this shape:

**Daily session:** `sessionDate`, `status` (`open|sealed|abandoned`), `sealedAt`, `wordCount`, `committedTaskCount`, `brainstormCandidateCount`, `rawEntry`, optional `lens*` snapshot, optional `eaChannel`/`chargeStrength` (stored for replay — **not** required in v1 UI; ignore unless asked).

**Task:** `originalText`, `status` (`committed|in_progress|completed|carried_over|composted|assigned_to_campaign|upgraded_to_quest`), `carryCount`, `carriedFromDailySessionId`, `compostReason`, `compostedAt`, `campaignId`, `visibility` (`null`=private, `"campaign"`=shared), `questId`, optional `lens*`, `completedAt`, `source` (`brainstorm|user_added`).

Map task `status` → the Element/Altitude/Stage rows in §2. Note `status` is domain state; `CardStage` is a UI display choice (the covenant forbids hard-coupling them) — §2 is the intentional mapping, set it in the consumer.

---

## 6. Reference components (read before designing)

| File | Why |
|---|---|
| `src/components/ui/CultivationCard.tsx` | The card primitive — props API (`element`/`altitude`/`stage`/`selected`/`loading`/`ritual`/…). Use it for every task card. |
| `src/components/now/DailyChargePanel.tsx` | Exact sibling pattern for the NOW panel (state machine, section label, done state). |
| `src/components/now/NowHome.tsx` | Where the panel mounts (above `DailyChargePanel`, `:117`). Shows the phone-frame layout + the "When you're activated" tools rail aesthetic. |
| `src/app/shadow/321/` (`page.tsx`, `Shadow321Runner.tsx`) | Structural sibling for a slow, multi-step ritual runner — pacing and back-nav patterns. |
| `src/lib/ui/nation-provider.ts` | `useNation()` for the player's element accent (handle `null`). |

---

## 7. Covenant acceptance checklist (build gate)

```
[ ] UI_COVENANT.md read at session start
[ ] Pre-card free-write well is visually distinct from any element-coded card (Law 10)
[ ] Task cards use CultivationCard; element from useNation() (null-safe), altitude/stage per §2
[ ] Upgrade-to-quest implemented as the Ritual interaction state (24px glow, haptic, 432Hz)
[ ] All 8 interaction states present on every card
[ ] NOW panel matches DailyChargePanel anatomy; TTV purple accent, not earth-gold
[ ] Compost requires a reason; assign-to-campaign defaults to private (toggle OFF)
[ ] No silent carryover — unsealed tasks prompt carry/compost at seal
[ ] No hardcoded hex / no Tailwind arbitrary aesthetic values / tokens only
[ ] All text contrast ≥ 4.5:1; no text-zinc-600 at text-xs; touch targets ≥ 44px
[ ] prefers-reduced-motion guard on all animation; one ambient motion per screen
[ ] aria-label on every card encodes element/altitude/stage
[ ] Empty/lenses-absent state is the default (lenses not yet built)
```

---

## 8. Out of scope for this design pass
- Lenses brainstorm seeding (lenses surface not built — design the empty state).
- EA-channel / charge-strength analysis UI (stored for replay only; not shown in v1).
- Admin/deck surfaces, analytics, multi-player sessions.
- The PLAY-page "Wake Up" card (secondary entry point — design later, after the page ships).
```
