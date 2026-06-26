# Spec: The Crossing — CYOA Campaign Experience + Steward Dashboard

## Status

Next-pass implementation spec. **Supersedes the experiential layer of**
[`the-crossing-campaign-landing-page`](../the-crossing-campaign-landing-page/spec.md),
whose own non-goals deferred "final visual design" and a "public dashboard of
support BARs". Those deferrals are this spec's body of work.

This spec implements the returned Claude Design package
**"The Crossing — campaign → capture → steward dashboard"**
(`Mastering_the_Game_of_Allyship_Book_5.zip`, handoff `design_handoff_the_crossing/`).
That package is the *answer* to the open questions in the old
[`DESIGN_HANDOFF.md`](../the-crossing-campaign-landing-page/DESIGN_HANDOFF.md):

| Old open question | Resolved by the returned design |
|---|---|
| "all 4 options" meaning | Four **domain gates** organize six role cards (gates first, roles beneath). |
| Rename `Car Person`? | → **Car Expert**. |
| Venmo handle | `venmo.com/u/<handle>`, placeholder `wendell-britt` — **confirm real handle** before launch. |
| Collect contact immediately vs. move-then-save? | **Move-then-save**: capture form needs no account; the move *is* the BAR. |
| `/awaken` double-duty | Split: `/awaken` = book-launch weekend funnel; `/campaign/the-crossing` = car-fund CYOA. Cross-linked. |

## Purpose

Turn "I want to help" into one small, concrete **move** that becomes a **BAR**
(a kernel with provenance) on a steward's board — and give the steward
(Wendell) a real working surface to follow up, watch the car fund fill, mark
the car purchased, and broadcast a thank-you that closes the loop ("a yellow
brick is paved").

The experience is a public-facing **mini BARS Engine**: a supporter picks a
path, makes a move, and the move lands as evidence the campaign follows up on.

**Problem**: today `/campaign/the-crossing` is a form-first support section
rendered through the generic `/campaign/[ref]` landing
(`TheCrossingSupportSection.tsx`). It captures contributions as `CustomBar`s but
has (a) the wrong vibe (form menu, not role selection), (b) no role detail
pages, no capture flow, no confirmation, and (c) **no steward surface at all** —
contributions disappear into a private inbox with no UI to act on them.

**Practice**: Deftness Development — spec kit first, API-first (contract before
UI), deterministic over AI. No language model is on the critical path; the
quest grammar and emotional alchemy work with or without one (dual-track
awareness). Reuse the existing card primitive, tokens, roles lib, and capture
action rather than reinventing data shapes.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Persistence** | **Reuse `CustomBar`** (user-selected). A contribution is a `CustomBar` with `campaignRef='the-crossing'`, `evidenceKind='support_intake'`. New fields (channel, amount, status machine, notes[], notified) live in the **`contextLines` JSON**, not new columns. **No Prisma migration.** |
| **Routing** | Dedicated static route tree under `src/app/campaign/the-crossing/` (a literal segment outranks the `[ref]` catch-all in Next.js). Replaces the query-string handoff (`?role=&go=`) of the prototype with real routes. |
| **Role naming** | `car_person` → **`car_expert`** (id + label). Migrate existing records' role key on read (back-compat shim) — see NFR. |
| **Element on roles** | Add `element: ElementKey` to each role (Earth/Wood/Metal/Fire) so the three-channel encoding (element=color) flows everywhere the role appears. Derive all color from `ELEMENT_TOKENS` — never hardcode hex. |
| **Capture = no account** | The capture form creates a real persisted BAR with **no auth**. Account creation and BAR-claiming are post-hoc upsells (mocked CTAs → real auth later). |
| **Steward dashboard** | Real **authenticated** route. Reads `CustomBar`s by `campaignRef`+`evidenceKind`; status transitions are **server actions** that rewrite `contextLines`. Authorization reuses the campaign steward check. |
| **Status machine** | Lives in `contextLines.status`: `new → contacted → accepted｜declined`, terminal `thanked`. Donor submissions start `accepted`. Broadcast sets everyone except `declined` to `thanked` + `notified=true`. |
| **Fund total** | `raised = base ($3,225) + Σ donor amounts`; goal `$4,800`. Stand-in ledger derived at query time. Constants centralized, not literal-scattered. |
| **Message transport** | **Mocked in-app** for v1: "Log message" appends to `notes[]`; broadcast flips status/notified and renders the loop-closed screen. Real text/email/IG/Signal/Venmo transport is a later phase (§ Non-Goals / What is mocked). |
| **Donations** | Donor primary CTA = Venmo deep link (placeholder handle) **and** an in-app "offer another resource" capture path. No payment processor rewrite. |
| **AllyshipCard** | Render deck moves with the existing `CultivationCard` primitive + `card-tokens` — do **not** port `AllyshipCard.dc.html` literally. Map prototype card props onto real deck-move data (the `starterCardIds` already on each role). |
| **Verification** | Ships behind a verification quest (`cert-the-crossing-experience-v1`) framed toward the Bruised Banana / barn-raising fundraiser. |

## Conceptual Model (WHO / WHAT / WHERE / Energy / Throughput)

| Dimension | Mapping |
|-----------|---------|
| **WHO** | Supporter (unauthenticated, community member) · Steward (Wendell — authenticated owner of `the-crossing` / `mtgoa-barn-raising`). Role element drives card color. |
| **WHAT** | A **contribution** = a `CustomBar` (the move-as-evidence). Six roles each mint a typed artifact (listing lead, warm intro, contribution, listing review, signal boost, encouragement note). |
| **WHERE** | Allyship domains as **domain gates**: Gather Resources (Earth), Skillful Organizing (Wood), Raise Awareness (Metal), Direct Action (Fire). The campaign field is `the-crossing`, child of `mtgoa-barn-raising`. |
| **Energy** | Emotional energy → one concrete move → fuel for the car fund. "Every move became evidence." Closing the loop paves "a yellow brick." |
| **Throughput** | **Show Up** is the dominant move (`moveType='show_up'`); roles also touch Wake Up (notice a lead), Open Up (offer a resource). |

### Campaign lineage (unchanged — load-bearing)

Every contribution BAR MUST carry:

```text
campaignRef:     the-crossing
parentCampaignRef: mtgoa-barn-raising
campaignLineage: [mtgoa-barn-raising, the-crossing]
```

## The continuous loop (what connects the screens)

```
/campaign/the-crossing                     (00–01  hero + choose-a-path gates/accordion)
      │  role card → "<action> →"
      ▼
/campaign/the-crossing/role/<roleId>       (02–03  role detail + deck cards)   ── soft fallback → /superpower
      │  "Do this now" / "<action> →"
      ▼
/campaign/the-crossing/move/<roleId>       (06–07  capture — no account)
      │  submit (server action → CustomBar)
      ▼
/campaign/the-crossing/move/<roleId>/saved (08  "Saved as a BAR" + next steps)
      │  "See where it lands · Steward view →"
      ▼
/campaign/the-crossing/steward             (09–13  dashboard → contributor → mark purchased → broadcast → loop closed)
```

Cross-links: campaign footer → `/awaken`; role-page fallback → `/superpower`;
"pick another path" → `/campaign/the-crossing#paths`.

## API Contracts (API-First)

All are **Server Actions** (`'use server'`) — form submissions + React
transitions, returning `{ success, error?, data? }` or `redirect()`. None are
external/webhook surfaces, so no Route Handlers.

### 1. `submitTheCrossingMove` (extends existing `submitTheCrossingSupport`)

**Input** (`FormData`): `role`, `name`, `contact`, `channel`
(`text｜email｜instagram｜signal｜venmo`), `offerSummary`, `details?`,
`amount?` (donor-only, numeric), `url?` (honeypot).
**Output**: creates a `CustomBar`; `redirect()` → `…/move/<role>/saved?bar=<id>`.

```ts
function submitTheCrossingMove(formData: FormData): Promise<never /* redirect */>
```

Persisted shape (reuse — see § Data Contract). Validation: `name && contact &&
offerSummary` non-empty (trimmed). `amount = parseFloat(digits)`; optional.
Initial `status` = `accepted` for donor, else `new`.

### 2. `stewardTransitionContribution`

**Input**: `{ barId, action: 'log_message' | 'mark_contacted' | 'accept' | 'decline', message? }`
**Output**: `{ success, error? }`; rewrites `contextLines.status` + appends to
`contextLines.notes[]`. `log_message` requires non-empty `message`, appends
`You: "…"` to notes and advances `new → contacted`.

```ts
function stewardTransitionContribution(input: TransitionInput): Promise<ActionResult>
```

Authorization: caller must be the campaign steward (reuse
`assertCanEditInstanceDonation` / steward resolution).

### 3. `stewardMarkCarPurchased`

**Input**: `{ campaignRef }` → **Output**: sets campaign-level `carPurchased`
flag (see § Campaign state). Reveals the thank-you path.

### 4. `stewardBroadcastThankYou`

**Input**: `{ campaignRef, message }` → **Output**: for every contribution not
`declined`, sets `status='thanked'`, `notified=true`. Returns recipient count.
Renders loop-closed screen. (v1 transport mocked — see § What is mocked.)

> Campaign-level state (`carPurchased`, `thanked`, fund base/goal): persist on
> the `the-crossing` campaign/instance record (a small JSON on the campaign, or
> a dedicated steward-owned "campaign state" `CustomBar` singleton). **Decide in
> plan.md** — must not require a migration.

## User Stories

### P1: Choose a path (supporter)

**As a supporter**, I want to pick the way I can actually help, so helping feels
like choosing a role, not filling a form.

**Acceptance**:
- `/campaign/the-crossing` renders hero (H1 "The Crossing", subhead, two CTAs,
  top-right "Book-launch weekend →" → `/awaken`).
- Roles are grouped under four **domain gates** (sigil + tinted label + blurb);
  one accordion panel open at a time; honors `prefers-reduced-motion`.
- Each role card shows name, tiny-move, element-tinted glyph, EXPLORE/GIVE.
- Works on mobile: no horizontal scroll, no overflow, single-column.

### P2: Enter a role & make a move

**As a supporter**, I want a dedicated role page and a no-account capture, so I
can make one small concrete move.

**Acceptance**:
- `/campaign/the-crossing/role/<roleId>` renders header card (element-tinted),
  "Do this now", "Why it matters" (impact + boundary line), "Moves you can
  make", two deck cards (real `CultivationCard`), and a `/superpower` soft
  fallback.
- Capture (`…/move/<roleId>`) shows the right fields (donor adds Amount), submit
  disabled until `name && contact && offer`; hint line flips on validity.
- Submit creates a `CustomBar` with full lineage + new fields; **no sign-in**.
- `…/saved` confirms with a mini BAR card (deck code, NEW BAR pill, summary,
  role·domain) + next-step CTAs.

### P3: Steward the board (Wendell)

**As the steward**, I want every BAR to land on my board with follow-up state,
so care doesn't vanish into DMs.

**Acceptance**:
- `/campaign/the-crossing/steward` is **auth-gated** to the steward.
- Stat row (Contributions / Needs follow-up / People in the field), amber
  **car-fund** card (`$raised of $4,800`, %·leads, progress bar), filter chips
  with counts, contribution list (element accent rule, name+role+New pill,
  `new` sorts to top), click → contributor detail.
- Contributor page: offering, reach-via, amount (donor), activity log, and a
  **Follow up** panel whose actions (Log message / Mark contacted / Accept /
  Not needed) appear conditionally by status and drive the status machine.

### P4: Close the loop

**As the steward**, I want to mark the car purchased and thank every
contributor in one move, so the campaign visibly completes.

**Acceptance**:
- "Mark the car as purchased →" flips the fund card green ("CAR SECURED").
- "Thank your contributors →" → broadcast screen: recipient chip per
  contributor (name + channel) + editable prefilled message.
- Send → every non-declined contribution becomes `thanked`/`notified`; the
  loop-closed screen renders ("A yellow brick is paved. You let N contributors
  know…").

### P5: Verification quest

**As a tester**, I want a Twine quest that walks the whole loop, so completing
it mints evidence the experience works (framed toward the barn-raising).

## Functional Requirements

### Phase 0 — Role model & tokens (foundational)
- **FR0.1**: Rename `car_person` → `car_expert` in
  `the-crossing-support-moves.ts` (id, label "Car Expert"); add `element`
  (Earth/Wood/Metal/Fire per README table) and `channelOptions`/donor flag.
- **FR0.2**: Centralize fund constants (`FUND_GOAL=4800`, `FUND_BASE=3225`) and
  the Venmo handle placeholder in the roles lib (single source of truth).
- **FR0.3**: Back-compat: `getTheCrossingSupportRole('car_person')` still
  resolves to Car Expert (alias map) so historical BARs render.

### Phase 1 — Supporter: landing (screens 00–01)
- **FR1.1**: Dedicated `src/app/campaign/the-crossing/page.tsx` (hero + story
  preview + "How To Play" strip + domain gates + accordion role cards +
  `/awaken` & `/superpower` cross-links).
- **FR1.2**: Domain gates render in README order; element color from tokens.
- **FR1.3**: Accordion: one open at a time, mounts panel (do not leave at
  opacity 0), `prefers-reduced-motion` honored. Each panel: description,
  Tiny move/Creates/Why grid, deck-move chips, a starter deck card, two CTAs
  (both route into the flow; Donor primary = Send Venmo).
- **FR1.4**: The old `[ref]`-rendered `TheCrossingSupportSection` is removed
  from the landing (or redirects) once the dedicated route is live — no double
  surface.

### Phase 2 — Supporter: role detail + deck cards (screens 02–05)
- **FR2.1**: `…/role/<roleId>/page.tsx`, one prop-driven component for all six.
- **FR2.2**: Renders header card, Do-this-now, Why-it-matters (impact +
  boundary on a left rule), Moves-you-can-make, two `CultivationCard`s built
  from `role.starterCardIds`, account upsell card, `/superpower` fallback.
- **FR2.3**: Primary CTA → `…/move/<roleId>`; Donor primary → Venmo.

### Phase 3 — Supporter: capture + saved (screens 06–08)
- **FR3.1**: `…/move/<roleId>/page.tsx` capture form per § API Contract 1;
  fields, donor-only Amount, sticky submit, validity hint.
- **FR3.2**: `submitTheCrossingMove` creates the BAR (extends existing action;
  add `channel`, `amount`, initial `status`, `notes:[]`, `notified:false`).
- **FR3.3**: `…/move/<roleId>/saved/page.tsx` confirmation: green check, mini
  BAR card, three CTAs (account upsell, steward view, pick another path).

### Phase 4 — Steward dashboard (screens 09–10)
- **FR4.1**: `…/steward/page.tsx`, auth-gated to steward; reads contributions
  via `db.customBar.findMany({ where: { campaignRef, evidenceKind } })`, parses
  `contextLines`.
- **FR4.2**: Stat row, amber car-fund card (derived raised/%/leads), filter
  chips (All / Needs follow-up / Leads / Intros / Awareness / Care / Donations)
  with counts; `new` sorts to top.
- **FR4.3**: `…/steward/contributor/<barId>/page.tsx` + the four transition
  actions (§ API Contract 2), conditional by status; activity log from notes[].

### Phase 5 — Close the loop (screens 11–13)
- **FR5.1**: `stewardMarkCarPurchased` + green "CAR SECURED" fund-card state.
- **FR5.2**: `…/steward/thank-you` broadcast screen + `stewardBroadcastThankYou`
  (§ API Contracts 3–4); loop-closed screen with paved-brick animation
  (reduced-motion safe).

### Phase 6 — Verification quest
- **FR6.1**: `cert-the-crossing-experience-v1` Twine + seed script + npm script
  (`seed:cert:the-crossing`), framed toward the barn-raising fundraiser.

## Non-Functional Requirements

- **No Prisma migration.** All new contribution fields live in `contextLines`
  JSON; campaign state likewise (no new columns). Verified by `npm run check`
  (no schema diff).
- **Back-compat**: existing `the-crossing` BARs (role `car_person`, no
  `status`/`channel`) render and default sanely (`status ??= 'new'`,
  `channel ??= 'text'`).
- **Resilience**: `/campaign/the-crossing` renders even if no campaign record
  exists (static fallback, as today). Steward route requires auth + steward.
- **Mobile-first**: single-column, content ≤620–680px, capture 560px, dashboard
  840px; no horizontal scroll (primary share surface is FB/IG mobile).
- **Color discipline**: all element color from `card-tokens`; purple reserved
  for action/account/close-the-loop, never an element. Status colors per README.
- **Accessibility**: `prefers-reduced-motion` for accordion fade, card idle
  float, paved-brick animation, and press-shrink.
- **Security**: capture is unauthenticated by design — keep the honeypot `url`
  field; sanitize/trim/cap lengths (existing `clean()` helper). Steward actions
  re-check authorization server-side, never trust client state.

## Persisted data & Prisma

**No schema change.** This spec deliberately reuses `CustomBar`.

| Check | Done |
|-------|------|
| Prisma models/enums/fields named in Design Decisions | N/A — no new fields |
| `tasks.md` includes migration task | **No migration** — explicitly out of scope |
| Verification: `npm run check` confirms no `schema.prisma` diff | ✅ task included |
| Human glanced at migration.sql | N/A |

### Data Contract (contribution = `CustomBar`)

```ts
// created by submitTheCrossingMove (extends submitTheCrossingSupport)
{
  creatorId: stewardPlayerId,            // admin owner (unauth public submit)
  title: `[${roleLabel}] ${offerSummary}`,
  description: details || offerSummary,
  type: 'vibe', reward: 0, visibility: 'private', status: 'active',
  campaignRef: 'the-crossing',
  allyshipDomain: role.primaryDomain,
  moveType: 'show_up',
  evidenceKind: 'support_intake',
  contextLines: JSON.stringify({
    contributorName, contributorContact,
    channel,                              // NEW: text|email|instagram|signal|venmo
    role: role.id, roleLabel: role.label,
    offerSummary, detail, url,
    amount,                               // NEW: number|null (donor)
    status,                               // NEW: new|contacted|accepted|declined|thanked
    notified,                             // NEW: boolean
    notes: [],                            // NEW: string[] activity log
    createdAt,                            // ISO
  }),
  docQuestMetadata: JSON.stringify({ source, parentCampaignRef, campaignLineage,
                                     artifact, tinyMove, starterCardIds, element }),
  agentMetadata: JSON.stringify({ sourceType: 'campaign_support_intake', campaignRef, parentCampaignRef }),
}
```

### Derived (computed at steward query time, not stored)

- `raised = FUND_BASE + Σ amount where role==donor`
- `pctToGoal = raised / FUND_GOAL`
- `uniquePeople = distinct contributorName`
- `pending = count(status=='new')`
- `recipients = unique-by-name where status != 'declined'`

### Steward resolution (unchanged)

Env `THE_CROSSING_STEWARD_PLAYER_ID` → `the-crossing` `createdById` →
`mtgoa-barn-raising` `createdById` → owner/steward membership → first player.
Contributor identity always preserved in `contextLines`.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Filesystem | None — no uploads. |
| AI calls | None on critical path (dual-track; deterministic). |
| Request body | Capture payload is small; existing `clean()` caps lengths. |
| Env | `THE_CROSSING_STEWARD_PLAYER_ID` (exists); document Venmo handle + fund constants in spec. Add to `docs/ENV_AND_VERCEL.md` if a real handle env is added. |

## Verification Quest (required — UX feature)

- **ID**: `cert-the-crossing-experience-v1`
- **Steps** (one Twine passage each; final passage has no link → minting the
  reward proves completion):
  1. Open `/campaign/the-crossing`; open a domain gate's role accordion.
  2. Enter a role detail page; confirm two deck cards + Superpower fallback.
  3. Make a move (capture) without an account; reach the "Saved as a BAR" screen.
  4. Open the steward dashboard; find the new contribution at the top (`new`).
  5. Log a message → status advances to `contacted`.
  6. Mark the car purchased; broadcast the thank-you; reach "A yellow brick is
     paved."
- **Framing**: "Confirm The Crossing so the community can help raise the barn —
  every verified move is a brick toward the residency."
- **Structure**: `TwineStory` + `CustomBar` `{ isSystem: true, visibility:
  'public', id: 'cert-the-crossing-experience-v1' }`, idempotent seed.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/),
  [scripts/seed-cyoa-certification-quests.ts](../../../scripts/seed-cyoa-certification-quests.ts).

## Non-Goals / What is mocked (decide real impl later)

- **Account / auth & BAR-claiming** — upsell CTAs are placeholders → real auth later.
- **Message transport** — "Log message" + broadcast are in-app only in v1; real
  text/email/IG/Signal/Venmo or a notifications service is a later phase.
- **Donations** — Venmo deep link (placeholder `wendell-britt`) + in-app "offer
  another resource"; no payment processor. **Confirm real handle.**
- **Fund ledger** — `base + Σ donor amounts` is a stand-in, not a real ledger.
- **Seed data** — prototype's 10 samples are illustrative; the live board reads
  real submissions.
- No new Prisma tables/columns.

## Dependencies

- [`the-crossing-campaign-landing-page`](../the-crossing-campaign-landing-page/)
  (the MVP this supersedes; reuses its roles lib + capture action + steward
  resolution).
- [`allyship-deck`](../allyship-deck/) / `CultivationCard` for deck cards.
- [`cyoa-certification-quests`](../cyoa-certification-quests/) for the
  verification-quest pattern.

## References

- Design package: `design_handoff_the_crossing/` (README.md + `design_files/*.dc.html`
  + `screens/*.png`) — recreate, do not ship the HTML.
- Code: `src/lib/the-crossing-support-moves.ts`,
  `src/actions/the-crossing-support.ts`,
  `src/app/campaign/[ref]/TheCrossingSupportSection.tsx`,
  `src/lib/ui/card-tokens.ts`, `src/components/ui/CultivationCard.tsx`,
  `src/styles/cultivation-cards.css`.
- Tokens & covenant: `UI_COVENANT.md`, `src/lib/ui/card-tokens.ts`.
- Prisma workflow: [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md),
  [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
</content>
