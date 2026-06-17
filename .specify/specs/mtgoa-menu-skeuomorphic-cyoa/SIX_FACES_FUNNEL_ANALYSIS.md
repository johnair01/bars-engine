# Six-Faces Analysis — MtGoA Spokes ⟶ the July 18 Funnel

> Resolves the open card-face question (C8 / T0.5) in [design-intake.md](./design-intake.md).
> Question: *how should the eight MtGoA spoke cards serve the July 18 launch + barn-raising
> funnel* — without becoming an extractive sales funnel (Portland ethos; development first).
> Faces per the project's GM model: **Shaman · Regent · Challenger · Architect · Diplomat · Sage.**

## Inputs

**The eight spokes** (`data/mtgoa_quest_map.json`, Kotter 1→8):

| # | Spoke | Domain | Feeling |
|---|---|---|---|
| I | 📞 Answer the Call | Raise Awareness | Poignance, Excitement |
| II | ⚡ Know Your Charge | Raise Awareness | Poignance, Bliss |
| III | 🌑 Compost the Shadow | Raise Awareness | Poignance, Peace |
| IV | 🎯 Make Your Move | Direct Action | Excitement, Triumph |
| V | 🎭 Choose Your Role | Skillful Organizing | Excitement, Bliss |
| VI | ✨ Find Your Superpower | Skillful Organizing | Triumph, Bliss |
| VII | 🏆 Complete a Quest | Direct Action | Triumph, Excitement |
| VIII | 🎲 Design the Game | Skillful Organizing | Triumph, Bliss, Peace |

**The funnel** (the barn): Wall 1 car ($8,500) · Wall 2 pre-sale (book/RPG/deck/app/pins/bundle) ·
Wall 3 runway (patron tiers → Dojo) · party tickets ($30). Plus the verification quests that
*advance the Bruised Banana fundraiser* by design.

## The central finding

**The Kotter arc is already the funnel ladder.** The spokes move awareness → action → role →
mastery → co-creation; the funnel moves stranger → first gift → patron → co-creator. They are
the *same arc*. So the funnel hook on each card is not a bolt-on — it is the **natural
destination of that spoke's developmental move**. This is "composting, not necromancy": the
sell is congruent with the practice, or it isn't there.

## The six faces

### 🜂 Shaman — the felt field
The deck must open as *practice*, not a storefront. The funnel marker on each card is a quiet
**wayfinding tint** (which wall this path eventually serves), never a buy-button on the table.
The felt question stays "what's alive in you?" — a player draws a card for the *move*, and the
gift appears only *inside* the spoke, once earned. One door at a time; the table is calm.

### 👑 Regent — sovereignty & contract
Each card declares **one** congruent funnel relationship, not many. The rule: a card may point
at exactly one wall/offer, chosen because it is the honest expression of that spoke's move
(below). No card cross-sells everything. The "Draw" affordance governs; the funnel ribbon is a
label, not a competing CTA.

### ⚔️ Challenger — friction & avoidance
A funnel that lets everyone browse forever converts no one *and* serves no development. The
Challenger's gift: the **conversion spokes (IV, VII)** must name the ask plainly — "make your
move" *is* "raise a plank"; "complete a quest" *is* "advance the barn." But the ask must be
refusable without shame (non-pressure, PPT FR3a). Friction = clarity of the ask, not a
countdown.

### 📐 Architect — structure & composition
Map the eight cards to **four funnel bands** so the deck composes cleanly: **Free doors (I–III)**,
**First gift (IV)**, **Become (V–VI)**, **Co-create (VII–VIII)**. The card-face ribbon's color
reuses the barn's wall tokens (amber=car, emerald=pre-sale, violet=runway), so the deck and the
barn are visibly the same system. No new color tokens; reuse `BARN_WALLS` accents.

### 🤝 Diplomat — the relational field
Locate the player before asking. Early cards (I–III) ask nothing but presence; the relational
asks (tickets, patron roles, Dojo) live on the *later* cards once trust exists. **Choose Your
Role (V)** is the diplomatic hinge — patron tiers are literally "roles," so giving reads as
*joining a guild*, not paying a toll. Consent-first throughout (opt-in names, refusable asks).

### 🦉 Sage — the integrative pattern
Distill, don't accumulate: one **wayfinding tint + one verb** per card, not a feature list. The
deck tells one story across its eight cards — *you arrive, you practice, you act, you take a
role, you master, you design with us* — and the funnel is simply where each stage of that story
naturally lands. The party is the moment the whole deck is "played" together.

## Synthesis — per-spoke funnel mapping (the card-face decision)

| # | Spoke | Funnel band | Congruent hook (the spoke's natural destination) | Wall tint |
|---|---|---|---|---|
| I | Answer the Call | **Free door** | RSVP to July 18 + read the book preview (`/handbook`) | neutral |
| II | Know Your Charge | **Free door** | Play the app free (`/game`) — feel the charge mechanic | neutral |
| III | Compost the Shadow | **Free door** | Go deeper — a taste of the Dojo's metabolizing practice | violet (soft) |
| IV | Make Your Move | **First gift** | "Make your move" = **raise a plank** (any wall; car is priority) | amber |
| V | Choose Your Role | **Become** | The **patron tiers ARE roles** (Raftermate→Keystone) | violet |
| VI | Find Your Superpower | **Become** | Your tools — **pre-sale** deck / RPG / book / bundle | emerald |
| VII | Complete a Quest | **Co-create** | Run a **verification quest** that *advances the barn* | amber/emerald |
| VIII | Design the Game | **Co-create** | The **Allyship Dojo** (Keystone) + Founder Bundle — design for others | violet |

### Card-face content (resolves C8 / T0.5)
Each `CultivationCard` in the deck shows, at a glance:
1. **Roman numeral + title** (identity) — e.g. "IV · Make Your Move".
2. **Emoji/sigil + Kotter stage** (small marker).
3. **One feeling chip** (the spoke's predicted feeling) — keeps the emotional truth.
4. **A quiet funnel ribbon** — the single congruent hook above, tinted with its **wall token**
   (amber/emerald/violet/neutral). It is wayfinding, not a CTA — the real ask lives *inside* the
   spoke. Free doors carry a neutral "Begin free" ribbon.
5. **"Draw →"** affordance in the thumb zone (the only button on the face).

Element color = **player's nation** (per intake); the wall tint is a *small ribbon accent*, not
the frame — so the covenant's element=frame channel is preserved (the ribbon is semantic
wayfinding, not decorative).

## Consequences / follow-ups
- **Spoke list stays as-is** — no rewrite needed; the existing eight already ladder correctly.
- Implementation (FR4) can now proceed: the card component reads spoke data + a small
  `spokeFunnelMap` (this table) → ribbon. Add `spokeFunnelMap` beside `BARN_WALLS`.
- Depends on **MBLD** (barn-raising-live-data) for the live wall destinations of IV/VII/VIII.
- Keep every ask **refusable** (Challenger + non-pressure rule); free doors must outnumber asks
  on first read (Diplomat).
