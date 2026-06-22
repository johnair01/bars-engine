# Design Spec: MilestoneNeeds UI

> For **Claude design**. Component: `src/components/superpowers/MilestoneNeeds.tsx`
> (campaign Phase 3, FR8/FR11a). The tiered skill/time-donation surface for the
> Mobility Quest campaign. Read alongside [`UI_COVENANT.md`](../../../UI_COVENANT.md),
> [`spec.md`](./spec.md), and the Six Faces ruling
> ([STRAND_CONSULT_SIX_FACES.md](./STRAND_CONSULT_SIX_FACES.md)).

## Purpose (one line)

Show a player the **scoped ways their superpower can move this campaign's
milestones forward** — matched needs first, open-aid second — and let them claim
and complete one, with honest per-unit progress and **no extractive framing**.

## What it renders (data contract — already built & tested)

Source actions (`src/actions/milestone-needs.ts`) + engine (`src/lib/superpowers/needs.ts`):

```ts
// listMilestoneNeedsForPlayer(...) → { tiered: TieredNeed[], summary: NeedProgress }

type NeedTier = 'matched' | 'open'
interface TieredNeed { need: MilestoneNeed; tier: NeedTier }

interface MilestoneNeed {
  id: string
  milestoneId: string
  superpower: 'connector'|'storyteller'|'strategist'|'disruptor'|'alchemist'|'escape_artist'|'coach'
  orientation: 'internal' | 'external'
  cardId: string
  unit: 'action' | 'currency' | 'hours'   // NEVER blended across units
  value: number                           // unit-typed; NO per-action multiplier
  status: 'open' | 'claimed' | 'done'
  claimedByPlayerId?: string
  title?: string
}

interface UnitProgress { unit: 'action'|'currency'|'hours'; done: number; total: number }
interface NeedProgress { external: UnitProgress[]; internal: UnitProgress[] }
```

Actions the UI calls: `claimMilestoneNeed({ needId })` → `{ ok, needId }`;
`completeMilestoneNeed({ needId })` → `{ ok, contributionId }`. Both are
`useTransition`-friendly server actions returning `{ ok, error? }`.

Helper for labels/colors: `SUPERPOWER_DEFS[need.superpower]` →
`{ label, channel /* ElementKey */, … }`. Translate the card via
`translateCardForSuperpower(card, superpower, orientation)` →
`{ prompt, suggestedArtifact, cardReading }` (already built) for the need detail.

## Hard constraints (non-negotiable — Six Faces ruling + ethos)

1. **Never show a per-action point value to the contributor.** No "+1", no scores,
   no leaderboard. A need is "one scoped act," dignified. (Currency/hours needs may
   show their human amount, e.g. "$50" or "2 hrs" — that's the *ask*, not a score.)
2. **Per-unit sub-bars, never blended.** Progress renders as separate bars per unit
   (actions / dollars / hours) — never summed into one number.
3. **Internal vs external tracked separately.** Internal (self-allyship) progress is
   its own track; it must never be dwarfed by or merged into external money/hours.
4. **Tier 1 (matched) before Tier 2 (open).** Matched needs lead; open-aid is a
   clearly-labeled fallback ("Other ways to help"), never coercive.
5. **No email/sign-in gate to *view*.** Claiming/completing may require sign-in
   (surface a gentle prompt inline), but browsing needs never does.
6. **Solidarity, not extraction.** Copy frames help as mutual aid moving a shared
   cause — not productivity accounting. (Portland AI-allergy / anti-extractive.)

## UI_COVENANT encoding (how it must look)

- All card aesthetic via `CultivationCard` (`src/components/ui/CultivationCard.tsx`)
  + classes in `cultivation-cards.css`. Tailwind for **layout only**. **Zero
  hardcoded hex** — colors come from `card-tokens.ts`.
- **Element (color)** = the need's superpower channel: `SUPERPOWER_DEFS[sp].channel`
  (`fire | water | wood | metal | earth`). A matched need card glows in the
  player's superpower color.
- **Altitude (border/glow intensity):** `satisfied` for a matched/claimable need,
  `neutral` for open-aid, `dissatisfied`/muted for `done`.
- **Stage (density):** `growing` for the active need cards (shows the ask + CTA);
  `seed` for compact list rows; `composted` (20% opacity, crosshatch) for completed.

## Layout & hierarchy

```
┌─ MilestoneNeeds ──────────────────────────────────────────────┐
│  [Progress header]                                            │
│    External help    ▓▓▓▓▓░░  $150 / $400                       │
│                     ▓▓░░░░░  3 / 9 acts                        │
│    Inner work       ▓▓▓░░░░  2 / 5 acts   (separate track)     │
│                                                                │
│  YOUR SUPERPOWER NEEDS YOU  (Tier 1 — matched)                │
│    ┌ CultivationCard (element = superpower color) ───────────┐ │
│    │ [superpower glyph] Connector · External                 │ │
│    │ Title / the translated ask (prompt)                     │ │
│    │ Suggested artifact: warm intro, relationship map        │ │
│    │ Ask: 1 action      [ Claim ]                            │ │
│    └─────────────────────────────────────────────────────────┘│
│    … more matched cards …                                      │
│                                                                │
│  OTHER WAYS TO HELP  (Tier 2 — open aid, collapsed by default) │
│    compact rows (seed stage), neutral altitude                 │
└────────────────────────────────────────────────────────────────┘
```

- **Progress header** consumes `summary: NeedProgress`. Render `external[]` and
  `internal[]` as **labeled groups**, each with one bar per `UnitProgress`
  (`done/total`, formatted by unit: actions → "3 / 9 acts", currency → "$150 / $400",
  hours → "5 / 12 hrs"). Two visually distinct groups ("Help the world" / "Inner
  work") so the polarity reads.
- **Tier 1 section** ("Your superpower needs you" or similar): one `CultivationCard`
  per matched need, element = superpower channel, stage `growing`. Each shows:
  superpower + orientation label, the translated **prompt** (the ask), the
  **suggested artifact**, the **unit ask** (e.g. "1 action", "$50", "2 hrs"), and a
  primary CTA.
- **Tier 2 section** ("Other ways to help"): compact rows (stage `seed`, neutral
  altitude), collapsed/`<details>` by default so it never competes with matched.

## States (per need card)

| Need status | Lens | Render |
|---|---|---|
| `open`, matched | satisfied altitude, superpower color | **[Claim]** CTA |
| `open`, unmatched | neutral altitude | listed under "Other ways to help" |
| `claimed` by me | satisfied, "claimed" badge | **[Mark complete]** CTA + "Release" secondary |
| `claimed` by someone else | neutral, muted | "Someone's on this" — no CTA |
| `done` | composted (20% opacity, crosshatch) | "Complete ✓" — celebratory, no value shown |

Component-level states: **loading** (skeleton on cards via `card-art-window`
shimmer), **empty** ("No open needs right now — check back, or browse the deck"),
**not-signed-in** (browsing works; Claim shows an inline "Sign in to claim" link),
**error** (inline `role="alert"`; never blocks browsing), **pending** (CTA disabled
+ "Working…" during `useTransition`).

## Microcopy (tone: warm, mutual-aid, dignified)

- Tier 1 heading: **"Your superpower needs you"** (or "Ways only a {Superpower} can help").
- Tier 2 heading: **"Other ways to help"**.
- Claim CTA: **"I'll take this"** (not "Assign to me").
- Complete CTA: **"Done — log it"**.
- On complete (no points!): **"That moved the milestone. Thank you."**
- Empty: **"Nothing scoped for you right now. The campaign will surface needs as it grows."**
- Never: points, scores, "+1", rank, "tasks remaining" as a single blended count.

## Accessibility (WCAG 2.1)

- Progress bars: `role="progressbar"` with `aria-valuenow/min/max` and a text label
  ("$150 of $400 raised").
- Each need card: a real `<button>` for the CTA; full keyboard operability; visible
  focus ring; DOM order = visual order.
- Status conveyed by **text + icon**, not color alone (color is the superpower
  channel, not the status signal).
- Mobile-first; cards stack single-column on small screens.

## Props (target API)

```ts
interface MilestoneNeedsProps {
  campaignRef: string
  /** Pre-fetched on the server (RSC) and passed in, or fetched client-side. */
  initial?: { tiered: TieredNeed[]; summary: NeedProgress }
  /** Player's revealed superpower (for the "needs YOU" framing); optional. */
  lens?: { superpower: Superpower; orientation: 'internal' | 'external' | null }
  signedIn?: boolean
}
```

## Out of scope (other tickets)

- The steward authoring UI for needs (T3.5).
- The Mobility Quest campaign seed (T3.1).
- Wiring into the campaign hub page (separate composition step).

## References

- Data/logic (done): `src/lib/superpowers/needs.ts`, `src/actions/milestone-needs.ts`,
  `src/lib/superpowers/translate.ts`, `SUPERPOWER_DEFS` in `src/lib/superpowers/types.ts`.
- Visual: [`UI_COVENANT.md`](../../../UI_COVENANT.md),
  `src/lib/ui/card-tokens.ts`, `src/components/ui/CultivationCard.tsx`.
- Companion surface already built: `src/components/superpowers/SuperpowerReveal.tsx`
  (same token usage — match its visual language).
