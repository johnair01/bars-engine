# Spec: Allyship Deck Experience (Sales → App)

> Source: design handoff `Mastering_the_Game_of_Allyship_Book.zip` →
> `design_handoff_deck_experience/` (HTML prototypes + `deck-data.json`). The `.dc.html`
> files are **design references** — recreated as React against the real data + DS primitives.

## Purpose

Turn the (already-authored) 120-card Allyship Deck into a shippable product: a deck **Sales**
landing page that funnels into purchase, and a high-fidelity **card app** (Draw / Browse /
Find-a-card / Card detail → Send to BARS).

## Ground truth (do not re-author)

- **Deck content is real & committed:** `public/allyship-deck/allyship-deck.json` — 120 move
  cards (all `status:"authored"`) + 27 instruction + 6 problems. Built by
  `scripts/assemble-allyship-deck.ts`. `operation` IS the face (no separate mapping).
- **Card app exists** at `/deck` (`AllyshipDeckReader`) — functional but low-fidelity
  (handbook tokens, no gold-edge card anatomy, no Send-to-BARS).
- **Commerce is Gumroad** (`/launch`, the converged funnel). The handoff's in-app
  checkout/auth is **not** built — purchase routes to Gumroad (host decision).

## Design decisions (host)

1. **Commerce → Gumroad `/launch`.** No mock in-app checkout/auth; Sales CTAs hand off to
   the real Gumroad offers. (README defers pricing/SKUs to "the commerce layer.")
2. **Build the card primitive first** — both Sales (fan hero) and the app depend on it.
3. **`reward`/`minutes` are game mechanics, not deck data** — never fabricated on the card;
   they come from the quest/BAR layer (Send to BARS).

## Card anatomy (from the prototype)

Element-tinted body + **gold 2px edge** (`#C9A84C`) + inset-top highlight + element glow.
Banner (title) → marks row (circular **move pip** holding the move glyph, left; squared
**face badge** monogram, right) → `◇ domain` → body (the question) → **"The practice"** well
(`remediation`) → foot (`id` · `→ {outputBar} ♦`). Move→element: Show=Fire, Grow=Wood,
Clean=Water, Wake=Earth, **Open=Liminal purple** (reserved; not an element).

## Slices

- **Slice 1 (this branch) — the card primitive + preview.** `card-visuals.ts` (pure: move→
  element, face colors, glyph paths, brand constants), `MoveIcon` / `MovePip` / `FaceBadge`,
  `AllyshipCard` (`grid` + `full`), and an **unauthenticated** `/deck/preview` gallery of all
  120 cards (also fixes "design can't find the cards"). Unit-tested incl. full-deck coverage.
- **Slice 2 (done) — the card app upgrade.** Rebuilt `/deck` (`AllyshipDeckReader`) on the
  new card: Draw (face-down → 420ms flip → reveal), Browse (filter chips), Find-a-card (the
  authored `problems[]`), card detail overlay with the practice well. Deck layout now loads
  the handoff fonts + scrolls. (The old serif "Guide"/instruction-card tab was dropped to
  match the handoff's Draw/Browse/Find nav; instruction cards remain in the JSON.)
  **Send to BARS** is the detail's remaining seam → slice 3.
- **Slice 3 (done) — Send to BARS.** `buildDeckSeed` (pure) turns a card into a quest seed
  (title, practice+question description, provenance); `sendDeckCardToBars` creates a private
  `CustomBar` (type `vibe`) with the card stamped into `agentMetadata`, then routes to
  `/bars/{id}` — where capture-charge / 3·2·1 already live. Card text is read from the
  authoritative `assembleDeck()`, not the client. Button on the drawn card + detail overlay.
- **Slice 4 (done) — deck Sales landing page.** `/deck/sales` (public): fan-of-3 hero (real
  cards via `DeckFanHero`), the five-move strip, how-it-works (Draw → Practice → Send to BARS),
  and campaign social proof — all CTAs hand off to the Gumroad funnel at `/launch`. Copy +
  figures live in `lib/launch/deck-sales-copy.ts` (single source, honest-by-default). The deck
  paywall now offers a "What's in the deck?" link into the page (`Paywall.learnMoreHref`).

- **Slice 5 (next) — App shell upgrade + Collection/Journal.**
- **Slice 6 (next) — Find your path (CYOA situation reading).**
- **Slice 7 (next) — Card anatomy upgrades (`num`, card footer spec).**
- **Slice 8 (next) — Spread draw mode.**

## Deferred / not built

- Final operation/face **sigil art** (monogram placeholders today).
- Real in-app checkout/auth (using Gumroad). See note on sales branding below.
- Webfonts (Jost/Nunito/Space Mono) — `card-visuals.DECK_FONTS` falls back gracefully.
- `reward` / `minutes` card footer stats — omitted until the BAR layer computes real values; see Slice 7.

## Verification

`npm run test:allyship-deck` (assembler + card-visuals, covers all 120). Visual: `/deck/preview`.

---

# Spec: Allyship Deck — Slices 5–8

> Source: design handoff `Mastering_the_Game_of_Allyship_Book_1.zip` →
> `design_handoff_deck_experience/` (second pass). Host decisions recorded below supersede
> any conflicting design-prototype choices.

## Host Decisions (established 2026-06-18)

1. **Card data schema stays.** `public/allyship-deck/allyship-deck.json` (built by
   `scripts/assemble-allyship-deck.ts`) remains authoritative. The handoff's `deck-data.json`
   uses different field names (`q`, `action`, `face`, `el`, `gather` etc.) — write adapter
   functions rather than migrating the schema. Never re-author card content from the prototype.

2. **`reward` / `minutes` — omit for now.** The design shows `{minutes} MIN · ♦ {reward}` on
   every card footer. These are computed by the BAR/quest layer, not the deck. Until that data
   is wired, omit the footer stat row entirely. The spec note below documents what to restore.

3. **Journal persistence — server-side.** Draw history lives in a new `DeckJournalEntry` Prisma
   model (not localStorage). Players who own the deck (`deck-digital` capability) get cross-
   device streak and history. Non-owners see the paywall.

4. **BARS handoff — hand or vault, not category routes.** The existing `SendToBarsButton` flow
   (creates a `CustomBar`, routes to `/bars/{id}`) is correct. Do NOT route to `/adventure`,
   `/conclave`, etc. The design's theatrical "Handing off to BARS" screen is not built; the
   existing silent server-action model stays.

5. **`open_up` → liminal purple.** The existing `card-visuals.ts` treatment is correct: `open_up`
   maps to the reserved liminal purple (`LIMINAL` constant), not a wuxing element. No change.
   In CYOA channel logic, the 5 wuxing channels map to moves as: 火→show_up, 水→clean_up,
   金→open_up, 土→wake_up, 木→grow_up.

6. **Subject toggle stays.** The self/campaign subject toggle remains in the app.

7. **Nav is local to `/deck`.** The 4-tab nav shell (Draw · Deck · Find your path · Collection)
   lives inside the `/deck` page/component, not a global layout. Branding style: BARS engine
   design system (gold active chip, inset inactive, mono label text) — not a fresh component.

8. **Sales stays deferred; match the vibe.** `/deck/sales` exists and routes to Gumroad. No
   new in-app purchase flow. **Research note:** investigate how far Gumroad's hosted checkout
   can be branded (custom CSS, overlay, embed) to match the BARS dark-warm aesthetic. Capture
   findings in `docs/GUMROAD_BRANDING_RESEARCH.md` before the next commerce sprint.

---

## Slice 5 — App shell upgrade + Collection / Journal

### Purpose

Four-tab app shell local to `/deck`. Server-persisted draw journal with streak and Vibeulon
balance. Reminder toggle (client-only).

### App shell changes (`AllyshipDeckReader`)

- Nav becomes **4 tabs**: Draw · Deck · Find your path · Collection.
  - "Browse" → "Deck" (label only).
  - "Find a card" → "Find your path" (label + view rename; the CYOA replaces the problems flow
    in Slice 6; for now it can render a "coming soon" stub or keep the problems flow behind the
    new label as an interim).
  - "Collection" — new tab, new view.
- **Streak + balance** display in the top-right of the app bar: `● {n}d ♦ {balance}`.
  - Streak = count of consecutive calendar days on which ≥1 card was drawn (from journal).
  - Balance = sum of `vibeulons` on all `DeckJournalEntry` records for the player (static `1`
    per draw to start; real values come from the BAR layer later).
  - Both are server-fetched (RSC pass or server action on mount).
- Top bar layout: `B BARS · DECK` brand mark (links → `/deck/sales`) | centered tab nav | right
  streak+balance. Sticky. Max-width 1180px, same surface as existing reader.
- Subject toggle stays below the top bar (above view content), same as today.

### Data model — `DeckJournalEntry`

```prisma
model DeckJournalEntry {
  id         String   @id @default(cuid())
  playerId   String
  cardId     String   // MoveCard.id e.g. "SHOW-DA-SAGE"
  drawnAt    DateTime @default(now())
  vibeulons  Int      @default(1)
  player     Player   @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([playerId, drawnAt(sort: Desc)])
}
```

Migration name: `add_deck_journal_entry`.

### Draw — journal integration

- After `drawCard()` resolves (420ms flip), call a server action `recordDraw({ cardId })` that
  creates a `DeckJournalEntry` for the authed player. Fire-and-forget (don't block reveal).
- Streak and balance re-fetch after each draw (revalidate or optimistic update).
- Non-authed users can still draw but journal is not persisted (graceful degradation).

### Collection view (`appView='collection'`)

- Header: "Your collection" + "{n} cards drawn" count (right-aligned).
- Stats strip (3 tiles): **Current Streak** `{n} days` | **Vibeulons** `♦ {balance}` |
  **Reminder** toggle + label.
- Journal grid (`repeat(auto-fill, minmax(178px, 1fr))`): each entry renders an `AllyshipCard`
  (grid variant) with a `when` label above (`TODAY` / `YESTERDAY` / `{n} DAYS AGO` / date
  string) and a `SHARE` chip in the card footer slot.
- Sort: most recent first.
- Empty state: dashed inset panel — "No cards drawn yet." + "Go draw →" CTA.
- Pagination/infinite scroll: load 20 at a time; "Load more" button (not infinite scroll for
  now — simpler).

### Reminder toggle

- Client-only (`localStorage` key `deck-reminder-enabled` + `deck-reminder-time`).
- Pill switch (liminal when on). Default time "8:00 AM".
- No push notification wiring in this slice (toggle is UI-only; future slice handles scheduling).

### Share chip (stub)

- Renders a `SHARE` button on collection cards.
- In this slice: copies `masteringallyship.com/c/{cardId}` to clipboard (the URL format from
  the design). Share modal (full image download etc.) is deferred to a later slice.

### Verification

- `/deck` → Collection tab shows journal entries after drawing.
- Streak increments correctly on consecutive days (unit-test the streak helper).
- Vibeulon balance displays.
- Empty state shown for new accounts.
- Reminder toggle persists across page reload.

---

## Slice 6 — Find your path (CYOA situation reading)

### Purpose

Replace the "Find a card" problems flow with a 4-phase branching intake that reads the player's
situation and lays a 3-card spread. The "Find your path" tab routes here.

### Phases

```
landing → step0 → passage (Q1, Q2) → result
```

Gold progress bar (`0% / 30% / 66% / 100%`) shown during the flow (not on landing).

#### Landing

- Eyebrow: `FIND YOUR PATH · A SITUATION READING`
- H2: "What kind of allyship / is being asked of you?"
- Sub: "You showed up because something's stuck."
- CTA: "Begin the reading →" → step0

#### step0 — The check-in

Single screen, two inputs:

**Intensity slider** (1–10)
- Label: `HOW INTENSE IS IT RIGHT NOW?`  ends: `FAINT` ← → `OVERWHELMING`
- Live italic readout below the track using `RATING_LABELS`:

```ts
const RATING_LABELS: Record<number, string> = {
  1: 'Barely there — a whisper of friction.',
  2: 'Mild — something's slightly off.',
  3: 'Low — noticeable but manageable.',
  4: 'Moderate — it's asking for attention.',
  5: 'Present — noticeable, pulling at me.',
  6: 'Significant — harder to set aside.',
  7: 'Heavy — requires real effort to hold.',
  8: 'Heavy — it's taking real effort to carry.',
  9: 'Intense — it's running the room.',
  10: 'Overwhelming — it's all I can feel.',
}
```

**Flavor of dissatisfaction** (pick one)

Shown as selectable rows. Each row: wuxing sigil glyph + label + description. Mapped internally:

```ts
const FLAVORS = [
  { id: 'sadness',     sigil: '水', label: 'Sadness',      desc: 'Heavy — grief, something feels distant',  face: 'sage',       move: 'clean_up' },
  { id: 'anger',       sigil: '火', label: 'Anger',        desc: 'Heated — a boundary's been crossed',      face: 'challenger', move: 'show_up'  },
  { id: 'fear',        sigil: '金', label: 'Fear',          desc: 'Anxious — dread, bracing for it',         face: 'diplomat',   move: 'open_up'  },
  { id: 'numbness',    sigil: '土', label: 'Numbness',      desc: 'Shut down — going through the motions',  face: 'regent',     move: 'wake_up'  },
  { id: 'restlessness',sigil: '木', label: 'Restlessness', desc: 'Forced — performing okay-ness',           face: 'architect',  move: 'grow_up'  },
] as const
```

"Continue →" is disabled until a flavor is selected.

#### passage — Two branching questions

Render one question at a time. Each has mythic prose + 2–3 lettered choices, each choice tagged
with a `move` and `domain` bias. Choosing one accumulates biases into `cyChoices`.

```ts
const PASSAGES: PassageDef[] = [
  {
    id: 'scene',
    prose: 'The friction lives somewhere. Where does it sit?',
    choices: [
      { letter: 'A', text: 'In the room — it's between people.',       move: 'show_up',  domain: 'DIRECT_ACTION'        },
      { letter: 'B', text: 'In me — I'm carrying it alone.',           move: 'clean_up', domain: 'GATHERING_RESOURCES'  },
      { letter: 'C', text: 'In the structure — the system is broken.', move: 'wake_up',  domain: 'SKILLFUL_ORGANIZING'  },
    ],
  },
  {
    id: 'arrival',
    prose: 'What does a good outcome look like, just for today?',
    choices: [
      { letter: 'A', text: 'I took one concrete step.',            move: 'show_up',  domain: 'DIRECT_ACTION'   },
      { letter: 'B', text: 'I understand what's actually going on.', move: 'wake_up',  domain: 'RAISE_AWARENESS' },
      { letter: 'C', text: 'I'm less tangled inside.',             move: 'clean_up', domain: 'RAISE_AWARENESS' },
    ],
  },
]
```

#### result — 3-card spread

**Scoring algorithm** (`computeCyoaSpread`):

Each move card receives a weight. Inputs: `flavor` (→ face + move), `cyChoices` (array of
{move, domain} from passage answers). Three positions are filled in order:

| Position | Label | Move bias |
|---|---|---|
| 0 | The Situation | wake_up |
| 1 | The Block | clean_up |
| 2 | The Move | show_up, grow_up, open_up |

```ts
function scoreCard(card: MoveCard, ctx: CyoaContext, positionBias: BasicMove | BasicMove[]): number {
  let w = 0
  // Face match from flavor
  if (card.operation === ctx.flavorFace) w += 3
  // Move bias from position
  const biases = Array.isArray(positionBias) ? positionBias : [positionBias]
  if (biases.includes(card.move)) w += 6  // position preference
  // Move + domain bias from passage choices
  for (const choice of ctx.choices) {
    if (card.move === choice.move) w += 2
    if (card.domain === choice.domain) w += 1
  }
  // Channel (flavor) move match
  if (card.move === ctx.flavorMove) w += 2
  return w
}
```

Pick the top-scoring card per position, de-duplicating across positions (no card appears twice).
Tie-break: first in deck order.

**Result screen:**

- "Your situation has been read."
- Readout sentence: `"The {flavor.label.toLowerCase()} you named points toward a {MOVE_LABELS[spread[2].move]} move."`
- 3-card spread grid (labeled THE SITUATION / THE BLOCK / THE MOVE), each an `AllyshipCard`
  `grid` variant, clickable to detail overlay.
- CTAs: **"Begin your adventure →"** (sends the Move card to BARS via existing `SendToBarsButton`
  logic) + "Read again" (resets to landing).

### State

```ts
type CyPhase = 'landing' | 'step0' | 'passage' | 'result'

interface CyoaState {
  phase: CyPhase
  rating: number             // 1–10, default 5
  flavor: typeof FLAVORS[number] | null
  passageIndex: number       // 0 or 1
  choices: { move: BasicMove; domain: AllyshipDomain }[]
  spread: [MoveCard, MoveCard, MoveCard] | null
}
```

### Verification

- All 5 flavors × both passage paths produce a valid 3-card spread (no duplicates, all cards
  from real deck).
- "Continue →" disabled until flavor selected.
- Progress bar advances: 0% landing / 30% step0 / 66% passage / 100% result.
- Unit-test `computeCyoaSpread` for de-duplication and scoring invariants.

---

## Slice 7 — Card anatomy upgrades

### Card number (`num`)

The design shows `#{num}` (e.g. `#001`) in the card footer. Add to the data pipeline:

1. Add `num: string` to `MoveCard` in `src/lib/allyship-deck/types.ts`.
2. Assign sequentially in `scripts/assemble-allyship-deck.ts` (zero-padded to 3 digits, ordered
   by move → domain → operation, matching the existing deck-data ordering).
3. Render in `AllyshipCard` footer (grid and full variants): `#{card.num}` in `.bars-label` mono
   style, muted text.

### `reward` / `minutes` footer — stub + future hook

The design shows `{minutes} MIN · #{num}  ♦ {reward}` in the card footer.

**Current:** omit the `minutes` and `♦ reward` values. Render only `#{num}`.

**Future hook (document in code, do not implement now):**

```ts
// When the BAR layer provides these, restore the footer:
// {card.minutes} MIN · #{card.num}   ♦ {card.reward}
// Source: DeckJournalEntry.vibeulons (per-draw reward) and
//         a `minutes` field added to MoveCard when quest data is wired.
```

### Adapter layer

The handoff `deck-data.json` uses short field names (`q`, `action`, `face`, `el`, `gather`
etc.). If any component needs to render from handoff data directly (e.g. a future import flow),
provide adapter functions in `src/lib/allyship-deck/handoff-adapter.ts`:

```ts
// Converts handoff deck-data.json card shape → MoveCard (best-effort;
// fields without equivalents are omitted or defaulted).
export function adaptHandoffCard(raw: HandoffCard): Partial<MoveCard>
```

The adapter is not needed for Slices 5–8 (all rendering uses the authoritative JSON), but
documents the mapping for future data migrations.

### Verification

- All 120 cards have a unique `num` (001–120).
- `#{num}` renders in grid and full card footers.
- No `reward` or `minutes` values appear on cards.

---

## Slice 8 — Spread draw mode

### Purpose

Add a "Spread · 3 cards" mode toggle to the Draw view. Spread mode does not draw blindly — it
gates the user into the "Find your path" CYOA (Slice 6), where the 3-card result is the spread.

### Draw mode toggle

Below the streak/reminder strip:

```
[ DAILY · 1 CARD ]   [ SPREAD · 3 CARDS ]
```

Active chip: gold fill + `#150a04` text (same as filter chip active style). Inactive: inset
surface + hairline + secondary text.

### Single mode (existing behavior, no change)

Face-down deck back → "Shuffle & draw" → 420ms flip → reveal. Unchanged.

### Spread mode

- Three dashed placeholder cards (200×288 each) in a row, showing card-back silhouettes.
- Copy below: "A spread reads your situation. The deck can only lay them once it knows the
  moment being asked of you."
- CTA: **"Begin the reading →"** → switches to Find your path tab at `landing` phase. After
  the CYOA result, the spread renders there (not back in Draw).

### State

Add `drawMode: 'single' | 'spread'` to `AllyshipDeckReader` local state. Default `'single'`.

### Verification

- Toggle switches modes without resetting drawn card in single mode.
- Spread mode CTA navigates to Find your path landing.
- CYOA result renders the 3-card spread (Slice 6).

---

## Deferred (updated list)

- Final operation/face sigil art (monogram placeholders).
- Real in-app checkout/auth (Gumroad). Investigate Gumroad CSS branding.
- Webfonts (Jost/Nunito/Space Mono).
- `reward`/`minutes` footer stats (BAR layer dependency).
- Share modal (full image download + post-to-feed; Share chip in Slice 5 copies link only).
- Push notification scheduling for reminder toggle.
- Infinite scroll on Collection (Load More button for now).
- Theatrical BARS handoff screen (existing `SendToBarsButton` flow is correct).
- Sales/Purchase/Auth funnel pages.
