# Spec: Ally Campaign CYOA

## Purpose

Stand up a **warm, named CYOA** (`/ally/[slug]`) that walks someone who *loves the
founder* through the Mastering Allyship framework — superpower, myths,
understanding the person, domains — and lands them holding a **specific, scoped
piece of the campaign**, without ever creating an account.

The first reader is Wendell's mother. The generalization is the point: the same
flow, with a different `slug`, runs any friend or family member through the same
walk and lets them choose how they want to support the movement.

**Problem**: The engine already has every instrument this needs — a superpower
quiz, a myths quiz, allyship domains, `CampaignLead`, `CampaignMilestone` /
`MilestoneNeed`, sub-campaigns via `Campaign.parentCampaignId`. What it did not
have was (a) authored content tying real money to real asks, (b) a seam for
**accountless** participation, and (c) a steward view answering "who is working on
what, and who needs help."

**Practice**: Deterministic over AI — the entire flow runs with no language model.
Content is authored data in `src/lib/ally-campaign/*`; the routes are shells.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Reuse, don't rebuild** | `SuperpowerQuiz` and the domain/lead primitives are reused as-is. No new quiz, no new engine. |
| **Accountless identity = `CampaignLead`** | A lead already exists without a `Player`. It becomes the identity for claims (`MilestoneNeed.claimedByLeadId`), offers (`CollectiveOffer.leadId`), and the vibeulon ledger (`CampaignLead.vibeulonsEarned`). |
| **Each workstream is a real sub-campaign** | The five workstreams are child `Campaign` rows under `mobility-quest` via `parentCampaignId`, keyed by the domain whose *emergent problem* they are. Nesting deeper is free. |
| **Domain by emergent problem, not by resemblance** | Per `allyship-domain-definitions.md`: the print run is Gathering Resources because the material form is missing; the nonprofit is Skillful Organizing because no structure exists; the tour is Direct Action because nobody is booking rooms. |
| **All numbers derive from one input block** | `economics.ts` holds the inputs; every quoted figure is derived. Unconfirmed inputs are listed in `UNCONFIRMED` and render with a visible "estimate" flag. Money is cents, never floats. |
| **Books cost at the blended margin** | Repayment counts books at the run's blended margin, not the better hand-to-hand event margin — using the event margin assumes every repayment copy sells in person, which the run cannot supply. `withinCapacity` surfaces the shortfall rather than hiding it. |
| **Bounties are energy, not price** | `MilestoneNeed.bountyVibeulons` carries the same range for internal and external orientation, so money can never dwarf inner work (Six Faces ruling, carried from `mobility-quest-superpower-campaign`). Units are reported separately and never blended. |
| **Offers are first-class and unshaped** | `CollectiveOffer` is the counterpart to a need: a need is a steward-shaped ask, an offer is raw material the community hands the steward. `GameboardAidOffer` could not serve — it requires three `Player` FKs. |
| **Declining is a peer of accepting** | Every ask screen carries a real "not this one." A soft yes costs more than a clean no; the UI says so in as many words. |
| **Completion is steward-attested** | `markNeedDone` is steward-gated. Self-attested completion makes a bounty economy meaningless. |
| **Warm pages are `noindex`** | `/ally/*` carries `robots: { index: false }`. These are personal letters, not marketing pages. |

## Conceptual Model

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | An accountless ally (`CampaignLead`) + their revealed superpower/orientation |
| **WHAT** | `MilestoneNeed` — simultaneously a quest and a contribution |
| **WHERE** | The `mobility-quest` tree: parent + five workstream sub-campaigns across all four domains |
| **Energy** | `bountyVibeulons`, pledged on claim and banked on steward-confirmed completion |
| **Personal throughput** | The 5 WAVE moves via each need's `cardId`; `orientation` is the inner/outer aspect |

### The five workstreams

| Workstream | Domain | Emergent problem |
|------------|--------|------------------|
| The Car | GATHERING_RESOURCES | The resource that lets the work move isn't here |
| 500 Copies | GATHERING_RESOURCES | The book exists as a file; a file can't be signed |
| The Dream 100 | RAISE_AWARENESS | Everything is buyable today; nobody knows it exists |
| The Nonprofit | SKILLFUL_ORGANIZING | No vessel can hold a grant or outlive the founder |
| The Book Tour | DIRECT_ACTION | Rooms need booking and nobody is booking them |

## Flow

```
/ally/mom
  intro (personal letter)
  → superpower  (SuperpowerQuiz — 7 superpowers + orientation)
  → myths       (6 myths specific to loving the person you're helping)
  → understanding (3 panels: what he does / what's actually hard / what help looks like)
  → domain      (4 allyship domains, by emergent problem)
  → workstream  (narrative + the ask + the numbers)
  → needs       (multi-select, superpower-matched first, each with cost + "done")
  → offer       (optional: the thing he didn't think to ask for)
  → sign        (name + contact, all optional)
  → done        (recap + full goal numbers + buy book/deck/coaching)
```

Result: one `CampaignLead` on the workstream sub-campaign, conditional claims on
each chosen `MilestoneNeed`, and an optional `CollectiveOffer`.

## Surfaces

| Route | Access | Purpose |
|-------|--------|---------|
| `/ally/[slug]` | public, no auth | The warm CYOA |
| `/campaign/mobility-quest/allies` | steward | Who's on what, who needs help, goal numbers |
| `/api/campaign/mobility-quest/export` | steward | Flat CSV of leads + tasks + offers, each row linking back to the dashboard |

## Schema (additive, one migration)

`20260811120000_add_ally_campaign_accountless` — no drops, no backfill, idempotent.

- `milestone_needs.claimed_by_lead_id` (FK → `campaign_leads`, `ON DELETE SET NULL`)
- `milestone_needs.bounty_vibeulons` (int, default 0)
- `campaign_leads.parent_campaign_ref` (text) — one-query rollup across the tree
- `campaign_leads.vibeulons_earned` (int, default 0)
- `collective_offers` (new table)

## Non-goals (this phase)

- Minting real `Vibulon` rows for accountless allies. The ledger is an honest
  integer on the lead; minting happens if and when they claim a `Player`.
- Steward UI for *shaping* an offer into a need (`respondToOffer` exists; the
  shaping form does not).
- Payment capture. Money asks are pledges; the actual transaction happens
  off-platform or through the existing Gumroad offers.
- Per-ally sub-campaign spawning (a friend getting their *own* branch under a
  workstream). The schema supports it; no UI drives it yet.

## Open items (Wendell)

1. **Every `TODO(wendell)` in `economics.ts`** — car budget, print/ship unit costs,
   workshop seat price and realistic fill, ad budget, nonprofit filing. Until these
   land the site renders them flagged as estimates.
2. **Read `allies.ts` end to end before sending `/ally/mom`.** The opening and
   closing are machine-drafted personal writing in Wendell's voice. They are a
   competent draft and they are not his sentences.
3. **Confirm "a run of $500" meant 500 copies**, which is how it is encoded.

## Verification

- `src/lib/ally-campaign/__tests__/economics.test.ts` — 34 tests covering the
  money math, catalogue integrity (unique ids, valid card ids, all four domains,
  all three units, inner/outer parity), and the "never a dead end" property of
  `needsForSuperpower`.
- Repo-wide `tsc --noEmit` clean.
