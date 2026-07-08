# Gumroad Copy Handoff — Mastering the Game of Allyship

> **Purpose.** Everything needed to write (and paste in) new copy for every Gumroad
> product page, plus image direction to match the aesthetic. Assembled from the live
> app's sales surfaces so nothing drifts. Hand this whole file to Claude on the MTGOA
> project for the deep copy pass.
>
> **Target voice:** a *tighter, conversion-cut* of the `/mastering-allyship` sales
> letter — same worldview and Wendell voice, compressed and scannable for a product page.
> **Target reader:** **cold buyers** who don't know Wendell or the Kickstarter — each
> page has to sell from scratch.

---

## 0. How to use this doc (instructions for the copy pass)

For **each product** in §5, produce a Gumroad page with this structure (validated by the
research in §7–§8):

1. **Product name** (the title field) — clear + evocative.
2. **Tagline / summary** (one line, ~8–14 words) — the above-the-fold hook.
3. **Description body** — hook → the problem → what it is → what's inside → who it's for
   → proof/credibility → price justification → CTA. Short, bolded, bulleted, scannable.
4. **FAQ** (3–5 Qs) where it dissolves a real objection.
5. **Cover image + thumbnail** direction — see §9.

Hard rules:
- **No AI talk in public-facing copy.** The Portland community around this project has a
  strong allergy to AI; the product pages must never lean on "AI-powered" as a selling
  point. Sell the practice, the moves, the transformation.
- **Cold-reader safe.** Don't assume they backed the Kickstarter or know the book.
- Keep Wendell's voice: literary but direct, second-person, specific over abstract, dry
  humor, never hype.

---

## 1. Brand voice & ethos

**Who's selling.** Wendell Britt — ran DEI/inclusivity at Blue Sky Studios, built and ran
allyship curriculum, alumni engagement at a college; trained in IFS, shadow work, Integral,
Jungian; designs games for a living. Credibility is *rooms he's stood in*, not theory he read.
Three years ago ~400 people funded this before it existed; he finally finished. That's the résumé.

**The core reframe (the spine of every page).**
- The game of allyship you were handed *was never built for you to win* — it runs on your
  dissatisfaction and bills you monthly in guilt.
- The move isn't to *care less*. It's to **put the game down and design a better one** — tuned
  to your real strengths and your actual, un-apologized-for joy.
- **Care by design, not out of social obligation.**

**Voice tokens (lift the register, not the literal lines):**
- Second person, present tense, in-the-fire specifics ("Thursday afternoon," "eight minutes
  before the next meeting," "the volunteer who generates two problems for every one they solve").
- Names the reader's exhaustion without pity; refuses the "you're failing" verdict.
- Dry, disarming honesty ("I am a man on the internet promising that allyship can be *fun*. I
  hear it too."). Pre-empts the reader's skepticism instead of fighting it.
- Metaphor family: **games, moves, maps, design, waking up inside something someone else built.**
- Closes on stakes, not hype: "your one, aggressively non-refundable life. You might as well
  have fun in it."

**Do:** concrete scenes, one sharp idea per line, earn each claim, let the reader keep their
skeptical voice.
**Don't:** DEI jargon, wellness-platitudes ("hold it with grace"), feature-dumping, hype,
exclamation-point energy, anything that reads like a grift the reader's own inner voice would flag.

**Signature motifs to reuse:** "the game you were handed" · "care by design" · "a move in your
pocket" · "the new map" · "someone in the fire with you" · "the lineup" (therapist/coach/
consultant/lunch who all point in but never hand you a move).

---

## 2. Visual system (for image matching)

**Palette**
- Base: dark-warm near-black `#0a0908` / `#0b0910`; ink `#12100e`.
- **Gold** (deck/oracle, premium): `#C9A84C` (a.k.a. `DECK_GOLD`), gradient `#ffe08a → #e6b93f → #c07a1e`.
- **Liminal purple** (primary action / MTGOA brand): `#7c3aed` / `#a855f7`.
- **Element colors** (semantic, never decorative): Water (book), Metal (RPG handbook),
  Fire (deck/oracle), Wood (the game), Earth (physical goods / Founding Ally / coaching).
- Superpower packs use their own **arc-derived accent hues** (not the five element colors).

**Type**
- Display: **Jost** · Body: **Nunito** · Mono: **Space Mono**.

**Aesthetic.** Element-colored "rooms," oracle-deck cards fanned, alchemical/elemental,
dark and warm — never clinical or corporate. Think field-guide-meets-tarot, not SaaS.

**Image specs (match existing assets):**
- **Cover / hero:** `1280×720` PNG (16:9). Existing: `allyship-deck-cover`, `founders-bundle-cover`,
  `rpg-book-cover`, `cover-front` (book).
- **Thumbnail / square:** `1080×1080` PNG. Existing: `allyship-deck-thumbnail`,
  `founders-bundle-thumbnail`, `rpg-book-thumbnail`.
- Logo: `mtgoa-logo-transparent.png`.
- *(Confirm current Gumroad-recommended cover dimensions in §7 before final export.)*

Existing assets live in `public/launch/`.

---

## 3. The offer architecture (how the products relate)

The public sales letter frames a **stacked offer** — write each page aware of its neighbors:

- **The Deck — "a move in your pocket."** When Thursday's on fire you don't need a framework,
  you need to know what to *do* in the next ninety seconds. Pull a card, get a move.
- **The Book — "the new map."** The deck gives moves; the book gives the *game* — the six roles
  you're already playing, the shadow each throws when you're tired, and how to redesign the game.
- **Coaching — "go all the way."** The one only Wendell does: someone in the fire with you,
  turning the saboteurs into allies.
- **Superpower packs** expand the deck around your specific strengths.
- **Founding Ally** is the patron tier — everything, in hand and on the shelf.

"Deck + book is the yes. Coaching is the go-all-the-way."

---

## 4. Product line at a glance

| Product | Price | Type | Element | Live? |
| :-- | :-- | :-- | :-- | :-- |
| Founding Ally Bundle | $150 | bundle | Earth | ✅ |
| Book — Digital | $15 (PWYW) | digital | Water | ✅ |
| Book — Physical | $25 | preorder | Earth | ✅ |
| Oracle Deck — Digital | $22 | digital | Fire | ✅ |
| Oracle Deck — Physical | $65 | preorder | Fire | ✅ |
| The Game — Monthly | $10/mo | subscription | Wood | held back |
| RPG Handbook — Digital | $30 | digital | Metal | held back |
| RPG Handbook — Physical | $49 | preorder | Metal | held back |
| Coaching | by application | service | Earth | inquiry |
| Superpower packs (×7) | $8 each | digital | arc accent | "coming soon" |
| Loadout Bundle | $20 | bundle | Wood | "coming soon" |

*(Prices are the live `priceCents` in `src/lib/launch/offers.ts`. "Held back" = intentionally
off `/launch` for the book/deck launch, but may still have a Gumroad page.)*

---

## 5. Current copy inventory (per product)

> This is the **existing** copy across every surface, so the rewrite has the raw material and
> the tone to match. Sources: `offers.ts` (facts), `page-content.ts` (launch page), the
> `/mastering-allyship` sales letter, `deck-sales-copy.ts`.

### Founding Ally Bundle — $150 · Earth · patron/hero tier
- **Name:** Founding Ally Bundle
- **Blurb:** "The patron tier. Everything, in your hands and on your shelf — and your name in
  the founding cohort."
- **Best for:** the whole shelf. **Unlocks:** everything in the launch stack.
- **Includes:** Physical MTGOA book · Physical RPG Handbook · Allyship enamel pin · Digital deck
  access · Lifetime access to the app.
- **Context:** "when you want the physical shelf, digital tools, and a direct role in getting the
  launch over the wall."

### Book — Mastering Allyship — Digital — $15 (pay-what-you-want) · Water
- **Name:** Mastering Allyship — Digital
- **Blurb:** "The book, instantly — and a 30-day key into the app to play what you read. Pay what
  feels right; $15 is the suggested seed."
- **Includes:** The digital book · 30 days of app access.
- **Best for:** curious — start with the frame. **Unlocks:** book + 30 days of app access.
- **Note:** PWYW; $15 is the anchor. The 30-day app pass is granted on redeem.

### Book — Physical — $25 (preorder) · Earth
- **Blurb:** "The printed book. Preorder now; ships after the print run."
- **Context:** "when the object matters: reading away from the screen, gifting, marking up."
- Physical buyers also receive the matching **digital** book.

### Oracle Deck — Digital Access — $22 · Fire
- **Name (launch):** Allyship Deck — Digital Access
- **Blurb:** "The 120-move Oracle at the Edge of the Known World." / "one concrete allyship move
  at a time, for yourself or a real campaign."
- **The deck's own sales page (`/deck/sales`) copy** — reuse this:
  - Hook: **"120 moves for doing the work."**
  - "Draw a card. Sit with the practice. Turn it into a real quest. Five moves, four domains,
    six faces."
  - **The five moves:** Wake Up ("Notice what you'd rather not"), Open Up ("Cross the threshold"),
    Clean Up ("Repair the harm you carry"), Grow Up ("Take responsibility"), Show Up ("Act in the open").
  - **How it works:** 1) Draw a card 2) Sit with the practice 3) Send it to BARS (turn the card
    into a quest — capture the charge, take the 3·2·1 action).
- **This is the in-app product** (unlocks `/deck`); needs the license-key → `/redeem` flow.

### Oracle Deck — Physical — $65 (preorder) · Fire
- **Blurb:** "The printed 120-card deck, in your hands. Preorder now; ships after the print run."
- **Context:** "when you want to draw a real card off a real table, not a screen."

### The Game — Monthly — $10/mo · Wood *(held back)*
- **Blurb:** "Play the living game. Your subscription includes the digital book and digital deck
  access." Includes: full game access · digital book · digital deck.

### RPG Handbook — Digital — $30 · Metal *(held back)*
- **Blurb:** "The full tabletop rules — four moves, nations, archetypes, emotional alchemy."
- **Best for:** facilitators and rules readers.

### RPG Handbook — Physical — $49 (preorder) · Metal *(held back)*
- **Blurb:** "The printed handbook for the table. Preorder now; ships after the print run."

### Coaching — Your Allyship Game Master — by application · Earth
- **Blurb:** "The one only I do. Not another person who'll listen — someone in the fire with you,
  running the campaign at your side. Together we find the parts still loyal to the old rules and
  turn the saboteurs into allies."
- **Includes:** 1:1 with Wendell · Deck + digital book access · "the deprogramming, done with a partner."
- **Note:** inquiry/application, not fixed-price checkout. "The one only I do."

### Superpower Packs — $8 each · arc-accent hue
Each is a **60-card expansion** — five moves across six levels, inner and outer — that adds one
superpower's depth to any allyship campaign, and lights up a clickable "Go Deeper" on matching
deck cards. The seven (with their emotional arc + shadow, for flavor/specificity):

| Pack | Emotional arc | Works in | Overuse shadow | Avoidance shadow |
| :-- | :-- | :-- | :-- | :-- |
| **Connector** | Neutrality→Peace (Earth) + Sadness→Poignance (Water) | awareness, resources | over-mediates, absorbs everyone's emotions | withholds introductions |
| **Storyteller** | Anger→Triumph (Fire) + Sadness→Poignance (Water) | awareness | the Manipulator (distorts for engagement) | the Lost Author (won't claim a voice) |
| **Strategist** | Fear→Clarity (Metal) | organizing | analysis paralysis, people-as-chess-pieces | won't act without a perfect plan |
| **Disruptor** | Anger→Triumph (Fire) | direct action | the Chaos Bringer (fights to fight) | the Caged Rebel (waits for permission) |
| **Alchemist** | all elements; Sadness→Poignance→Joy | direct action | Emotional Overload (burns out) | the Detached Observer (intellectualizes) |
| **Escape Artist** | Sadness→Poignance (Water) + Fear→Excitement (Metal) | direct action | the Martyr (stays too long) | the Ghost (bolts at first friction) |
| **Coach** | Frustration→Triumph (Fire) | resources | the Taskmaster (creates dependence) | the Empty Cheerleader (only affirms) |

### Loadout Bundle — $20 · Wood *(coming soon)*
- **Blurb:** "The deck plus both superpower packs in your loadout — inner and outer, together.
  The full Go Deeper experience for your two superpowers." Includes: digital deck access · inner
  pack · outer pack. (Single-charge: a deck owner isn't re-charged for an already-granted pack.)

---

## 6. First-draft Gumroad copy (tighter conversion cut, cold-reader)

> Drafts to sharpen, not ship. Each follows the §0 skeleton. Regular Claude should punch these up
> against §7–§8 and Wendell's ear.

### 6.1 Oracle Deck — Digital ($22) — *the flagship page; write this best*

**Title:** The Allyship Deck — 120 Moves for Doing the Work
**Tagline:** When the moment's on fire, you don't need a framework — you need the next move.

**Description:**
> You know the feeling. The meeting's going sideways, someone just said the thing, and you have
> about ninety seconds and no idea what to actually *do*. Every book you've read is useless at
> that speed.
>
> The Allyship Deck is a move in your pocket. Draw a card and it hands you one concrete
> allyship move — a real question and a practice you can run right now, for yourself or for a
> campaign you're part of. Don't like that one? Draw again. Keep pulling until one fits.
>
> **What's inside**
> - **120 move-cards** across the five moves: Wake Up, Open Up, Clean Up, Grow Up, Show Up.
> - Four domains, six faces — the whole map of the work, one card at a time.
> - Each card: a sharp question + a concrete practice you can act on today.
> - Instant digital access inside the app — draw, sit with it, turn it into a real quest.
>
> **Who it's for:** anyone doing the work who's tired of frameworks that evaporate the second
> things get hard — and wants a move instead.
>
> $22, yours instantly. Pull your first card.

**FAQ:** *Do I need the book?* (No — the deck stands alone; the book is the bigger map.) ·
*Physical or digital?* (This is digital/in-app; a printed deck is a separate preorder.) ·
*How do I get access after buying?* (You'll get a license key — redeem it at `/redeem` and the
deck unlocks.)

### 6.2 Book — Digital ($15, pay-what-you-want)

**Title:** Mastering the Game of Allyship — The Book (Digital)
**Tagline:** The game you were handed was never built for you to win. Here's how to redesign it.

**Description:**
> You started this work for a reason. It's just hard to hear that reason over all the fire.
> You've done the responsible things — the therapist, the coach, the consultant, the lunch that's
> the only system in your life that reliably works — and not one of them handed you a move.
>
> This book hands you the whole game. The six roles you're already playing whether you named them
> or not. The shadow each one throws when you're exhausted. And the actual point: how to stop
> running the game you were handed — the one with unwinnable rules and an unpayable debt — and
> design one that's yours. Care by design, not out of obligation.
>
> **What you get**
> - The full digital book, instantly.
> - A 30-day key into the app, to *play* what you read.
>
> **Pay what feels right — $15 is the suggested seed.** Start with the frame; go deeper when you're ready.

**FAQ:** *Why pay-what-you-want?* · *What's the app access?* (30 days to try the living version of
the work.) · *Is this preachy?* (No — it assumes you're already tired of being told to care more.)

### 6.3 Book — Physical ($25, preorder)

**Title:** Mastering the Game of Allyship — The Book (Physical, Preorder)
**Tagline:** The new map, in your hands — to mark up, dog-ear, and hand to someone.
**Description:** short — the object matters (reading off-screen, gifting, marking up); ships after
the print run; **includes the digital edition** so you can start reading today. Reuse 6.2's frame,
compressed, and lead with the tactile pitch.
**FAQ:** *When does it ship?* · *Do I get the digital now?* (Yes.)

### 6.4 Oracle Deck — Physical ($65, preorder)

**Title:** The Allyship Deck — Printed (Preorder)
**Tagline:** 120 moves, off a real table instead of a screen.
**Description:** the tactile ritual of drawing a physical card; 120 cards; preorder ships after
the print run. Cross-sell the digital deck for "start now." Keep it short and object-forward.

### 6.5 Founding Ally Bundle ($150)

**Title:** Founding Ally — The Whole Thing
**Tagline:** Everything, in your hands and on your shelf — and your name in the founding cohort.
**Description:**
> This is the patron tier — for the person who's done deciding piece by piece and just wants all
> of it, and to help get this over the wall.
>
> **What's in it**
> - The printed **book** and printed **RPG Handbook**.
> - An allyship **enamel pin**.
> - **Digital deck** access.
> - **Lifetime** access to the app.
> - Your name in the founding cohort.
>
> $150. The shelf, the tools, and a hand in building the thing.

**FAQ:** *Physical + digital both?* · *What's lifetime access include?* · *When do physicals ship?*

### 6.6 Coaching — Your Allyship Game Master (by application)

**Title:** Coaching — Your Allyship Game Master
**Tagline:** Not another person who'll listen. Someone in the fire with you.
**Description:**
> This is the one only I do. I won't tell you to care less, and I'm not here to nod. I'll be your
> Allyship Game Master — we go find the parts of you still loyal to the old rules, the ones sure
> you have to suffer to be good, and instead of fighting them, we enroll them. Turn the saboteurs
> into allies. The deprogramming, done with someone in the fire with you instead of watching from a chair.
>
> Includes 1:1 work with me, plus deck + digital book access to run the campaign between sessions.
>
> By application — it's high-touch and limited. Tell me where you're stuck.

**CTA:** Apply / Start the conversation (inquiry, not instant checkout).

### 6.7 Superpower Packs (×7, $8 each) — one template, seven fills

**Title:** The [Superpower] Pack — 60-Card Deck Expansion
**Tagline:** Add your [Superpower] depth to any allyship campaign.
**Description (template):**
> Every superpower is a strength *and* the shadow it throws when you lean on it too hard — or hide
> from it. The [Superpower] Pack is a 60-card expansion that puts that whole range in your hands:
> five moves across six levels, inner and outer, for the [Superpower] in you.
>
> - **60 move-cards** — inner + outer aspects.
> - Lights up a clickable **"Go Deeper"** on every matching card in your Allyship Deck.
> - Built around the [Superpower]'s real arc: **[from→to emotional arc]**.
>
> $8. For the [Superpower] who wants more range — and fewer blind spots.

**Per-pack fills (drop the specifics in):**
- **Connector** — arc *Neutrality→Peace + Sadness→Poignance*; grows the one who holds the bonds,
  without absorbing everyone's emotions or withholding the introduction.
- **Storyteller** — arc *Anger→Triumph + Sadness→Poignance*; claim the voice without tipping into
  the Manipulator or vanishing as the Lost Author.
- **Strategist** — arc *Fear→Clarity*; sharpen the plan without analysis paralysis or waiting for perfect.
- **Disruptor** — arc *Anger→Triumph*; move without becoming the Chaos Bringer or the Caged Rebel.
- **Alchemist** — arc across all five elements, *Sadness→Poignance→Joy*; metabolize without burning
  out or intellectualizing from a safe distance.
- **Escape Artist** — arc *Sadness→Poignance + Fear→Excitement*; leave what's done without the Martyr's
  guilt or the Ghost's bolt.
- **Coach** — arc *Frustration→Triumph*; call people up without the Taskmaster's dependence or the
  Empty Cheerleader's fluff.

### 6.8 Loadout Bundle ($20)

**Title:** Your Loadout Bundle — Deck + Both Superpower Packs
**Tagline:** The full Go Deeper experience for your two superpowers, inner and outer.
**Description:** digital deck access + your inner and outer superpower packs, priced under buying
the three separately. Note the single-charge fairness (you're never re-charged for a pack you
already own). $20.

### 6.9 The Game — Monthly ($10/mo) & RPG Handbook ($30 / $49) *(held back — draft if pages exist)*
- **Game:** the *living* version — play the work as an ongoing practice; includes digital book +
  deck access. Frame as "the practice that doesn't end when you close the book."
- **RPG Handbook:** for facilitators / tables — the full rules: four moves, nations, archetypes,
  emotional alchemy. Sell to the game-runner, not the solo reader.

---

## 7. RESEARCH — Gumroad product-page anatomy & best practices

> ### ⚠️ Three platform facts that OVERRIDE the §6 drafts — apply these first
>
> 1. **Gumroad discontinued pre-orders (~May 2022).** The "Preorder" framing on the physical
>    book, physical deck, and RPG handbook **can't use a Gumroad preorder feature** — it no longer
>    exists. Instead: publish a normal product and **state in the copy what ships now vs. later**
>    ("Ships [month]. Order now to lock the first print run.") plus give the digital edition
>    immediately where applicable. Rewrite the physical CTAs/copy accordingly.
> 2. **The buy-button label is a fixed 3-option enum, not free text:** *"I want this!"*, *"Buy this"*,
>    or *"Pay."* So draft CTA lines like "Pull your first card" or "Become a Founding Ally" must live
>    as the **Summary line + micro-copy around the button**, not as the button itself. Pick the enum
>    (usually "I want this!") and carry the voice in the summary.
> 3. **Thumbnail is a distinct 600×600 upload** (not just an auto-crop of the cover). Export a
>    dedicated square per product so the cover can "sell" while the thumbnail "represents" in grids.

*Sourcing caveat: Gumroad help docs and live `*.gumroad.com` pages are blocked from automated
fetch here, so help-doc content is via search-index extracts (canonical URLs cited). Exact field
limits were verified directly against Gumroad's open-source codebase (`antiwork/gumroad`), which is
authoritative. Re-confirm any live example-page metric in a browser.*

### 7.1 Page anatomy — field by field

Editor tabs: **Product** (name, description, cover, pricing, versions, details), **Content**
(post-purchase deliverables), **Checkout** (custom fields, upsells, discounts), **Share** (URL,
tags, category, ratings toggle).

| Field | How to use it | Limit |
|---|---|---|
| **Name** | Title; indexed for search. Descriptive keywords. | Max **255 chars** |
| **Summary / tagline** | One-line pitch shown **beside the buy button** — "what it is + who it's for." Carry your voice here (see fact #2). | No documented cap |
| **Description body** | Main sales copy. Rich text: headings, bold, bullet/numbered lists, links, buttons, quotes, images, video/audio embeds. | No documented cap |
| **Cover image** | Hero at top; **carousel of up to 8**; video covers supported. Gumroad: covers convert ~2× vs none, video covers ~2× vs static. | See §7.2 |
| **Thumbnail** | Square, for library/Discover/profile grids. | See §7.2 |
| **Content tab** | Post-purchase files (PDF/video/audio/rich text/folders). Size & page-count/duration auto-expose. | — |
| **Additional details** | Display-only spec pairs below the CTA (e.g. `Pages: 200`, `Format: PDF`). | — |
| **Ratings** | 1–5 stars + reviews from **verified purchasers only**. | — |
| **Versions / variants / tiers** | See §7.5. | — |
| **Custom fields (Checkout)** | Collect buyer input at checkout (text/checkbox/terms). | — |
| **Permalink** | Auto `gumroad.com/l/<id>`; custom slug `^[a-zA-Z0-9_-]+$`. | — |
| **Category & tags** | One Discover category + free-form tags. | Tags **2–20 chars** |
| **CTA button** | Fixed enum (see fact #2 / §7.6). | Enum only |
| **Custom receipt text** | Post-purchase receipt message. | Max **500 chars** |

### 7.2 Cover + thumbnail specs

- **Cover:** **≥ 1280 × 720 px, 16:9, ≥ 72 DPI** (min width 600). PNG / JPEG / GIF; video covers via
  MP4/MOV or a YouTube/Vimeo URL. **Up to 8** (they form the carousel/previews). **Keep title/logo
  centered** — the thumbnail center-crops from the cover, so edge content gets cut. Optimize to
  <~1 MB for load speed. *(Your existing 1280×720 covers already match.)*
- **Thumbnail:** **≥ 600 × 600 px, square.** Upload a dedicated square (see fact #3); otherwise it
  auto-crops from the cover. *(Your 1080×1080 thumbnails are fine — above the minimum.)*
- Secondary guides converge on **3–5 product views** and a **2–4 min walkthrough video** as
  high-leverage. (Sources: Gumroad art. 60, art. 289; topbubbleindex.)

### 7.3 Description formatting (copy mechanics)

- **Length:** working range **400–800 words** (up to ~1,200 for complex products); drive length by
  **objection-coverage, not a word target** ([kupkaike](https://kupkaike.com/blog/gumroad-product-page-best-practices)).
- **Above the fold:** first **1–2 lines carry the promise + the buyer's specific problem**, not
  backstory. **>50% of traffic is mobile** and the buy button should show on first scroll.
- **Title formula:** `[Specific product type] for [specific audience] — [key outcome/differentiator]`.
- **High-converting body order:** hook → agitate problem (buyer's words) → promise/transformation →
  **proof high** → **what's-included (4–6 action-verb bullets, with counts)** → who it's for (also
  disqualify, to cut refunds) → price + value justification → **FAQ (5–7 Qs)** → guarantee near the
  final CTA ([kupkaike](https://kupkaike.com/blog/gumroad-product-page-best-practices), [heyimadar](https://heyimadar.substack.com/p/creating-high-converting-product), [lifemathmoney](https://lifemathmoney.com/how-to-write-a-high-converting-gumroad-sales-page/)).
- **Price justification placement:** **anchor before the price appears** — value-stack each component
  as a named problem solved, placed immediately before the price/CTA block, after proof.
- **Conversion note (directional vendor claims, no primary study):** optimized pages cited at 4–8%
  vs <1%; a 2–4 min narrated screen-recording claimed +40–70%. Treat as directional.

### 7.4 Social proof & ratings

- **Stars (1–5) + written reviews from verified purchasers only.** Buyers rate within **one year**;
  Gumroad auto-emails a review reminder **~5 days** post-purchase — so *ask backers to review*.
- Average + rating **count** show on product and profile pages; you can hide the whole display but
  **can't cherry-pick** reviews. **Refunded purchases drop out of the average.**
- **Revenue badges** auto-display at thresholds. Because native proof is thin (stars + count), top
  sellers **embed proof as images in the description** — testimonial/tweet screenshots — and quote
  the **result**, not generic praise. *(Reuse the deck page's live "raised / backers" figures.)*

### 7.5 Pricing presentation

- **Fixed vs PWYW:** enter price + `+` (`15+` = $15 floor; `0+` allows free). A **Suggested Amount**
  pre-fills as an anchor. Non-zero minimum is **$0.99**. *(The $15 book maps to `15+` with $15 suggested.)*
- **Versions (digital) / variants (physical) / tiers (membership):** version price = **base +
  additional amount**. Could sell book PDF/EPUB as versions on one page.
- **Discounts / offer codes:** Checkout → Discounts. Percentage or fixed; usage cap + schedule;
  applied via a checkout field **or** an embedded URL. **Strikethrough original price shows only when
  the discount arrives via the product-specific link.** *(Relevant to the `MTGOA-BACKERS` code.)*
- **Preorders: deprecated** — see the override box above.

### 7.6 CTA / buy button

- **Hosted-page label is a fixed enum:** **"I want this!"** (default, desire-framed), **"Buy this"**,
  **"Pay"** (verified in codebase `CtaButton.tsx`). Your copy leverage is the **Summary + micro-copy**
  around the button (guarantee reminder, price anchor), not the label.
- **Overlay vs redirect (off-site embeds):** **overlay** = modal, buyer stays on your domain (custom
  bg/button color); **redirect** = Gumroad's hosted checkout. Prefer overlay; append **`?wanted=true`**
  to jump to the payment form. Payment **always completes on Gumroad's checkout** (no on-domain
  checkout, no checkout CSS) — by design.

### 7.7 Digital vs physical

- **Physical:** add ≥1 shipping destination before publishing (use "Elsewhere" for worldwide);
  auto-SKU per variant; per-variant stock caps; **fulfillment is manual** (no POD, no live rates).
- **Digital:** instant download-link delivery; email still required even for free.

### 7.8 Example pages (structural lessons; re-confirm live metrics)

- **Book — Daniel Vassallo, "Everyone Can Build a Twitter Audience"** — benefit-first plain title; a
  **specific dated transformation**; honest scope-setting ("one video, 1h40m, not modules") to cut
  uncertainty; explicit **30-day no-questions refund**; ran PWYW $1-min flash sales.
- **Template — Easlo, "Second Brain"** — borrows authority (PARA/Tiago Forte); "what's included" as a
  scannable inventory; **tiered variants on one page**; volume proof ("6,800+ purchased").
- **Course/coaching — Justin Welsh, "LinkedIn Operating System"** — founder-credibility hero stat;
  anchored/discounted price with urgency; **testimonial density as the engine**; time-bucketed
  curriculum ("what I do each day/week/month").
- **Design pack — Jingsketch Procreate Brushes** — usage-scale headline ("100,000+ artists");
  borrowed-authority logos ("artists at Pixar, Epic, Mattel"); concrete deliverable count; previews
  showing work made *with* the product.
- **Cross-cutting lesson:** **one specific quantified proof point up front** + a concrete
  **"what's inside" inventory** + **proof placed both high and near the price.**

**Most authoritative source for exact limits:** the open-source [`antiwork/gumroad`](https://github.com/antiwork/gumroad)
codebase. **Freshness flags:** preorders deprecated; CTA enum may become free-form later; the
"70% choose middle tier" and conversion-lift percentages are unverified vendor lore.
**Sources:** Gumroad help arts. [60](https://help.gumroad.com/article/60-adding-a-cover-image),
[61](https://help.gumroad.com/article/61-adding-a-description-to-your-product),
[126](https://help.gumroad.com/article/126-setting-up-versions-on-a-digital-product),
[128](https://help.gumroad.com/article/128-creating-offer-codes),
[133](https://help.gumroad.com/article/133-pay-what-you-want-pricing),
[149](https://help.gumroad.com/article/149-adding-a-product),
[222](https://help.gumroad.com/article/222-product-ratings-on-gumroad),
[289](https://help.gumroad.com/article/289-file-size-limits-on-gumroad) ·
[kupkaike](https://kupkaike.com/blog/gumroad-product-page-best-practices) ·
[heyimadar](https://heyimadar.substack.com/p/creating-high-converting-product) ·
[robinsanah](https://robinsanah.substack.com/p/how-to-write-a-gumroad-page-that) ·
[backendo](https://www.backendo.com/2025/09/integrating-gumroad-checkout-into-your.html).

---

## 8. RESEARCH — Copywriting principles that convert (cold buyers)

*A craft reference for selling to people who have never heard of the creator. Every non-obvious claim is cited inline.*

### 8.0 The one principle underneath everything: match the buyer's awareness

Cold buyers are, in Eugene Schwartz's terms, **Unaware or Problem-Aware** — they don't know you, and may not yet name the problem your product solves. Schwartz's rule: *"The more aware your market, the easier the selling job, the less you need to say."* Cold = you must say more, and you must **enter the conversation already happening in the reader's head** rather than opening with your product ([Between the Lines Copy](https://betweenthelinescopy.com/blog/stages-of-awareness/); [Duo Strategy](https://www.duostrategyla.com/ideas/how-to-write-high-converting-ad-copy-the-complete-5-stage-framework-with-examples)).

Practical consequences for a cold creator page:
- **Lead with the reader's problem or a curiosity hook, not "Introducing my deck."** For unaware audiences, lead with a story, a startling claim, or a curiosity gap; for problem-aware audiences, lead with problem-agitation ([Duo Strategy](https://www.duostrategyla.com/ideas/how-to-write-high-converting-ad-copy-the-complete-5-stage-framework-with-examples)).
- **Explain your authority explicitly.** With cold traffic it's crucial to establish market authority so prospects don't silently wonder "why haven't I heard of them?" ([Boagworld](https://boagworld.com/marketing/objection-handling/)).

### 8.1 Headline / hook formulas

A converting headline does one of three jobs — **promise a specific benefit, open a curiosity gap, or name a pressing problem** — matched to how aware the reader is ([GetResponse](https://www.getresponse.com/blog/copywriting-landing-page-conversions); [BDOW/Sumo](https://bdow.com/stories/headline-formulas/)).

- **Benefit-first** states the payoff plainly. Jay Abraham: *"Sell the benefit, not your company or product. People buy results, not features"* ([GetResponse](https://www.getresponse.com/blog/copywriting-landing-page-conversions)).
- **Curiosity** builds a gap the brain is compelled to close — best for cold/unaware readers who don't yet feel the problem ([BDOW/Sumo](https://bdow.com/stories/headline-formulas/)).
- **Outcome/transformation** names the after-state; move focus from you to the reader's result ([CXL](https://cxl.com/blog/quick-course-on-effective-website-copywriting/)).
- The **sub-head** does the job the headline can't: if the headline is curiosity, the sub-head delivers the concrete benefit; if benefit, the sub-head adds proof or mechanism.

**Reusable headline skeletons:**
- `How to [desired outcome] without [feared cost/effort]`
- `[Number] [thing]s that [outcome] — even if [objection]`
- `The [surprising thing] that [audience] use to [outcome]`
- `[Achieve outcome] in [timeframe] — [proof/specific detail]`

### 8.2 Features → benefits → transformation

People buy on emotion (the benefit) and justify with logic (the feature). The strongest copy runs the full ladder: **Feature → Benefit → Outcome/Transformation** ([Drop Dead Copy](https://www.dropdeadcopy.com/features-vs-benefits/); [MRY Marketing](https://mrymarketing.com/blog/features-vs-benefits-technical-product-copywriting)).

- **The "So what?" ×3 drill.** For each feature, ask "So what?" until you hit the emotional end-state. *"120 cards" → so what? → "a move for any moment" → so what? → "you're never stuck under pressure."*
- **Old-game / new-game (Before-After-Bridge).** **Before** (stuck reality) → **After** (improved world) → **Bridge** (your product). Purpose-built for transformation selling ([The Copy Brothers](https://thecopybrothers.com/blog/copywriting-frameworks/)) — and it maps *exactly* onto the MTGOA "game you were handed → game you design" frame.
- **BFA order:** Benefit first, Feature second, Advantage last — so the reader sees why a feature matters before decoding it ([GetResponse](https://www.getresponse.com/blog/copywriting-landing-page-conversions)).

### 8.3 Objection handling & risk reversal

Cold buyers carry four predictable objections; name and dissolve each *in the copy* ([Boagworld](https://boagworld.com/marketing/objection-handling/); [HubSpot](https://blog.hubspot.com/sales/handling-common-sales-objections)):

| Objection | Copy pattern that dissolves it |
|---|---|
| **"Too expensive / worth it?"** | Reframe price against the cost of staying stuck; break to per-use; stack value ([Webfor](https://webfor.com/blog/the-psychology-of-pricing-in-e-commerce-marketing/)). |
| **"I don't trust you"** | State authority explicitly; founder story/credentials; specific proof ([Boagworld](https://boagworld.com/marketing/objection-handling/)). |
| **"Will this work for *me*?"** | Handle edge cases ("even if you've never…"); testimonials that mirror the reader ([HubSpot](https://blog.hubspot.com/sales/handling-common-sales-objections)). |
| **"Is this *for* me?"** | An explicit **"Who this is / isn't for"** block — naming who it's *not* for raises trust and self-selects buyers. |

**Risk reversal is the highest-leverage single move.** A visible guarantee transfers risk from buyer to seller; reported lifts range from ~21–26% up to *doubling* conversion when guarantees are extended, and risk-reversal language correlated with ~32% higher sales win rates ([Social Triggers](https://socialtriggers.com/guarantees/); [SPOTIO](https://spotio.com/blog/risk-reversal-language-punches-your-ticket-to-32-higher-win-rates/)). **Specific > generic:** "Use the deck for 30 days; if you're not pulling a card weekly, email me for a full refund" beats "satisfaction guaranteed" ([River](https://rivereditor.com/blogs/guarantee-risk-reversal-paragraphs-remove-90-percent-objections)). For **coaching**, a free intro call is the low-risk on-ramp ([Quicksprout](https://www.quicksprout.com/what-converts-better-free-trial-versus-money-back-guarantee/)).

### 8.4 Social proof when you barely have any

You don't need volume; you need **specificity and credibility signals** ([CXL](https://cxl.com/blog/is-social-proof-really-that-important/); [Greedier Social Media](https://greediersocialmedia.co.uk/social-proof-for-creators-guide/)).

- **Launch without testimonials is fine — but never fake them.** Make the few you have count: full name, profession, a *specific* result that counters a real objection.
- **Substitutes:** beta/early-user quotes, user photos, "as seen in," any third-party validation.
- **Founder credibility as proof.** For a newer creator, *your* story is the proof — the specific journey, the archived body of work. (This is a strong fit: the ~400 backers who funded it before it existed, the specific rooms Wendell has stood in.)
- **Live/dynamic proof** (a growing community count, recent activity) reads as more authentic than static stars ([CreatorDB](https://creatordb.app/blog/the-psychology-of-social-proof-marketing/)). *Note: the deck sales page already surfaces live "raised / backers" figures — reuse that.*

### 8.5 Repeatable skeleton for a short/medium product description

1. **Hook** — curiosity or problem line for a cold reader (§8.1).
2. **Problem / agitation** — the stuck reality in the reader's words (the "old game").
3. **What it is** — one plain sentence: *"[Product] is a [category] that helps [audience] [outcome]."*
4. **What's inside / how it works** — components, each translated to a benefit (BFA order).
5. **The transformation** — before → after (the "new game").
6. **Who it's for / not for** — self-selection block.
7. **Proof** — testimonials, founder credibility, specifics (§8.4).
8. **Price justification** — anchor + value stack + guarantee.
9. **CTA** — one specific action, repeated top/middle/bottom ([Kit](https://kit.com/resources/blog/sales-page)).
10. **FAQ** — dissolve residual friction (§8.8).

### 8.6 Pricing psychology

- **Anchoring** — show a higher reference first so the target price reads as reasonable ([Webfor](https://webfor.com/blog/the-psychology-of-pricing-in-e-commerce-marketing/)).
- **Tiers (good/better/best)** — three options shift the question from *whether* to buy to *which* ([Clootrack](https://www.clootrack.com/blogs/11-proven-psychological-pricing-strategies-examples-2024)). Maps to deck → loadout bundle → Founding Ally.
- **Bundles** raise perceived value + AOV even with a small discount ([MBC](https://mbc-builder.com/blog/bundle-pricing-psychology)).
- **Pay-what-you-want** widens access and builds goodwill (great for a community-first, AI-allergic audience) — but keep the **suggested anchor** ($15 on the book).
- **Scarcity / preorder / "founding" tiers** work — *only when true*. A founding preorder is legitimate scarcity **and** an early-proof engine.
- **Caution:** don't announce a founder discount *immediately after* the price — it undercuts pricing confidence and answers an objection no one raised. Frame the founding rate as **access/scarcity, not apology** ([Heartbeat](https://www.heartbeat.chat/article/pricing-psychology-for-communities)).

### 8.7 Voice & specificity

- **Specificity converts.** *"Specificity is believable. Specificity is convincing."* Concrete claims beat abstractions ([CXL](https://cxl.com/blog/quick-course-on-effective-website-copywriting/)). (Wendell's copy already does this — keep the "Thursday, eight minutes, the volunteer" texture.)
- **"You," not "we."** "Redesign the game you're playing," not "We built a framework."
- **Use the buyer's words; kill hype and superlatives** — "the best," "world-leading," etc. destroy credibility even when true ([CXL](https://cxl.com/blog/quick-course-on-effective-website-copywriting/)).
- **Rhythm:** vary sentence length; let short lines land the emotional beats.

### 8.8 FAQ sections

FAQs are a **friction-removal tool**. Shopper questions cluster around **risk**: will it fit my situation, what if it doesn't work, what exactly do I get ([Yuma](https://yuma.ai/blogs/what-shoppers-ask-before-they-buy-a-research-backed-guide-to-reducing-sales-friction-with-ai); [NN/g](https://www.nngroup.com/reports/ecommerce-user-experience/)). Answer each **at the moment it arises**. For MTGOA specifically, include: *"Do I need the book to use the deck?", "Physical or digital?", "How do the expansion packs work?", "Who's coaching for?", "Can I do this without any AI?"* (the last one matters for this audience). Treat the FAQ as your last objection-handling pass.

### 8.9 Reusable copy formulas

**1. Headline (problem→outcome, cold-safe):** `Still [painful current state]? [Product] gives you [specific outcome] — [without feared cost], even if [top objection].`
**2. Feature→Benefit (BFA + "So what?"):** `[Reader benefit], because [feature] — so you [emotional outcome].`
**3. Before-After-Bridge:** `Right now, [old game]. Imagine instead [after]. [Product] is the bridge: [mechanism in one line].`
**4. Risk-reversal:** `Try [product] for [timeframe]. If you [don't get the promised result], email me and I'll refund every cent.`
**5. Who-it's-for / not-for:** `This is for you if [3 reader-mirroring situations]. It's not for you if [1–2 honest disqualifiers].`

**Sources:** awareness — [Between the Lines](https://betweenthelinescopy.com/blog/stages-of-awareness/), [Duo Strategy](https://www.duostrategyla.com/ideas/how-to-write-high-converting-ad-copy-the-complete-5-stage-framework-with-examples) · headlines — [BDOW/Sumo](https://bdow.com/stories/headline-formulas/), [GetResponse](https://www.getresponse.com/blog/copywriting-landing-page-conversions), [Thrive Themes](https://thrivethemes.com/copywriting-formulas/) · features/benefits — [MRY](https://mrymarketing.com/blog/features-vs-benefits-technical-product-copywriting), [Drop Dead Copy](https://www.dropdeadcopy.com/features-vs-benefits/), [The Copy Brothers](https://thecopybrothers.com/blog/copywriting-frameworks/) · objections/risk — [Boagworld](https://boagworld.com/marketing/objection-handling/), [HubSpot](https://blog.hubspot.com/sales/handling-common-sales-objections), [SPOTIO](https://spotio.com/blog/risk-reversal-language-punches-your-ticket-to-32-higher-win-rates/), [River](https://rivereditor.com/blogs/guarantee-risk-reversal-paragraphs-remove-90-percent-objections), [Social Triggers](https://socialtriggers.com/guarantees/), [Quicksprout](https://www.quicksprout.com/what-converts-better-free-trial-versus-money-back-guarantee/) · social proof — [CXL](https://cxl.com/blog/is-social-proof-really-that-important/), [Greedier Social Media](https://greediersocialmedia.co.uk/social-proof-for-creators-guide/), [CreatorDB](https://creatordb.app/blog/the-psychology-of-social-proof-marketing/) · structure — [Kit](https://kit.com/resources/blog/sales-page) · pricing — [Webfor](https://webfor.com/blog/the-psychology-of-pricing-in-e-commerce-marketing/), [Clootrack](https://www.clootrack.com/blogs/11-proven-psychological-pricing-strategies-examples-2024), [MBC](https://mbc-builder.com/blog/bundle-pricing-psychology), [Heartbeat](https://www.heartbeat.chat/article/pricing-psychology-for-communities) · voice — [CXL](https://cxl.com/blog/quick-course-on-effective-website-copywriting/) · FAQ — [Yuma](https://yuma.ai/blogs/what-shoppers-ask-before-they-buy-a-research-backed-guide-to-reducing-sales-friction-with-ai), [NN/g](https://www.nngroup.com/reports/ecommerce-user-experience/). *(Some sources — CXL, Kit, The Copy Brothers, Heartbeat — 403 automated fetches; drawn from indexed search excerpts. All URLs are human-accessible.)*

---

## 9. Image direction (per product)

**System (all products):** dark-warm background, element/gold/purple accents, Jost display type,
oracle/field-guide aesthetic. Export **cover 1280×720** + **thumbnail 1080×1080** (confirm current
Gumroad cover spec from §7). Keep a consistent frame/treatment across the line so the storefront
reads as one system.

| Product | Cover concept | Thumbnail | Existing asset to match |
| :-- | :-- | :-- | :-- |
| Deck — Digital | Fan of 3 real cards (water/fire/liminal), gold edge-glow on black | Single hero card | `allyship-deck-cover/-thumbnail` |
| Deck — Physical | The printed deck stacked/fanned on a dark table, tactile | Boxed deck | derive from deck art |
| Book — Digital | Front cover floating, water-blue rim light | Cover straight-on | `cover-front.png` |
| Book — Physical | Printed book at an angle, spine + shadow, warm earth tone | Cover | `cover-front.png` |
| Founding Ally | The full stack together (book + handbook + pin + deck), warm hero | Pin or stack | `founders-bundle-cover/-thumbnail` |
| Coaching | Wendell portrait, warm/earthy, "in the middle of it" | Portrait crop | `/mastering-allyship/wendell.jpg` |
| Superpower packs | Each pack in its **arc-accent** hue (not element color), single icon/sigil | Sigil on accent | new — 7 variants, one system |
| RPG Handbook | Handbook cover, metal/slate, "rules" feel | Cover | `rpg-book-cover/-thumbnail` |

For AI image generation (done in the handoff session), give each a prompt seeded with: the palette
hexes (§2), Jost display type, the element/accent for that product, and "dark warm, field-guide
meets tarot, not corporate."

---

## 10. Kickoff prompt for the regular-Claude session

> Paste this to start the deep copy pass on the MTGOA project:

```
You're writing Gumroad product-page copy for "Mastering the Game of Allyship" — a book, a 120-card
Allyship Oracle deck, superpower expansion packs, a Founding Ally bundle, and 1:1 coaching.

Voice: a tighter, conversion-cut of the attached sales letter — same worldview (allyship is a
"game you were handed that was never built for you to win"; the move is to redesign it — "care by
design, not obligation"), same Wendell Britt voice: literary but direct, second-person, concrete
over abstract, dry disarming honesty, never hype. Reader = COLD buyers who don't know Wendell or
the Kickstarter, so each page sells from scratch. NEVER use "AI" as a selling point (the community
is allergic to it) — sell the moves, the practice, the transformation.

For each product I give you, write: (1) title, (2) one-line tagline/hook, (3) a scannable
description (hook → problem → what it is → what's inside → who it's for → credibility → price
justification → CTA), (4) a 3–5 question FAQ that dissolves a real objection. Use bold + bullets,
keep it tight. Then suggest a cover-image concept in the house aesthetic (dark-warm, gold #C9A84C /
purple #7c3aed / element colors, Jost display type, field-guide-meets-tarot).

Start with the Oracle Deck (digital) — it's the flagship. Here are the current copy, the product
facts, and the first drafts: [paste §1, §2, §5, §6 of the handoff].
```

---

*Assembled from `src/lib/launch/offers.ts`, `src/lib/launch/page-content.ts`,
`src/app/mastering-allyship/page.tsx`, `src/lib/launch/deck-sales-copy.ts`, and
`src/lib/superpowers/types.ts`. Research §7–§8 added from fresh web research.*
