# Handoff: BARS Engine — v1 BAR Intake (Capture → Keep → Tune) + Decks/Print

> Target repo: **`johnair01/bars-engine`** (Next.js 14 App Router, Prisma, server actions).
> This document is **self-sufficient** — a developer who wasn't in the design conversation can build from it alone. The HTML files in this bundle are visual references; this README is the contract.

---

## 1. Overview

We are shipping the **front door to the game's core loop**: capturing an emotional *charge* as a **BAR**, keeping it with zero friction, and later *tuning* it through three channels (element / altitude / move) so it becomes playable game data. The thesis: **a capture that feels good is the only thing that drives dogfooding, and dogfooding is the only fuel that moves the milestones.**

Three things ship in v1:

1. **Capture → Keep → Tune** core loop (the priority — reskin + a small amount of new wiring).
2. **The 5th move, "Open Up"** — a threading change across the move model.
3. **Stories canvas composer** — the draggable-text composer that turns a BAR into a shareable visual (Stories / video / deck / print). Pulled into scope.
4. **Decks / Print / QR** — turning kept BARs into curated decks and physical cards.

The engine **already has the spine** — a BAR intake route, create actions, the `CustomBar` model with every channel column, and the maturity state machine. v1 is mostly **reskin + wire**, not new infrastructure. **The core loop (Capture → Keep → Tune) needs no DB migration** — every channel rides existing columns. The **only migration in this handoff** is the Stories composer's nullable `captureDesign` JSON column (§8).

---

## 2. About the design files

The files in `prototypes/` are **design references created in HTML** — they show intended look and behavior. They are **not** production code to copy directly. The task is to **recreate these designs inside the bars-engine Next.js codebase** using its existing patterns (server components + server actions, Prisma, the `cultivation-cards.css` aesthetic, the design-system primitives), not to ship the HTML.

| File | What it is |
|---|---|
| `prototypes/BARS v1 Intake - Prototype.dc.html` | **Interactive** click-through of the core loop: Capture → Kept confirmation → Tune, with a live "what persists in `db.customBar`" payload panel. This is the canonical spec for the two build screens. |
| `prototypes/BARS v1 Intake - Implementation Plan.dc.html` | The sprint plan: what exists, the five gaps, the four build blocks, and per-screen specs. |
| `prototypes/BARS Intake and Decks.dc.html` | The wider vision: one captured BAR → quest, deck entry, printed card, book artifact; QR brings any of them home. Covers the decks/print/QR scope. |
| `prototypes/Elements and Emotional Alchemy.dc.html` | The ontology reference: the five elements/nations, the moves (incl. the new **Open Up**), and altitude. Surfaced from the Tune screen as a "how elements channel emotion" link. |
| `MVP_SHIP_PLAN.md` | Broader game-loop MVP definition-of-done and smoke tests (auth, nation/archetype, quest, BAR, vibeulon). Context, not the v1 intake spec. |
| `source_reference/bars.ts` | The **actual** current `src/actions/bars.ts` from the repo — read it before editing. |
| `source_reference/BarCardFace.tsx` | The current BAR card face component. |

**Fidelity: HIGH (hi-fi).** Colors, typography, spacing, and interactions in the prototypes are final. Recreate the UI faithfully using the codebase's `cultivation-cards.css` tokens and the BARS design-system primitives — do not approximate.

---

## 3. ✅ Settled decisions (every previously-open question)

These were the open questions in the design docs. **All are now decided** — build to these:

| # | Decision | Detail |
|---|---|---|
| **Tuning required?** | **Optional to keep; required before a BAR graduates to a quest.** | Capture stays frictionless. A BAR cannot be grown into a quest until all three channels are tuned. `growQuestFromBar()` should refuse an untuned BAR with a clear message. |
| **After Keep, land where?** | **Brief confirmation, then back to the board.** | Show a short "a seed is on the board" confirmation, then return to `/bars`. Tune is offered as an **optional affordance** ("Tune now →"), never forced. (The prototype's old behavior of dropping straight into Tune is superseded.) |
| **Altitude storage?** | **Reuse the existing `intensity` column.** | Values: `'dissatisfied' \| 'neutral' \| 'satisfied'`. **No migration.** |
| **Where does Open Up sit?** | **Before Clean Up.** | Five-move order: **Wake · Open · Clean · Grow · Show.** Open Up is an *aperture* you pass through before you correct — not a stage after Show Up. Completion/ordering logic uses this sequence. |
| **Who can publish curated decks?** | **Vetted authors only at launch.** | Deck publishing is gated to an allow-listed/vetted author role for v1. |
| **Print fulfillment & sizes?** | **MakePlayingCards.com (MPC).** | Design printed cards to MPC **poker** size: **2.5 × 3.5 in**, export at **822 × 1122 px @ 300 dpi** (includes bleed; keep critical art inside the ~2.42 × 3.42 in safe area). |
| **Dev player seeding for graduate?** | **Spec a seed/onboarding step that guarantees `nation` + `archetype`.** | `growQuestFromBar()` already hard-requires `player.nationId` + `player.archetypeId`. Ensure onboarding (or a dev seed) sets both so the graduate path never dead-ends. |

---

## 4. What already exists (don't rebuild) vs. the gap

### Exists — verified against `johnair01/bars-engine@main`

**Routes** (`src/app/bars`): `/bars/create` (today's plain intake form), `/bars` (the board), `/bars/[id]` (detail — where Tune slots in), `/bars/garden` (maturity-aware view).

**Server actions** (`src/actions/bars.ts` — see `source_reference/bars.ts`):
- `createPlayerBar(prevState, formData)` — text/photo BAR (form action). Creates `db.customBar` with `type:'bar'`.
- `createBarForUpload(data)` — BAR for client-side Blob photo upload path.
- `growQuestFromBar(barId)` — graduates a BAR to a `type:'quest'` `CustomBar`; **already guards** on `player.nationId` + `player.archetypeId`.
- `growDaemonFromBar` / `growArtifactFromBar` — other graduation targets (daemon, artifact).
- `listMyBarsForGarden(filters)` — already reads maturity via `parseSeedMetabolization` + `effectiveMaturity` from `@/lib/bar-seed-metabolization`.

**Model** (`prisma/schema.prisma`, `model CustomBar`) — every intake channel already has a column:

| Column | Type | Use |
|---|---|---|
| `title` / `description` | `String` | the captured text (title is derived from first line) |
| `nation` | `String?` | **element** channel |
| `intensity` | `String?` | **altitude** channel (`dissatisfied`/`neutral`/`satisfied`) |
| `moveType` | `String?` | **move** channel (`wakeUp`/`openUp`/`cleanUp`/`growUp`/`showUp`) |
| `archetype` | `String?` | optional archetype tag |
| `emotionalAlchemyTag` | `String?` | name of the charge (e.g. "grief", "relief") |
| `seedMetabolization` | `String?` (JSON) | BSM maturity: `{ soilKind?, contextNote?, maturity?, compostedAt?, releaseNote? }` |
| `createdAt` | `DateTime` | provenance — locked, auto |
| `assets[]` / `socialLinks[]` | relations | photos/sketches · inspiration URLs |

### The gap — what v1 actually changes

| | Gap | Scope |
|---|---|---|
| **G1** | **Aesthetic.** Today's `/bars/create` is black + zinc-700 borders + purple-600 buttons. Target: the "OS-contains-cards" cultivation surface (element-tinted field, inset highlight, provenance strip, "Keep · tune later" CTA). | **IN v1** |
| **G2** | **Maturity not stamped at capture.** `createPlayerBar`/`createBarForUpload` **never write `seedMetabolization`**, so new captures have null maturity and fall out of the garden/gate logic. Fix: stamp `maturity:'captured'` on create. | **IN v1** |
| **G3** | **No provenance ritual.** Stamp the cheap immutable parts: `createdAt` + a derived time-of-day phrase ("dusk"). Place & sensation deferred. | **IN v1** |
| **G4** | **No Tune gate.** Channel columns exist but nothing writes them and there's no screen. Build `/bars/[id]/tune` + a new `tuneBar()` action. | **IN v1** |
| **G5** | **Decks / Print / QR.** Curated decks, MPC print export, QR round-trip. | **IN scope, staged after core loop** |
| **G6** | **5th move "Open Up."** Repo ships four moves (WAVE → wakeUp/cleanUp/growUp/showUp). Thread `openUp` through the move model. | **IN scope** |

---

## 5. Screens

### Screen A — Capture (`/bars/create`)

**Purpose:** keep a charge in **under 10 seconds**. One required thing: text **or** a photo. Everything else optional. Provenance is silent and locked.

**Layout** (mobile-first single column, ~390px frame):
- **Top status strip:** time (mono, tabular) · "NEW BAR" centered uppercase mono label · `♦ <balance>` right.
- **Provenance chip (locked):** a pill — green dot + "provenance locked" + "`<time> · <time-of-day>`" (e.g. "11:42 PM · dusk"). Read-only.
- **The blank card:** a single rounded card (`--bars-radius-lg`) with the load-bearing inset highlight (`inset 0 1px 0 rgba(255,255,255,0.08)`), an element-tinted background that transitions when a field tint is chosen, a full-width `textarea` (18px body font, placeholder *"A line. A scrap. Whatever wants to go on the board."*), and a tiny bottom-left mono tag "untuned seed".
- **Field tint (optional):** label "Field tint — optional, pre-tunes the element" + a row of 5 sigil chips (火 水 木 金 土). Selecting one sets `nation` at capture and tints the card; tapping again clears.
- **Media row (visual affordances):** "◳ Photo" and "❝ Inspiration" buttons → existing photo (Blob upload) and `socialLinks[]` paths.
- **CTA:** full-width primary (liminal purple) button **"Keep · tune later"** — disabled until ≥1 char of text (or a photo). Caption beneath: *"Kept as a `captured` seed. Tuning is never required to keep."*

**Copy is exact — do not reword.** Notably the CTA reads **"Keep · tune later"**, never "Forge".

### Screen B — Kept (confirmation, then board)

**Purpose:** confirm the keep and route back to the board. Replaces "drop straight into Tune".

**Layout:** centered column — a circular wood-tinted glow node with a "◇" mark; headline **"A seed is on the board"** (display, 800); body *"Kept as a `captured` seed, provenance locked. Tune it whenever you're ready — or leave it to compost."*; a small inset card echoing the just-kept text under a "Just kept" mono label. Two actions stacked:
- **Primary (liminal):** **"To the board"** → navigate to `/bars` (the default path).
- **Secondary (ghost / inset outline):** **"Tune now →"** → `/bars/[id]/tune`.

This may be a lightweight interstitial or a toast-then-redirect — the requirement is: a brief confirmation, board is the default destination, Tune is optional.

### Screen C — Tune (`/bars/[id]/tune`)

**Purpose:** three channels turn a raw scribble into game data. Each assignment is **one server write that also advances maturity**. The card preview responds **live**.

**Layout:**
- **Top bar:** back "←" · "TUNE BAR" mono label · maturity short-state right (e.g. "ELABORATED" / "READY", colored liminal when ready).
- **Live `CultivationCard` preview** (centered, ~188px, aspect 5/7): uses `data-element` (from element pick) and `data-altitude` (from altitude pick) so the design-system card glow responds. Shows nation label, altitude short word, the BAR text, and a footer chip row with the move + charge name.
- **Maturity ladder:** 4 pips + a label (`Captured · raw` → `Context named` → `Elaborated` → `Ready to play`).
- **Channel · Name the charge** → `emotionalAlchemyTag`. Text input, placeholder "grief · relief · pride…".
- **Channel · Element** → `nation`. Row of 5 sigil chips. Below: a link row to the elements reference ("how they channel emotion →").
- **Channel · Altitude** → `intensity`. 3 chips: Dissatisfied (raw) / Neutral (working) / Satisfied (paved). Selected chip tints to the element gem and sets the card's `data-altitude`.
- **Channel · Move** → `moveType`. 5 chips: **Wake Up** (notice) · **Open Up** (receive — liminal-accented, the new 5th move) · **Clean Up** (metabolize) · **Grow Up** (capacity) · **Show Up** (act).
- **Graduate CTA:** when all three primary channels are assigned, show a ready/"Show up — enter the game →" affordance that calls `growQuestFromBar()`. Disabled label otherwise: "Assign all three to play".

---

## 6. Data & action contracts (the only server changes)

### 6a. Stamp maturity + provenance on create (G2/G3)

In `createPlayerBar()` **and** `createBarForUpload()`, add to the `db.customBar.create({ data: {...} })` payload:

```ts
// type stays 'bar' (or 'charge_capture' — both are BSM-eligible and pass the maturity guards)
nation: fieldTint ?? null,                 // optional capture-time element tint
seedMetabolization: JSON.stringify({
  maturity: 'captured',
  soilKind: 'holding_pen',
}),
// createdAt is auto — provenance locked.
```

Prefer the `mergeSeedMetabolization()` helper in `@/lib/bar-seed-metabolization` over raw `JSON.stringify` if available. The derived time-of-day phrase ("dusk", "dawn"…) is computed from `createdAt` for display; it does not need its own column.

### 6b. New action `tuneBar()` (G4)

```ts
// src/actions/bars.ts — owner-guarded, BSM-typed
export async function tuneBar(barId: string, patch: {
  nation?: string                // element
  intensity?: string             // altitude: dissatisfied | neutral | satisfied
  emotionalAlchemyTag?: string
  moveType?: string              // wakeUp | openUp | cleanUp | growUp | showUp
}) {
  // 1. auth: bars_player_id cookie (getPlayerId)
  // 2. guard: creator-only + type ∈ {'bar','charge_capture'}
  // 3. db.customBar.update({ where:{id:barId}, data: patch })
  // 4. derive next maturity from which channels are now set, then advance via
  //    updateBarSeedMaturity(barId, next) — maturity only ever moves FORWARD (clamp).
  // 5. revalidatePath('/bars'), `/bars/${barId}`, '/bars/garden'
}
```

**Channel → column → maturity bump:**

| Channel | Column | Advances maturity to |
|---|---|---|
| Element | `nation` | `context_named` |
| Altitude (+ charge name) | `intensity` (+ `emotionalAlchemyTag`) | `elaborated` |
| Move | `moveType` | `shared_or_acted` (ready) |

Maturity phases in order: `captured → context_named → elaborated → shared_or_acted`. **Clamp to the highest phase reached — never regress.** `'integrated'` stays reserved for graduation via `growQuestFromBar()`.

### 6c. Graduate gate (settled decision)

`growQuestFromBar()` already enforces `player.nationId` + `player.archetypeId` (returns *"Complete your profile (nation and archetype) before creating quests."*). **Additionally**, per the settled decision, only allow graduation when the BAR is fully tuned (all three channels set / maturity `shared_or_acted`). Keep capture and keep free of this gate.

---

## 7. The 5th move — "Open Up" (G6)

Add `openUp` as a first-class move, ordered **before** Clean Up: **Wake · Open · Clean · Grow · Show**. It reads as an *aperture* (receive/soften) you pass through before correcting. Touch points for the codebase:

1. **moveType values + labels** — add `'openUp'` everywhere the four moves are enumerated (move config/data files, quest-grammar move configs, the `MoveIcon` set — add a 5th glyph).
2. **Ontology doc** — `.agent/context/emotional-alchemy-ontology.md`: add the Open stage + move rows.
3. **Quest grammar** — `packages/bars-core/src/quest-grammar` (`move-engine.ts`, `move-assignment.ts`, the `MovementType` type) and any `// wakeUp | cleanUp | growUp | showUp` comments (e.g. `prisma/schema.prisma` spoke `move_type`).
4. **Tune gate** — add the Open Up chip (liminal-accented) in Screen C.

Sequence/ordering and completion logic should treat the order as Wake · Open · Clean · Grow · Show.

---

## 8. Stories canvas composer (IN SCOPE)

The draggable-text composer that turns a BAR into a shareable visual. **Now in scope.** Live, working prototype: the **"V1 · live"** phone in `BARS Intake and Decks.dc.html` (drag the text, recolor, resize, swap the element background, share). Build that.

**Purpose:** a BAR is data *and* a canvas. The player arranges their captured text into a poster-like layout they can share to Stories, export as video, or drop into a deck/print — without leaving the cultivation aesthetic.

**This needs the one migration in the whole handoff:** a new nullable JSON column on `CustomBar`.

```prisma
// model CustomBar — add:
captureDesign  String?   // JSON: the composer layout (see shape below)
```

**`captureDesign` JSON shape** (mirrors the prototype's state exactly):

```ts
{
  bg: 'fire' | 'water' | 'wood' | 'metal' | 'earth',   // element background wash
  boxes: Array<{
    id: string,
    x: number, y: number,        // % of canvas (0–100), clamped x∈[2,86] y∈[2,92]
    text: string,                // \n for line breaks
    size: number,                // font px, clamped [11, 46]
    color: string,               // hex or var(--bars-*-gem)
    weight: number,              // 500 | 600 | 700 | 800
    font: 'display' | 'body' | 'mono'
  }>
}
```

**Editor screen** (canvas 5/7 aspect, element-tinted radial background):
- **Drag:** pointer-drag any text box; position stored as % so it's resolution-independent. Tap empty canvas to deselect.
- **Recolor:** swatch row recolors the selected box (element gems + warm neutrals).
- **Resize:** +/- bumps the selected box font size (clamped 11–46).
- **Background:** element chips swap the canvas wash (`bg`).
- **Add/edit text:** a text input feeds new/edited boxes; provenance footer ("11:42 PM · reservoir · dusk") is baked in.
- **Share row (3 targets):** **Stories**, **Video**, **Deck/Print** — the export pipeline below.

**Server:** `saveCaptureDesign(barId, design)` — owner-guarded, writes `captureDesign: JSON.stringify(design)`, revalidates `/bars/[id]`. Editing the design does **not** change maturity.

**Export pipeline:**
- **Stories / image:** render the canvas to a 1080×1350 (4:5) or 1080×1920 (9:16) PNG — server-side (satori/`@vercel/og` or headless canvas) or client `html-to-image`. Element background + boxes positioned by %.
- **Video:** a short (3–6s) MP4/WebM — entry fade-up of the boxes over the element wash. Can be a fast-follow within this slice if image export ships first.
- **Deck / Print:** feed the same `captureDesign` into the MPC card face (§9) and the deck entry.

---

## 9. Decks / Print / QR

From `BARS Intake and Decks.dc.html`. One captured BAR can become: a quest, a **deck** entry, a **printed card**, or a book artifact — and a scanned **QR** brings any of them home to the app.

- **Curated decks:** authoring + browsing of themed decks of BARs. **Publishing is gated to vetted authors** at launch (add an author role / allow-list check on the publish action).
- **Print:** export to **MakePlayingCards.com**. Design to MPC **poker** size **2.5 × 3.5 in / 822 × 1122 px @ 300 dpi** (bleed included; keep text/faces in the safe area). The printed card front mirrors the `CultivationCard` face — or, when present, the player's **`captureDesign`** layout (§8); the back carries a **QR** to the BAR's share route.
- **QR round-trip:** a scanned card → the existing share/claim flow (`/bar/share/<token>`, `claimBarShareExternal`) → opens the BAR in-app.

---

## 10. Interactions & behavior

- **Keep button:** disabled (inset, not-allowed cursor) until text length ≥ 1 or a photo is attached; enabled state is liminal purple with glow. On click → create BAR → **confirmation → `/bars`**.
- **Field/element/altitude/move chips:** tap to select (selected = element-gem text, 20% element-frame wash fill, inset 1.5px element-frame ring, soft outer glow); tapping a selected field tint clears it. Transition `all 0.18s ease`.
- **Live card on Tune:** element pick re-tints (`data-element`), altitude pick sets `data-altitude` glow; transition `box-shadow 0.45s cubic-bezier(0.16,1,0.3,1)`.
- **Maturity:** advances on each tune write; **never regresses**; ladder pips + label reflect current phase.
- **Motion (design-system rules):** hover lifts `scale(1.02)` + brighter glow; **press shrinks** `scale(0.97)` ~80ms with inset shadow; `satisfied` cards idle-float ±3px (4–6s); entry fades up 8px. Honor `prefers-reduced-motion`.
- **Graduate:** enabled only when fully tuned → `growQuestFromBar()`; on success route into the quest/game.

## 11. State management

- **Capture:** `text`, optional `fieldTint` (element), photo/links via existing paths. Server: `createPlayerBar` / `createBarForUpload`.
- **Composer:** `bg` (element) + `boxes[]` (the `captureDesign` JSON), `selectedBoxId`, `dragId`. Drag updates `%` position; recolor/resize mutate the selected box. Server: `saveCaptureDesign` (does not touch maturity).
- **Tune:** per-BAR `nation`, `intensity`, `emotionalAlchemyTag`, `moveType`, derived `maturity`. Each change is an immediate server write (`tuneBar`) that revalidates — **persisted, survives reload**. Prefer optimistic UI for the chip selection with server reconciliation.
- **Derived:** `maturityPhase` from which channels are set; `ready = all three set`; time-of-day phrase from `createdAt`.

---

## 12. Design tokens

Use the BARS design-system tokens (in `prototypes/_ds/.../tokens/`), not raw values. Reference map:

- **Surfaces:** `--bars-bg-base` (imperceptibly-warm near-black, never `#000`), `--bars-surface-card` (`#1a1a18`), `--bars-surface-inset`, `--bars-line` / `--bars-line-strong`.
- **Text:** `--bars-text-primary` / `-secondary` / `-muted`.
- **Five elements** (each `frame` border / `glow` shadow / `gem` accent): `--bars-fire-*` (火), `--bars-water-*` (水), `--bars-wood-*` (木), `--bars-metal-*` (金, silver-slate — **not** purple), `--bars-earth-*` (土).
- **Liminal / action:** `--bars-liminal` (`#7c3aed`) + `--bars-liminal-glow` — **reserved for action/liminal states only, never an element.**
- **Type:** display = **Jost** (`--bars-font-display`, tracking `-0.02em`, titles/chrome); body = **Nunito** (`--bars-font-body`); mono = **Space Mono** (`--bars-font-mono`, uppercase tracked micro-labels + tabular numerals). *(Note: design-system Jost substitutes licensed Futura PT — if the repo has Futura PT licensed, swap it in.)*
- **Radii:** cards 12px (`--bars-radius-lg`), buttons/inputs 8px (`--bars-radius-md`), chips 6px (`--bars-radius-sm`), sheets 16–24px.
- **Shadow (load-bearing):** every card carries `inset 0 1px 0 rgba(255,255,255,0.06)` — **do not remove it** — plus an element-frame ring `0 0 0 Npx` and an outer element glow whose radius scales with altitude.
- **Motion ease:** `cubic-bezier(0.16,1,0.3,1)`.

## 13. Assets

- **Card art:** dark 16-bit pixel-art (1024×1024, cropped square from top, `object-position: center top`). Representative samples in the design system's `assets/card-art/`. Naming `{nation}-{archetype}.png`.
- **Iconography:** Wuxing sigils `火 水 木 金 土` (rendered in body font, tinted to element gem); geometric Unicode `◇ ♦ ○ ●` (`♦` = Vibeulon); the four (soon five) move glyphs. **No emoji on card surfaces, no icon font.**
- **Existing component:** `source_reference/BarCardFace.tsx` is the current card face to evolve.

## 14. Build order & acceptance

**Block 1 — Foundation (~1.5h):** stamp `maturity:'captured'` + provenance on create (`bars.ts`, `@/lib/bar-seed-metabolization`). Pure server-side.
**Block 2 — Capture reskin (~2h):** rebuild `CreateBarFormPage` as the cultivation-surface quick-capture; keep submit logic intact; add provenance strip, optional field tint, "Keep · tune later" CTA; add the Kept confirmation → board.
**Block 3 — Tune gate (~2.5h):** new `/bars/[id]/tune` + `TuneBarClient` with live `CultivationCard`; `tuneBar()` in `bars.ts`; maturity bumps via `updateBarSeedMaturity()`.
**Block 4 — Wire, polish, dogfood (~1h):** board + detail show the maturity dot; "tune now" affordance from board; graduate gate; smoke test.
**Block 5 — Stories composer (own slice):** `captureDesign` migration; the drag/recolor/resize/background editor (port the `BARS Intake and Decks.dc.html` "V1 · live" canvas); `saveCaptureDesign` action; image export first, then video; feed into deck/print.
*(Open Up + Decks/Print/QR follow as their own slices.)*

**Acceptance — Composer:** text boxes drag and persist by `%`; recolor/resize/background changes survive reload via `captureDesign`; editing does not change maturity; an exported image renders the layout faithfully (boxes positioned by %, element background); the layout feeds the MPC card face and deck entry.

**Acceptance — Capture:** one-line note keeps with zero other taps and lands on `/bars`; kept BAR has `maturity:'captured'` in DB; surface reads the cultivation aesthetic (no zinc/purple chrome); provenance strip shows locked time (nothing editable); photo + links paths still work; CTA reads "Keep · tune later".

**Acceptance — Tune:** picking an element re-tints the live card; each channel persists immediately and survives reload; maturity advances and never regresses; altitude sets the card's `data-altitude` glow; a fully-tuned BAR shows a "ready"/graduate affordance; tuning is optional to keep, required to play.

**Acceptance — Open Up:** `openUp` is a selectable move, ordered before Clean Up; appears in Tune chips, MoveIcon set, ontology doc, and quest-grammar types without breaking the existing four.

---

## 15. Files in this bundle

```
design_handoff_bars_v1_intake/
├── README.md                                  ← this spec (the contract)
├── MVP_SHIP_PLAN.md                           ← broader game-loop MVP context
├── prototypes/
│   ├── BARS v1 Intake - Prototype.dc.html     ← interactive Capture→Kept→Tune (canonical)
│   ├── BARS v1 Intake - Implementation Plan.dc.html
│   ├── BARS Intake and Decks.dc.html          ← decks / print / QR vision
│   ├── Elements and Emotional Alchemy.dc.html ← ontology + the 5th move
│   ├── support.js                             ← runtime so the .dc.html files render offline
│   └── _ds/                                    ← BARS design system (tokens + components)
└── source_reference/
    ├── bars.ts                                ← current src/actions/bars.ts (read before editing)
    └── BarCardFace.tsx                        ← current BAR card face component
```

Open the prototypes in a browser from the `prototypes/` folder. The interactive one is the source of truth for the two build screens; the live payload panel shows exactly what each interaction persists to `db.customBar`.
