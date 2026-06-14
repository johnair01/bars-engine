# Brainstorm + Design — The Milestone BAR (July 18 party)

> Divergent brainstorm → convergent v1. Grounds in existing infra:
> `CampaignMilestone` + `MilestoneContribution` (schema), `CampaignMilestoneStrip`
> (UI), `Instance.goalAmountCents/currentAmountCents`, the DSW donation wizard,
> and the `buildMilestoneSnapshot` guidance path. Event: **July 18, 2026**, Bruised
> Banana venue.

---

## 1. The double meaning (why "Milestone BAR")

It is deliberately two things at once:

- A **progress _bar_** — a fundraising/contribution thermometer that visibly moves.
- A **_BAR_** (the game's core unit) — a compressed artifact with provenance,
  metabolizable into a quest. The milestone is itself a BAR everyone is co-creating.

This is the alchemical move the product is built on: the **transaction** (a real
gift) and the **ritual** (an in-game artifact) are the same act. Every contribution
mints a **plank BAR** that stamps onto the rising structure.

## 2. The governing metaphor: a Barn Raising

A barn raising is a community lifting a structure that no one could raise alone —
exactly the send-off framing. The Milestone BAR **is the barn going up**. Each
contribution is a **plank/beam** added by a named person. The bar doesn't "fill" so
much as the barn **gets built, course by course**, in public, on the 18th.

This metaphor does real work:
- It reframes "donate" as "raise the barn together" (collective, not charity).
- It gives a natural **live-at-the-party** centerpiece (the barn rising in the room).
- It honors the Portland anti-extraction ethos: a barn raising is mutual aid, not a sales funnel.

## 3. What it tracks — the three asks

Per the host: the fundraiser serves **(1) Wendell's move**, **(2) the MtGoA launch**,
**(3) ongoing work** — move first. Structural options:

### Option A — One unified goal, three labeled segments (RECOMMENDED)
A single barn whose **three walls** are Move / Launch / Ongoing. One headline number
(total raised), with three sub-segments showing how the room is distributing intent.
- ✅ One clear "we did it" moment; simplest to grok; matches one `Instance` goal.
- ✅ Contributors can earmark (or not); unallocated flows to Move (the priority).
- ⚠ Needs segment tagging on contributions (a `note`/tag on `MilestoneContribution`).

### Option B — Three separate Milestone BARs (three barns)
Distinct `CampaignMilestone` rows, each with its own target/current.
- ✅ Clean separation; each ask has its own thermometer.
- ⚠ Three bars compete for attention; "are we there yet?" is ambiguous; more UI.

### Option C — One goal, no segmentation (just a total)
Single thermometer, copy names all three asks but tracking is one number.
- ✅ Dead simple, fastest to ship.
- ⚠ Loses the "where is the room putting its energy" story; weakest for stewardship.

**Recommendation: A.** One barn, three walls. Ship as one `CampaignMilestone` with a
segment tag on each contribution; render total + a 3-segment breakdown.

## 4. Contribution → value (money AND in-kind)

The DSW wizard already branches **money / time / space / host**. The barn rises from
all four — not just cash. Mapping ideas:

| Contribution | DSW path | How it adds to the bar |
|---|---|---|
| Money | money | Face value in cents → milestone `value`. |
| Time | time → offer BAR (OBT) | Pledged hours × an honor "time value" → counts as planks (track hours, show $-equiv softly). |
| Space | space → offer BAR | A hosted resource (storage, truck, venue) → fixed "beam" credit + named. |
| Host / labor | host | Show-up labor (packing, driving) → named planks; honor-system value. |

Design tension to resolve: do in-kind pledges move the **same** headline number as
money (one barn) or sit beside it (a "hands" count next to a "$" count)? **Lean:** one
barn, two readouts — **"$ raised"** and **"hands + beams"** — both visibly rising, so
non-cash giving is first-class (respects the Portland gift-economy ethos).

## 5. Game-language layers (optional depth, not required for v1)

- **Wuxing**: money=Metal (value/precision), time=Wood (growth), space=Earth
  (ground/holding), host-labor=Fire (action), witness/share=Water (flow). A fully
  raised barn touches all five — a complete generative cycle.
- **Four moves**: Wake Up (learn the ask) → Clean Up (give honestly) → Grow Up
  (pledge ongoing) → Show Up (be there on the 18th). The bar can light a move as you act.
- **AQAL**: I (personal send-off), We (community barn raising), It (the money/asset),
  Its (the system that continues). The three asks roughly map to We/It/Its with the I
  at the center (Wendell).

## 6. Tiers / unlocks (make it move)

Thresholds that fire something real — momentum without dark-pattern pressure:
- **First plank** — the barn's foundation appears; first contributor named.
- **Walls up (e.g. 33% / 66%)** — unlock a thank-you artifact (a stamped BAR), a
  toast at the party, or a new game cosmetic.
- **Roof on (100%)** — the send-off is funded; a collective "raised" moment + a
  group BAR minted with everyone's provenance stamps.
- **Stretch (>100%)** — extra goes to Launch / Ongoing; a "second barn" appears.

Honor the non-pressure rule (FR3a of PPT): invitational, no countdown shaming.

## 7. UI surfaces (reuse first)

- **`CampaignMilestoneStrip`** — extend it for the event (it already shows a
  fundraising line + guided actions). Add the 3-segment/“hands” readout.
- **`/event`** — the live barn + "raise a plank" (DSW) CTA.
- **`/pricing`** — a compact barn teaser so the public funnel shows the send-off.
- **Live kiosk view** — a `/event/barn` big-screen mode for the 18th that updates as
  contributions land (poll or revalidate; no auth; safe public read).

## 8. Live-at-the-party (the 18th)

- A projected **barn rising** as people contribute in the room (QR → DSW).
- Each new plank shows the giver's name/handle (consent-aware) + their stamp.
- A physical analog: a real plank/banner people sign that mirrors the digital bar.
- Closing beat: when the roof goes on, the room gets a shared moment + the group BAR.

## 9. Non-AI / Portland

Everything above runs with **zero model calls** — it's data + copy + a thermometer.
No AI is needed to raise the barn. (An optional enhancer could draft thank-you copy
later; never required.)

## 10. Reuse map (what already exists)

| Need | Existing |
|---|---|
| The milestone record | `CampaignMilestone` (target/current, proposed→approved) |
| Contributions | `MilestoneContribution` (value, barId, donationRef, note) |
| Money path | DSW `/event/donate/wizard` (money) + honor system |
| In-kind path | OBT offer BARs (time/space) |
| Display | `CampaignMilestoneStrip` + `buildMilestoneSnapshot` |
| Event container | `Instance` (event mode) goal/current cents |

## 11. Open questions (need host input)

1. **Fundraising target ($)** for the headline goal? (sets `targetValue`.)
2. Earmarking: let givers pick Move/Launch/Ongoing, or default all to Move?
3. In-kind: same barn as money, or a parallel "hands" readout? (lean: parallel readout.)
4. Name display consent: show giver names on planks by default, or opt-in?
5. Stretch goal behavior past 100%?
6. Do we want the live **kiosk** (`/event/barn`) for the 18th, or just the strip?

## 12. Recommended v1 (smallest buildable that lands the metaphor)

- One `CampaignMilestone` for the event (Option A; segment via contribution tag).
- DSW money path moves the headline; in-kind (time/space/host) shows as a **named
  "hands & beams"** readout beside the dollars.
- Extend `CampaignMilestoneStrip` with the barn framing + 3-segment + hands readout.
- Surface on `/event` and a compact teaser on `/pricing`.
- Tiers: first plank, walls (33/66%), roof (100%) → group BAR with stamps.
- **Defer** the live `/event/barn` kiosk to a fast-follow once the target + consent
  rules are set.

> Decision needed from host before build: §11 Q1 (target), Q2 (earmark), Q3 (in-kind
> readout), Q4 (name consent). Everything else can proceed.

---

## 13. Round 2 — host interview (2026-06-14): the three walls are three *kinds* of money

The "three walls" sharpened from labels-on-one-dollar to **three distinct transaction
types**, each with different mechanics, obligations, and giver flow. Still **one barn,
three walls** (host confirmed §3 Option A), but each wall's "give" button does the right thing.

| Wall | Kind | Mechanic | Tax-deductible? | Fulfillment |
|---|---|---|---|---|
| **1. Replace the car** | Personal **gift** | Plain ask, fills first | No | None |
| **2. Pre-sale** | **Commerce** | Purchase → owe a product | No | Host fulfills |
| **3. Runway / "non-profit"** | **Recurring patronage** | $/month pledge | Not yet (no fiscal sponsor) | Ongoing access/perks |

### Wall 1 — The car (gift, PRIORITY)
- The exploded car was valued at **$7,000**; this anchors a rough wall target (pending research).
- Host names this the **priority wall** — highest sympathy, gets dollars flowing; should fill first / be most visible. Unallocated gifts default here.
- **ACTION ITEM (research):** reliable replacement car *type + price* in the **Portland, Wichita, and Seattle–Tacoma** areas (host moving between these). Baseline: ~$7k value to match. Output sets Wall 1's `targetValue`.

### Wall 2 — Pre-sale (commerce, "the one that gets $$ flowing")
Five products. **Repo reality (verified):** `src/lib/marketing/products.ts` has only
**Book / Deck / Game** and **no prices** — everything reads "Free." So prices must be
**set**, and the RPG Book + pins must be **added** to the catalog.

**Confirmed prices (host, 2026-06-14):**

| Item | In catalog? | Price |
|---|---|---|
| The Book — *Mastering the Game of Allyship* — digital | ✅ "The Book" | **$15** |
| The Book — physical (pre-order, in hands end of July) | ✅ | **$25** |
| The Roleplaying Game Book — physical | ❌ add | **$49** |
| The Roleplaying Game Book — digital | ❌ add | **$30** |
| The Deck (scene cards) — physical | ✅ "The Deck" | **$30** |
| **Digital access subscription** | — | **$10/mo** → digital book + digital RPG book + Igniting Joy |
| **Founder bundle** | — | **$150 lifetime** → the app + digital versions of all products |
| Allyship enamel pins | ❌ add | **TBD — not yet priced** |

- The **$10/mo digital subscription** is a recurring revenue stream living *inside* Wall 2
  (commerce), distinct from Wall 3's patronage — but worth noting both create monthly $.
- **Igniting Joy** — host referred to it once as "the app/game" and once as "the book";
  **needs disambiguation** (is it the app, a book, or both?) before the catalog is built.

- **Not strictly a pre-sale:** by the party the book may be done; digital items launch
  *ahead* of the 18th. Honest promise on the page: **"book in hands by end of July."**
- **Fulfillment:** host fulfills personally.
- **Tracking:** **dollars AND units** (host: enables **daily player outreach targets** —
  e.g. "to hit N bundles by the 18th, each player reaches out to X people/day").

### Wall 3 — Runway (recurring patronage, NOT a lump sum)
Host framing: *"I need money to stay alive and runway to make that money. Book done →
host more events → sell merch at events → continue the game. Ultimate goal: **$6,000/month**
to cover expenses. It's a **kickstarter for continued giving**."* (Detailed in the
Mastering Allyship non-profit docs.)

- **Natural unit = $/month recurring**, not total raised. Render as **"% of $6k/mo monthly
  runway committed"** or **"N months of runway funded."** The wall that *keeps standing*, not one that finishes.
- **Framing = sustaining member / patron**, not "donor" (honest + warmer for the
  Portland anti-extraction ethos). Tiers e.g. **$6 / $18 / $50 per month**, each naming a perk.
- **No fiscal sponsor yet** → cannot honestly say "tax-deductible." **MVP:** skip the
  501c3 path; **party tickets** (**$30**, in person or digital — confirmed) absorb the
  charitable-flavored giving as a clean transaction.
- **ACTION ITEM (research, non-blocking):** evaluate a **fiscal sponsor / 501c3** so a
  future version of Wall 3 *can* offer tax-deductible giving.

### Scale assumptions (for modeling totals)
- **~50 in person** (safe goal) + a **digital event** + **smaller lead-up events**.
- Combined headline barn = Wall 1 (car) + Wall 2 (pre-sale $) + Wall 3 (first-month runway).

## 14. Updated open questions (post Round 2)

Resolved: §11 Q2 (earmark — givers pick a wall, unallocated → car), Q3 (in-kind — parallel
"hands & beams" readout), Wall 2 prices (§13, confirmed), party ticket ($30, confirmed). Still open:
1. **Enamel pins price** — only Wall 2 item still unpriced.
2. **Igniting Joy** — app vs. book disambiguation (blocks catalog build).
3. **Car research output** → Wall 1 `targetValue` (Portland/Wichita/Seattle–Tacoma research — *in progress*).
4. **Wall 3 monthly tiers + perks** — confirm $6/$18/$50 and what each unlocks.
5. Name-display consent on planks (§11 Q4 — still open).
6. Stretch behavior past each wall's target.
7. **Implementation TODO:** `src/lib/marketing/products.ts` needs price fields, the RPG
   Book + pins added, "The Game" → Igniting Joy rename, and physical/digital variants.
