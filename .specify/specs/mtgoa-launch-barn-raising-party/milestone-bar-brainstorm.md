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
