# Ally Campaign — How To Run It

A step-by-step guide to running a friend or family member through the Mastering
Allyship CYOA and turning what they pick into work you can actually track.

This guide follows **one continuous example** from first setup to a completed
task, using a real person: Wendell's Uncle Ray, who is good with cars, knows
people, and has never once been asked to do anything specific.

- Spec: [`.specify/specs/ally-campaign-cyoa/spec.md`](../.specify/specs/ally-campaign-cyoa/spec.md)
- Content lives in [`src/lib/ally-campaign/`](../src/lib/ally-campaign/) — all of it
  is plain authored data, editable without touching a component.

---

## The idea in one paragraph

Most people who want to help you have no idea what to do, so they say "let me
know if you need anything" and nothing happens. This feature replaces that with a
fifteen-minute walk that ends with them holding **one specific job with a defined
"done."** Along the way they discover their allyship superpower, lose a few myths
about what helping means, and see the actual numbers. They never make an account.
You get a board showing who has what.

---

## Part 0 — One-time setup

### 0.1 Apply the migration

The migration is additive and idempotent. It does not exist in the database yet.

```bash
npm run db:migrate:deploy
```

> ⚠️ Run this from a machine you intend to point at the live database.
> `DATABASE_URL` in this repo is the shared Postgres — there is no separate local
> DB. See [`PRISMA_MIGRATE_STRATEGY.md`](./PRISMA_MIGRATE_STRATEGY.md).

### 0.2 Seed the campaign tree

This creates the parent campaign plus five workstream sub-campaigns, their
milestones, and all 24 needs.

```bash
ALLY_CAMPAIGN_OWNER_EMAIL=wendell@masteringallyship.com npx tsx scripts/seed-ally-campaign.ts
```

**Set that env var.** It decides who owns the campaign, and campaign ownership is
what grants access to the board. Without it the script falls back to a global
admin, and failing that to an arbitrary first player — with a warning. If you skip
it and later get "You do not have steward access to this campaign," this is why.

You should see:

```
✅ parent campaign mobility-quest (instance …)
   owner: Wendell Britt <wendell@masteringallyship.com> (from ALLY_CAMPAIGN_OWNER_EMAIL)
   goal: $9,875

✅ sub-campaign mobility-quest-car  [GATHERING_RESOURCES]
   milestone aq-ms-car: The car, funded (target 2500 currency)
   • aq-car-underwrite          strategist/external  2500 currency  8 vib
   …

✅ Ally Campaign seeded: 1 parent, 5 sub-campaigns, 5 milestones, 24 needs.
```

### 0.3 Record the schema hash

```bash
npm run db:record-schema-hash
```

Skipping this makes `npm run db:sync` fail later with a schema-drift error.

### 0.4 Put your real numbers in

Open [`src/lib/ally-campaign/economics.ts`](../src/lib/ally-campaign/economics.ts).
Everything the site quotes is derived from the `INPUTS` block at the top.

```ts
export const INPUTS: CampaignInputs = {
  carBudgetCents: 2_500_00,      // what the vehicle costs
  carLoanCents:   2_500_00,      // what you're actually asking to borrow
  printUnitCostCents: 6_50,      // ← from a real printer quote
  workshopSeatPriceCents: 150_00,
  …
}
```

**`carLoanCents` is the ask; `carBudgetCents` is the price.** They're separate on
purpose. The repayment schedule is built on the loan, so if you find a car at
$4,000 you raise the budget and leave the loan at $2,500 — the extra is booked as
self-funded and nobody's ask silently inflates.

As you confirm each figure, **delete its key from `UNCONFIRMED`** just above:

```ts
export const UNCONFIRMED = new Set<string>([
  'carBudgetCents',        // ← delete this line once the number is real
  'printUnitCostCents',
  …
])
```

Anything still listed renders on the page with a visible *(estimate)* tag. That
is deliberate — the site says "estimate" out loud rather than implying precision
you don't have. Re-run the seed after editing so the milestone targets match.

---

## Part 1 — Inviting Uncle Ray

### 1.1 Write him a personal opening

Open [`src/lib/ally-campaign/allies.ts`](../src/lib/ally-campaign/allies.ts) and
add an entry to `ALLIES`:

```ts
ray: {
  slug: 'ray',
  displayName: 'Uncle Ray',
  eyebrow: 'a letter, with a game attached',
  opening: `Ray —

You've asked me twice what I actually do for work and both times I gave you an
answer that didn't answer it. Here's the real one, with numbers.

There's a thing in here you're better at than anyone I know, and it isn't money.
Fifteen minutes. "No" is a real ending.`,
  closing: `That's all of it, Ray. Whatever you picked is on my board now.

I'll call Sunday.

— Wendell`,
  cohort: 'family',
},
```

That's the whole registration. `/ally/ray` now exists — no database row, no
deploy-time registry. Ship it and send the link.

> **Read what you wrote.** The `mom` entry in that file was drafted by a machine
> in your voice. It's a competent draft and it is not your sentences. Same applies
> to anything you generate for someone else.

Anyone who visits a slug you haven't defined (`/ally/whoever`) gets
`DEFAULT_INVITE` — a warm, non-presumptuous version. That's the link to put in a
newsletter.

### 1.2 Send it

```
https://masteringallyship.com/ally/ray
```

These pages are `noindex` — they're personal letters, not marketing pages. They
won't show up in search or in a link preview crawl.

---

## Part 2 — What Ray experiences

Ray opens the link on his phone. No login, no email gate, no account.

| Step | What he sees |
|------|--------------|
| **Intro** | Your letter. One button: *Start*. |
| **Superpower** | The 7-superpower quiz plus an inner/outer orientation question. Ray comes out **Connector / external**. |
| **Myths** | Six cards, one at a time. Myth on the front, truth and reframe when he taps *Turn it over*. The one that lands: *"If I write a check, I have done the helping part."* |
| **Understanding** | Three panels — what you actually do, what's genuinely hard right now, and why "let me know if you need anything" has never produced a result. |
| **Domain** | Four allyship domains, each showing its workstreams. Ray picks **Direct Action** because *The Book Tour* is under it. |
| **Workstream** | The tour narrative, the plain ask, and the numbers behind it. |
| **Needs** | Five tasks, **his superpower's first**. Each shows what it costs and what "done" means. He taps *Host an event* and *Find venues that cost nothing*. |
| **Offer** | A free text box: "the thing I didn't think to ask for." Ray writes: *"My buddy runs the Elks lodge, they have a room that seats 40 and they don't charge."* |
| **Sign** | Name and contact, both optional. He puts in his cell. |
| **Done** | Recap of what he took, the vibeulon energy it carries, the full goal numbers, and buttons to buy the book, deck, or a coaching session. |

The needs screen carries an explicit **"None of these are mine →"** styled as a
peer of the main button, not a hidden skip link, with a line underneath saying
taking nothing is a complete answer. The workstream screen can always back out to
a different domain, and every field on the sign screen is optional.

That's not politeness. A soft yes you're quietly counting on in March costs you
more than a clean no today, so the flow is built to make the clean no easy.

**What just got written:** one `CampaignLead` on `mobility-quest-book-tour`, a
claim on `aq-tour-host` and `aq-tour-venue`, and one `CollectiveOffer` about the
Elks lodge. Ray still has no account.

---

## Part 3 — Your side: the board

### 3.1 Open it

Sign in at `/login`, then go to:

```
https://masteringallyship.com/campaign/mobility-quest/allies
```

If you get *"You do not have steward access to this campaign"* — see §0.2. You
need to be a global admin, an owner/steward on the instance, or the campaign's
`createdById`.

### 3.2 Read it

**Where the numbers stand** — allies, tasks taken out of 24, how many have nobody
on them, money pledged, hours pledged, vibeulons pledged vs banked.

Money, hours, and actions are reported **separately and never blended.** There is
no exchange rate between an hour and a dollar, and the engine refuses to invent
one.

**Needs a person** — every open task plus anything flagged `needsHelp` in the
catalogue. This is your "what's stuck" list. Read it first.

**Who's working on what** — one card per ally. Ray's card shows:

```
Uncle Ray                                        Aug 13
[new] [connector] [external] [Direct Action] [book-tour]
(555) 010-4417
│ ◷ Host an event · 1 action
│ ◷ Find venues that cost nothing · 2h
```

`◷` means claimed, `✓` means done.

**Offered, unasked-for** — Ray's Elks lodge note. This is often the most valuable
panel on the page: it's the stuff you didn't know to ask for.

**By workstream** — taken/total per sub-campaign, so you can see at a glance that
the nonprofit has nobody on it while the tour is covered.

### 3.3 Export the spreadsheet

Click **↓ Download the spreadsheet (CSV)**, or:

```
https://masteringallyship.com/api/campaign/mobility-quest/export
```

One flat sheet, opens in Excel, Numbers, or Google Sheets. A `row_type` column
distinguishes `lead` / `task` / `offer`, and every row carries a `dashboard_url`
linking back to that exact card on the live board — so the spreadsheet is a
snapshot that always knows where the current truth lives.

Useful things to do with it: sort by `status` to find stalled tasks, filter
`row_type=task` and `status=open` for your follow-up list, or pivot
`bounty_vibeulons` by `workstream`.

> The export uses your browser session. If you hit that URL from `curl` without
> a session cookie you get a `403`, not a login page — deliberately, because a
> spreadsheet tool silently following a redirect to a login form produces a very
> confusing CSV.

---

## Part 4 — Closing the loop

You call Ray on Sunday. He booked the Elks lodge for the 14th and it's on the
calendar. Mark it:

```
Board → Uncle Ray → "Host an event" → mark done
```

Three things happen:

1. The need flips to `done`.
2. Ray's vibeulon ledger goes up by that task's bounty (8 for hosting).
3. The workstream milestone's progress bar advances by the task's value.

**Only you can mark something done.** Self-attested completion is how a bounty
economy stops meaning anything, so `markNeedDone` is steward-gated. It's one-way
in the UI — un-completing would have to un-bank a bounty and roll a milestone
backwards, which is a real decision, not a button. Fix mistakes in the database.

---

## Part 4.5 — Ray's own page

On the finish screen Ray got a link to **his** page, and it was saved in his
browser:

```
https://masteringallyship.com/ally/mine/<his lead id>
```

There he can:

- see what he's holding, and what he's finished (with vibeulons banked)
- **put a task back down** — one button, no explanation required
- pick up something else, his superpower's matches first
- see what became of his Elks lodge offer

If he comes back to `/ally/ray` later, the intro shows *"You've been here before"*
with a link straight to his page, so losing the bookmark isn't fatal.

**The release button is the point of this page.** Someone who can't hand a task
back either drops it silently — and you find out in March — or avoids the whole
thing. Making it easy to put something down is what makes picking it up feel safe.

> **How the link works.** There is no account, so the unguessable lead id in the
> URL *is* the credential — the same pattern as an order-status link. Anyone Ray
> forwards it to can see and change what he's holding. Because of that the page
> deliberately shows **no contact details**, and it's `noindex`. If that tradeoff
> ever stops being acceptable, the fix is emailed magic links, not accounts.

---

## Part 5 — Running the whole family

The point of §1.1 being three lines of config is that this scales to everyone.

1. Add an `ALLIES` entry per person. Give each a genuinely personal opening —
   the flow's power comes from it not feeling like a form letter.
2. Send each their own link.
3. Watch the board fill in. The `channel` field records which invite they came
   through (`ally:ray`), so you can tell who came from where.

Some patterns worth knowing:

- **Nobody picks the nonprofit.** Expected — it's the least romantic workstream.
  Ask someone directly rather than hoping.
- **Everyone picks money.** Also expected, and it's the myth the second card is
  built to interrupt. If it keeps happening, strengthen that card's copy.
- **Someone leaves an offer and takes no task.** That's a real yes. Offers are
  often better than needs because they're things you didn't know existed.

---

## Editing the content

Everything below is plain data. None of it requires touching a component.

| To change | Edit |
|-----------|------|
| Any dollar figure or count | `economics.ts` → `INPUTS` |
| Which figures show *(estimate)* | `economics.ts` → `UNCONFIRMED` |
| Workstream story, the ask, the tasks | `workstreams.ts` |
| Personal invite letters | `allies.ts` → `ALLIES` |
| The six myths | `allies.ts` → `ALLY_MYTHS` |
| The "who he actually is" panels | `allies.ts` → `UNDERSTANDING` |

**Keep `id` values stable.** Need ids and myth ids are persisted on real leads and
claims. Renaming `aq-tour-host` orphans Ray's claim. Change the `title` and
`detail` freely; leave the `id` alone.

After editing `workstreams.ts` or the `INPUTS`, re-run the seed so the database
matches the file:

```bash
ALLY_CAMPAIGN_OWNER_EMAIL=wendell@masteringallyship.com npx tsx scripts/seed-ally-campaign.ts
```

The seed is idempotent and **preserves `status`, claimants, and milestone
progress** — a copy edit will never wipe Ray's commitment.

To see what the site will actually quote after an `INPUTS` edit — without booting
the app:

```bash
npx tsx scripts/print-ally-economics.ts
```

```
── Capital needed ──
  The car — borrowed                     $2,500
  Print run (500 copies)                 $3,250 (estimate)
  Shipping (300 mailed)                  $1,425 (estimate)
  Ads (3-month test)                     $1,500 (estimate)
  Nonprofit filing + first year          $1,200 (estimate)
  HAS TO EXIST UP FRONT                  $9,875

── …but split by how it comes back ──
  repaid to the lender                   $2,500
  recouped from sales                    $4,675
  genuinely spent                        $2,700  ← the real cost

── Car repayment ──
  workshops needed      1
  books needed          68 (run prints 500) withinCapacity=true
  monthly               $138.89
```

**Read that split before you quote the total.** "$9,875" is a cash-flow
requirement, not a cost — it's how much money has to *exist* before any of it
comes back. Only $2,700 of it actually disappears. Showing the headline alone
turns a $2,500 loan request into what sounds like a $9,875 gift request.

Then check your math still holds:

```bash
npx vitest run src/lib/ally-campaign/__tests__/economics.test.ts
```

34 tests. Among other things they assert the repayment plan doesn't promise more
books than the print run prints — which is a mistake that is very easy to make
and very embarrassing to make in front of your mother.

---

## Adding a sixth workstream

1. Add a `Workstream` to `WORKSTREAMS` in `workstreams.ts`. Pick its domain by the
   **emergent problem** — what's *missing* — not by what the work resembles. The
   four definitions are in
   [`.specify/memory/allyship-domain-definitions.md`](../.specify/memory/allyship-domain-definitions.md).
2. Give it 4–5 needs spanning several superpowers and both orientations, so
   whoever arrives has something matched to them.
3. Use valid card ids: `{WAKE|OPEN|CLEAN|GROW|SHOW}-{GR|RA|DA|SO}-{SHAMAN|CHALLENGER|REGENT|ARCHITECT|DIPLOMAT|SAGE}`.
   The test suite checks this.
4. Re-run the seed. It creates the sub-campaign, milestone, and needs.

Keep inner-orientation bounties in the same range as outer. That's a standing
ruling, not a style preference: it's what stops money from dwarfing inner work on
a board where both are visible.

---

## Troubleshooting

| Symptom | Cause |
|---------|-------|
| "You do not have steward access" | You aren't the campaign's `createdById`. Re-seed with `ALLY_CAMPAIGN_OWNER_EMAIL`, or grant yourself an `admin` role (`scripts/create-admin.ts`). |
| Board is empty after someone finished | Check `campaign_leads.parent_campaign_ref` is `mobility-quest`. The board rolls up on that column. |
| A picked task shows as "already taken" | Working as designed. Claims are conditional on `status='open'`, so two simultaneous submits can't both win. The finish screen names how many were skipped. |
| Figures show *(estimate)* | The key is still in `UNCONFIRMED`. |
| "prisma db push is forbidden" | It is. Hand-author a migration; see [`PRISMA_MIGRATE_STRATEGY.md`](./PRISMA_MIGRATE_STRATEGY.md). |
| `vitest` says "No test files found" | `vitest.config.ts` uses an explicit include allowlist. Add the path. |

---

## What this does not do yet

Being explicit so nobody plans around a feature that isn't there:

- **No payment capture.** Money tasks are *pledges*. The actual transaction happens
  off-platform or through the existing Gumroad offers on the finish screen.
- **No real `Vibulon` rows for accountless allies.** The ledger is an honest
  integer on the lead. Minting happens if and when they claim a `Player`.
- **No UI to shape an offer into a task.** `respondToOffer` exists as an action;
  the form does not. Ray's Elks lodge note has to become a task by you adding one
  to `workstreams.ts`.
- **No email.** Nothing notifies Ray that his task was marked done, or notifies you
  that someone claimed something. You find out by opening the board; he finds out
  by opening his page. For a family-scale campaign that's fine — at 50 allies it
  won't be.
- **No expiry on capability links.** A lead id works forever and can't be rotated.
- **No per-ally sub-campaign spawning.** The schema supports arbitrary nesting via
  `Campaign.parentCampaignId` — if Ray eventually wants to run the Portland tour
  leg as his own branch, the structure is there but nothing drives it yet.
