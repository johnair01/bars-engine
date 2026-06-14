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
- ✅ **RESEARCH DONE** → see [`car-replacement-research.md`](./car-replacement-research.md).
  Picks: **2014–2015 Toyota Corolla** (top), Honda Civic / Mazda3, CR-V/Camry. Hard-avoid
  Nissan CVT + Ford PowerShift. Cheapest to acquire = **Portland** (no sales tax, ~$400 over
  sticker) vs. Seattle (~$760–950) and Wichita (~$575 + annual property tax).
- ✅ **Wall 1 `targetValue` = $8,500 (CONFIRMED by host)** — ≈$7k car + ~$600 tax/title/reg
  + ~$600 PPI & first maintenance + ~$300 contingency.

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
| **Igniting Joy** — a separate digital-only book | ❌ add | bundled (no standalone price) — included with the App |
| **The App** — *bars-engine Mastering Allyship* subscription | ✅ "The Game" | **$10/mo** → the app + digital book + digital RPG book + Igniting Joy |
| **Founder bundle** | — | **$150 lifetime** → the app + digital versions of all products |
| Allyship enamel pins | ❌ add | **$15** |

- **Product taxonomy (clarified by host):** *The App* is the **bars-engine Mastering
  Allyship app** (the catalog's "The Game" entry = the playable engine inside it). The
  **$10/mo subscription** unlocks the app and bundles the **digital book, digital RPG book,
  and Igniting Joy**. **Igniting Joy** is **another book the host wrote** — **digital-only**,
  not sold standalone, **included automatically with app signup**.
- The $10/mo subscription is a recurring revenue stream living *inside* Wall 2 (commerce),
  distinct from Wall 3's patronage — but both create monthly $.

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
  Portland anti-extraction ethos). One-time gifts mint a **plank**; recurring patrons are
  the **standing frame that keeps the barn up** — hence load-bearing tier names.

**Tier ladder (v1 — host to confirm perks + party sub-goal):**

| Tier | $/mo | Perks (each tier includes all below it) |
|---|---|---|
| **Raftermate** | **$6** | Name on the digital barn wall (consent-aware); monthly patron dispatch; a stamped **patron BAR** (in-game artifact, $0 to make) |
| **Beam** | **$18** | + **The App included** ($10/mo value baked in) + early access to event tickets |
| **Post** | **$50** | + a **voice/vote in what gets built or written next** + name read aloud at events + **quarterly patron group call** |
| **Keystone** | **$100** | + **founding member of the Allyship Dojo** (live group classes + rank progression) + name on the physical barn banner + comped event tickets |
| **Name your own** | custom | honor-system; flows straight to runway |

- **Perk design rule:** recognition + access + community only — nothing that costs the
  solo host money or heavy labor, and **no Wall 2 sellable products given away** (keeps
  commerce intact). The **App bundles at Beam** so a $10/mo subscriber upgrades to $18/mo
  patronage for +$8 — product and patronage reinforce, not compete.

**The Allyship Dojo (the Keystone offer):** a live, game-native practice circle — the
**real-world instantiation of a School aboard the School Ship** (reuses the RPG's existing
*Schools* + *Schools-and-Ranks advancement*). Keystone patrons are its **founding students**
and **earn ranks** as they practice. Patron profile: DEI practitioners, coaches, therapists,
facilitators, educators, People/HR leaders, managers (pro-development buyers for whom
$100/mo undercuts coaching/courses), plus mission-aligned professionals. What they expect:
real access to the host, genuine skill growth + feedback, peers at their level, and to feel
their money sustains the mission. Design for **easy + joyful + sustainable** fulfillment:
  1. **Run on the product's rails** — each session works a **Deck** scene or **App**
     encounter; prep ≈ zero, and sessions become playtest data + recordings → app/book
     content (fulfillment *feeds* development — generative dependency).
  2. **Members bring real roadblocks** → metabolized live into BARs / Roadblock Quests
     (composting their material, not generating new content).
  3. **One repeatable ritual** — open → scene → practice → metabolize → close (muscle memory, no fresh prep).
  4. **Cadence: MONTHLY (90 min) live as the sustainable v1; WEEKLY as a labeled stretch**
     once a cohort can co-hold it. (Avoid promising weekly solo from day one — "speed is honest.")
  5. **Founding-cohort identity** — named in app/book credits + a permanent provenance BAR ($0 to give, high meaning).
  - The lighter **quarterly group call** lives at the **$50 Post** tier so the ladder steps up cleanly.
- **Readout = "% of $6,000/mo monthly runway committed."** $6k/mo is the **horizon**, not
  the party-night ask.
- **Party-night Wall 3 sub-goal (recommended): $1,500/mo = 25% of runway.** Reachable mix
  with ~50 in-person + digital: 20 Raftermate ($120) + 25 Beam ($450) + 12 Post ($600) +
  3 Keystone ($300) = **$1,470/mo**. Gives the room a winnable "first quarter of the roof" moment.
- **No fiscal sponsor yet** → cannot honestly say "tax-deductible." **MVP:** skip the
  501c3 path; **party tickets** (**$30**, in person or digital — confirmed) absorb the
  charitable-flavored giving as a clean transaction.
- **ACTION ITEM (research, non-blocking):** evaluate a **fiscal sponsor / 501c3** so a
  future version of Wall 3 *can* offer tax-deductible giving.

### Completion & overflow behavior (all walls) — "the wall is up, keep building"

Decided by host. A filled wall is **not a dead end** — it redirects energy (honors the
anti-extraction ethos: mutual aid + participation, never "close the register"):

- **Default overflow:** extra dollars on a filled wall roll to **Wall 3 runway** (the
  never-finished wall). Wall 3 absorbs all surplus.
- **On any wall completing, surface a "keep building" panel** with, in order:
  1. **Cross-wall** — point to any wall not yet full (finish the barn).
  2. **Purchases (Wall 2)** — invite donors to *buy* (book / deck / RPG book / App /
     Founder bundle); convert generosity into product adoption.
  3. **In-kind (hands & beams)** — donate **time + expertise + task help**: get the book
     done, support the non-profit. Maps to DSW time/host paths + OBT offer BARs (§4).
  4. **Access check** — make sure they can reach the other walls' offerings (claim the App,
     grab their bundle, get into the Dojo).
- This makes every completion a **"what's next" engine**, and maps cleanly to the four
  moves: Clean Up (give) → Grow Up (pledge/buy/offer skill) → Show Up (do a task / be there).

### Name-display consent (resolves §11 Q4)
- **Opt-in.** Giver names appear on planks/the barn wall **only if they choose**; default is
  anonymous/handle-less. (Portland anti-extraction ethos — no one is surfaced without consent.)

### Scale assumptions (for modeling totals)
- **~50 in person** (safe goal) + a **digital event** + **smaller lead-up events**.
- Combined headline barn = Wall 1 (car) + Wall 2 (pre-sale $) + Wall 3 (first-month runway).

## 14. Updated open questions (post Round 2)

Resolved: §11 Q2 (earmark), Q3 (in-kind readout), Wall 2 prices incl. **pins $15** (§13),
party ticket ($30), **Igniting Joy = digital-only book bundled with the App** (§13),
**Wall 1 target = $8,500** (§13), **Wall 3 tier ladder v1 + $1,500/mo party sub-goal**
(§13, host-confirmed), **Keystone = Allyship Dojo** (group, founding students, ranks; quarterly
1:1 dropped), **name consent = opt-in** (§13), **overflow → Wall 3 + "keep building" redirect
panel** (§13). **Design is fully decided.** Remaining = implementation + one soft call:
1. **Dojo cadence** — captured as monthly v1 / weekly stretch; host to confirm if they'd rather launch weekly.
2. **Implementation TODO:** `src/lib/marketing/products.ts` needs price fields +
   physical/digital variants, the **RPG Book, enamel pins, and Igniting Joy** added, and the
   "The Game" entry reframed as **The App** ($10/mo) with the Founder bundle ($150 lifetime).
