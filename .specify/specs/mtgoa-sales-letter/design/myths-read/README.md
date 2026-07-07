# Handoff: Myths Read — Chapter 0 diagnostic quiz

## Overview

**Myths Read** is the short diagnostic a reader hits from **Chapter 0** of *Mastering the Game of Allyship* (Wendell Britt). Instead of the book listing ten myths and asking you to self-sort, the quiz *sorts them for you* from real behavioral answers, hands back your top myths + the exact place the book takes each apart, then bridges into the **BARS Engine** by capturing the emotional **charge** under your most-alive myth and seeding it as your first **BAR**.

It is a **lead-generation surface** for the Allyship Deck and the book: the result screen frames the surfaced myths as "alive right now — here's where they get worked," routes the primary CTA to the Deck, cross-links the companion **Allyship Superpower** quiz, and offers the book as secondary.

The flow is **intro → 12 questions → result**, where the result contains: surfaced myth cards (flip to reveal), an Emotional Alchemy **charge-capture** panel that seeds a BAR and routes into the engine, the funnel CTAs, a "whole board" map, and a soft email save-point.

## About the design files

The file in this bundle (`Myths Read.dc.html`) is a **design reference created in HTML** — a working prototype showing intended look, copy, and behavior. It is **not production code to copy directly.** The task is to **recreate this design in the target codebase** — the `johnair01/bars-engine` Next.js 14 app — using its established patterns: the `CultivationCard` primitive, `ELEMENT_TOKENS` / `card-tokens.ts`, the daily check-in components, and the design-system tokens. Treat the HTML as the spec for layout, spacing, copy, and interaction; render it with the app's real React components and data layer.

`logic_spec_reference.md` is the **authoritative content + scoring spec** (the 10 myths, 6 belief roots, 12 items, §4 scoring, §9 persistence). Where this README and that spec agree, both are canonical; the HTML is the visual realization.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, and interactions. Recreate pixel-accurately using the BARS Engine design system's existing components and tokens. All copy in the prototype is final unless the content team revises it. The one deliberately-mocked piece is the **charge→BAR persistence and routing** (see State Management + Open Items) — the UI is final, the backend wiring is the developer's to build against the app's real endpoints.

---

## Screens / Views

The prototype is a **design board** (a pannable canvas) holding the live phone flow (A) plus six reference panels (B–F). In production, only the **phone flow (A)** ships as the quiz; B–F are documentation of the result-map, card anatomy, metaphor rationale, and tokens.

Phone frame: **390×844 logical** (iPhone 12/13/14 class), single column, mobile-first. Content padding `46px 22px 30px`. Background is a radial warm-black: `radial-gradient(120% 46% at 50% -6%, #17110b 0%, var(--bars-bg-base) 54%)`.

### A1 · Intro

- **Purpose:** set expectations honestly (counter-con framing: "measures, doesn't flatter"), start the quiz.
- **Layout:** flex column, full height. Trigram wordmark → headline → body → 3-row spec list → spacer → primary button → fine print.
- **Components:**
  - **Wordmark:** trigram glyph (three gold `#e0a92a` bars, middle one broken) + `MYTHS READ` in Space Mono, 10px, `letter-spacing:.28em`, uppercase, `#e0a92a`.
  - **Headline:** "You're playing at least a few of these." — Jost 700, 33px, `line-height:1.06`, `letter-spacing:-.02em`, `text-wrap:balance`, `var(--bars-text-primary)`.
  - **Body:** Nunito 15.5px, `line-height:1.62`, `var(--bars-text-secondary)`; inline emphasis in primary color.
  - **Spec list:** 3 rows, 1px gap on `var(--bars-line)` bg (hairline dividers), each row `var(--bars-surface-card)`, padding `15px 16px`. Left glyph column (Space Mono 14px `#e0a92a`, 22px wide): `12`, `5`, `♦`.
  - **Primary CTA:** "Read my myths →" — full width, Jost 700 17px, text `#0a0807`, bg `linear-gradient(150deg,#f0c04a,#d4a017)`, radius 13px, padding 16px, shadow `0 16px 34px -14px rgba(212,160,23,0.7), inset 0 1px 0 rgba(255,255,255,0.35)`. Hover: `translateY(-1px)` + `brightness(1.06)`.
  - **Fine print:** Space Mono 9.5px uppercase `.16em`, `var(--bars-text-muted)`, centered.

### A2 · Question (×12)

- **Purpose:** one behavioral statement at a time, answered on a 5-point frequency scale, auto-advancing.
- **Layout:** flex column, full height. Progress header (top) → question (grows) → scale (bottom) → back/hint row.
- **Components:**
  - **Progress header:** left `NN / 12` (Space Mono 10px `.16em` uppercase muted), right "honest, not fast". Below: 12 **pips** (flex row, gap 4px, each `flex:1; height:3px; radius:99px`). Colors: answered = `#e0a92a`, current = `rgba(224,169,42,0.5)`, future = `rgba(255,255,255,0.08)`. `transition:background .35s`.
  - **Kicker:** "HOW OFTEN IS THIS TRUE OF YOU?" Space Mono 9.5px `.22em` uppercase muted.
  - **Question text:** Nunito 700, 24px, `line-height:1.34`, `text-wrap:pretty`, primary. (See Content → Items for all 12.)
  - **5-point scale:** flex row, gap 9px, `align-items:flex-end`. Each cell is a button: `flex:1`, column, gap 11px, padding `14px 4px 11px`, radius 12px, bg `var(--bars-surface-card)` (selected `rgba(224,169,42,0.10)`), border 1px `var(--bars-line)` (selected `rgba(224,169,42,0.55)`), inset highlight; selected adds `0 0 20px -8px rgba(224,169,42,0.6)`.
    - Inside each: a **dot** whose diameter grows with value — `12 + value*5` px (12/17/22/27/32px for values 0–4). Unselected = transparent fill, 2px `#54524d` border. Selected = `#e0a92a` fill + border + `0 0 12px rgba(224,169,42,0.7)` glow.
    - Label under dot: Space Mono 8.5px uppercase, `line-height:1.15`, centered. Selected = `#e0a92a`, else secondary.
    - Values → labels: `0 Never · 1 Rarely · 2 Sometimes · 3 Often · 4 Almost always` (the last uses a non-breaking space: `Almost\u00a0always`).
  - **End labels:** "Never" / "Almost always" (Space Mono 9px `.14em` uppercase muted, space-between).
  - **Back button** (only when `step > 0`): "← Back" Space Mono 10px `.16em` uppercase muted; hover → primary. Right: "tap to answer" hint.
- **Interaction:** tapping a scale cell records the answer and, after **190ms**, advances to the next item (or to the result after item 12). Answers are re-editable via Back. The question sub-tree keys off `stepKey` (`'q'+step`) so it re-animates (entry `mr-rise`: `translateY(9px)→0`, `.4s cubic-bezier(0.16,1,0.3,1)`).

### A3 · Result

Flex column, gap 18px. Sections top-to-bottom:

**(a) Header** — kicker "YOUR READ · {N} MYTHS SURFACED" (Space Mono 10px `.26em` `#e0a92a`); headline "These are the myths you're playing." (Jost 700 27px); body explaining "a myth is a false claim, not a verdict."

**(b) Surfaced myth cards** (1–3, see scoring). Each is a tap-to-flip card:
- **Face:** bg `var(--bars-surface-card)`, radius 14px, padding 18px, box-shadow `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(224,169,42,0.30), 0 0 26px -8px rgba(224,169,42,0.42)`, plus a corner glow overlay `radial-gradient(120% 80% at 88% -10%, rgba(224,169,42,0.14), transparent 58%)`. Header row: "MYTH · RANK {n}" (Space Mono 9px `.2em` `#e0a92a`) + strength label (Loud/Clear/Faint) with a 34×4px track whose gold fill width = the myth's `pct`. Claim: Jost 600 22px `line-height:1.16` `text-wrap:balance`, wrapped in `"…"`. Footer: "Tap to turn it over ↻".
- **Reveal:** bg `var(--bars-surface-inset)`, ring `rgba(224,169,42,0.5)`, glow `0 0 30px -8px rgba(224,169,42,0.55)`. Rows separated by 1px `var(--bars-line)` top-borders: **The diagnosis** (Nunito 13.5px primary) → **Where the book solves it · {chapter}** (kicker `#e0a92a`, Nunito 12.5px secondary) → **One move now** (Nunito 700 14px) → the **pick button** "This one's alive — work it ↓" (or "✓ Working this one" when active).
- Flip is a conditional swap (face XOR reveal), NOT a 3D `rotateY` (the prototype used `<sc-if>` toggles — a CSS backface-flip rendered unreliably; use a clean crossfade/height transition or a reliable 3D flip if the codebase has one). Entry `mr-rise .32s ease`.
- The **pick button** sets which myth flows into the charge panel (state `chargeMyth`); the active one also drives the default in panel (b) of the charge capture.

**(c) Charge capture — the metabolize bridge** (the key new piece; screenshot 06–07). A **liminal-purple** panel (purple `#7c3aed` is the reserved action/liminal color, never an element): bg `linear-gradient(168deg,#0f1220,#100f0d 60%)`, ring `rgba(124,58,237,0.26)`, glow `0 0 32px -12px rgba(124,58,237,0.45)`, corner glow `rgba(124,58,237,0.16)`, padding 18px.
  - **Kicker:** "◇ EMOTIONAL ALCHEMY · METABOLIZE THE CHARGE" Space Mono 9.5px `.2em`, `#a78bfa`.
  - **Heading:** "A myth is just a claim until you feel the charge under it." Jost 700 19px. Sub: Nunito 12.5px secondary.
  - **Step 1 · myth chips** — the surfaced myths as short-label chips (`being good`, `right words`, `the less powerful`, `the right people`, `sacrificing yourself`, `never causing harm`, `fixing it`, `the right framework`, `being seen`, `a debt to pay`). Selected chip: text `#fff`, bg `rgba(124,58,237,0.22)`, border `rgba(139,92,246,0.6)`. Jost 600 12.5px, radius 8px, padding `8px 11px`.
  - **Step 2 · flavor** — the five Wuxing charge flavors as full-width rows (this mirrors the deck's daily check-in). Each: sigil tile (34px, radius 9px, `color-mix(element 16%, transparent)` bg, element-colored glyph with `text-shadow` glow) + label (Jost 600 13.5px) + sub (Nunito 11px). Selected row: bg `color-mix(flavor 14%, surface-inset)`, border = flavor color, glow `0 0 18px -8px flavorColor`.

    | key | sigil | label | sub | color | routes to | move phrasing |
    |-----|:-----:|-------|-----|-------|-----------|---------------|
    | sadness | 水 | Sadness | Heavy — grief, something feels distant | `#2980b9` | Emotional First Aid | metabolize it (3·2·1) |
    | anger | 火 | Anger | Heated — a boundary's been crossed | `#c1392b` | Adventure | take the concrete move |
    | fear | 金 | Fear | Anxious — dread, bracing for it | `#8e9aab` | the Diplomat | open the hard conversation |
    | numbness | 土 | Numbness | Shut down — going through the motions | `#9a8f6e` | Capture a Charge | name it so it stops running you |
    | restlessness | 木 | Restlessness | Forced — performing okay-ness | `#2ecc71` | Growth Scene | rehearse the move low-stakes |

  - **Step 3 · intensity** — 5 chips in a flex row: `Faint(2) · Mild(4) · Live(6) · Heavy(8) · Overwhelming(10)`. Selected: `#fff` on `rgba(124,58,237,0.22)`, border `rgba(139,92,246,0.6)`. A live readout (Nunito italic 11.5px `#a78bfa`) mirrors the pick ("Heavy — it colors everything").
  - **Seeded BAR (appears when flavor + intensity both set):** kicker "♦ YOUR FIRST BAR — SEEDED"; summary line, e.g. *"'the right framework', held as anger at heavy strength — take the concrete move."*; then the **Metabolize CTA** — full-width, Jost 700 15px, `#fff` on `linear-gradient(150deg,#8b5cf6,#7c3aed)`, radius 12px, shadow `0 14px 30px -12px #7c3aed`. Sub-line: "Routes to {route} · your charge travels with you". Before both are set, a muted prompt is shown instead.

**(d) The whole board** — a compact 10-row list (belief layer suppressed): surfaced myths **lit** (filled gold square 11px + glow, full opacity, primary text), the rest **recede** (hollow 1.5px `#6b6965` ring, opacity 0.42, secondary text). Each row: mark + claim (Nunito 12px) + chapter tag (Space Mono 8.5px). Header "THE WHOLE BOARD · {N} LIT FOR YOU". Footnote: "unlit myths aren't absent — just quiet today."

**(e) Funnel CTAs** (screenshot 08):
  1. **Primary — the Deck**, in a gold-ringed card: kicker "{N} ALIVE FOR YOU · WHERE THEY GET WORKED", framing copy, then "Get the Allyship Deck →" (same gold gradient button as intro). Links to the sales/deck page.
  2. **Companion — Superpower quiz**, a bordered row: gold ✦ tile + "Now see how you ally →" + "Discover your Allyship Superpower". Links to the Superpower quiz.
  3. **Secondary — the book**, a quiet outlined link "Or read the manual — the book".

**(f) Email save-point** — soft/optional. bg `var(--bars-surface-inset)`, radius 14px. "Save your read" + email input (`var(--bars-bg-base)` bg, 1px `var(--bars-line-strong)`, radius 10px) + "Save" button (gold text on `rgba(224,169,42,0.10)`). On save (email contains `@`), collapses to a confirmation with a ♦ tile.

**Retake** — a centered ghost link "↺ Retake the read" resets all state to intro.

### B · Myth Map — result version (reference)
The belief layer **suppressed** (per the spec's "one too many identities" call): reader sees only myth → destination. Surfaced myths lit, rest recede. Two-column list with hairline connectors; legend "Lit — surfaced for you" / "Quiet today". This is the conceptual model behind (d); render it however the app's result layout prefers.

### C · Myth card anatomy (reference)
Static face + reveal side-by-side, documenting the card in (b).

### D · Myth Map — book spread, belief layer SHOWN (reference; screenshot 09)
The three-column diagram — **root belief → the myth → where the book takes it apart** — with SVG connectors. Faint slate lines belief→myth (several myths share a root, drawn as brackets — the insight that myths are *strategies*, not random flaws); gold lines myth→resolution. Belief nodes are dashed/recessed "seeds"; myth nodes are stuck slate cards; resolution nodes are lit gold "yellow-brick" cards tagged with chapter. This is a candidate for a Chapter-0 illustration or endpaper (open item).

### E · Map metaphor studies (reference; screenshot 10)
Three rationale cards — **Inner Garden (chosen)**, Hexagram lattice, Arcade board — documenting why the book-spread uses the garden metaphor (root→growth→fruit = belief→myth→resolution). Documentation only; not a shipping screen.

### F · Token sheet (reference; screenshot 11)
The alive-vs-stuck color logic, warm-ground surfaces, type roles, motif kit, voice note. Cross-reference against the design-system tokens below.

---

## Content — the 10 myths (authoritative)

Keyed `M1`–`M10`. `claim` is the card face; `diagnosis` / `chapter` / `mechanism` / `move` are the reveal; `short` is the charge-chip label; `dest` is the map destination.

| id | claim | root belief | chapter | diagnosis | one move |
|----|-------|-------------|---------|-----------|----------|
| M1 | "Allyship means being good." | Not good enough | Ch 0 | A private trial where the other person becomes your evidence. | Name the verdict you're trying to win. |
| M2 | "Allyship means saying the right words." | Not ready | Ch 2 | Fluency that signals safety without proving it. | Name one thing you feel that you have no vocabulary for. |
| M3 | "Allyship means helping the less powerful." | Insignificant | Ch 0 | Turns a person into a project. That's charity. | Name where the mutuality is. |
| M4 | "Allyship means following the right people." | Not capable | Ch 3 | Discernment surrendered to someone's authority. | Name one thing you disagreed with and swallowed. |
| M5 | "Allyship means sacrificing yourself." | Not worthy | Ch 0 | Self-abandonment that sends an invoice. | Name what actually refills you. |
| M6 | "Allyship means never causing harm." | Don't belong | Ch 6 | Innocence protected by never moving. | Name a rupture you've been avoiding repairing. |
| M7 | "Allyship means fixing the problem." | Not capable | Ch 0 | Wanting it more than they do; help curdles to pressure. | Name the charge under your urge to fix. |
| M8 | "Allyship means having the right framework." | Not good enough | Ch 7 | The map becomes the destination. | Name a pattern you see clearly and still haven't moved on. |
| M9 | "Allyship means being seen doing it." | Don't belong | Ch 0 | Optics on someone else's ledger. | Name a move you'd make if no one saw. |
| M10 | "Allyship means paying down what you owe." | Not worthy | Ch 0 | An inherited, unpayable debt. | Name what accurate accounting would actually say. |

Mechanisms (reveal + book-spread resolution text): M1 redefinition + counter-con (Token/Ticket); M2 the Shaman — the felt record under the language; M3 charity vs. allyship; M4 the Challenger — keep your discernment or you're staff; M5 the Token System + self-allyship; M6 the Diplomat, the Repairer channel; M7 the Gates + Emotional Alchemy (wound-bridge); M8 the Sage — seeing that replaces acting + Two Readings; M9 the Ticket System — optics aren't tickets; M10 the infinite-game frame.

**Six belief roots:** Not good enough (M1, M8) · Not ready (M2) · Insignificant (M3) · Not capable (M4, M7) · Not worthy (M5, M10) · Don't belong (M6, M9). *(Note: the book-spread diagram groups slightly differently for layout; the mapping above is the content-authoritative one — reconcile with `logic_spec_reference.md` §3 before shipping.)*

## Content — the 12 items

Each item has a text, and weights onto one or more myths. Answer value 0–4.

1. `q1` (M1) — "When I do something for a cause, some part of me is quietly checking whether it makes me a good person."
2. `q2` (M2) — "I relax in a room once I've heard people use the right language — I know I'm safe there."
3. `q3` (M3) — "I feel most useful when I'm helping someone who clearly can't help themselves."
4. `q4` (M4) — "When someone with more standing or lived experience takes a position, I go along with it even when something in me disagrees."
5. `q5` (M5) — "I gauge whether I did enough by how drained I feel afterward."
6. `q6` (M6) — "I'd rather stay quiet than risk saying the wrong thing and being seen as harmful."
7. `q7` (M7) — "When someone I care about is struggling, I keep offering my solution even after they've stopped asking for it."
8. `q8` (M8) — "Before I act, I reach for a framework or an analysis so I feel like I'm standing on solid ground."
9. `q9` (M8) — "I understand my own patterns far better than I actually change them."
10. `q10` (M9: 1.0, M1: 0.5) — "It matters to me that the right people notice I showed up."
11. `q11` (M10) — "I carry a sense that I owe something for advantages I didn't earn, and that I have to keep paying it down."
12. `q12` (M7) — "It's hard for me to let someone struggle when I'm sure I know what would help."

Note the **cross-load** on q10 (weights M9 fully + M1 half) and the **double-loaded myths** (M7: q7+q12; M8: q8+q9).

## Interactions & behavior

- **Auto-advance:** selecting a scale value stores the answer and advances after **190ms**. Item 12 transitions to the result.
- **Back:** available from item 2 on; decrements step, answers preserved.
- **Card flip:** tap toggles face/reveal per card (independent state per card index).
- **Charge pick:** tapping a myth's "work it" button OR a myth chip sets `chargeMyth`. Selecting flavor + intensity reveals the seeded-BAR block and the Metabolize CTA.
- **Email save:** validates presence of `@`, then swaps to confirmation.
- **Retake:** full reset to intro.
- **Motion:** entry `mr-rise` (translateY 9px→0). Ease `cubic-bezier(0.16,1,0.3,1)`. Buttons: hover `translateY(-1px)` + `brightness(1.06)`; honor `prefers-reduced-motion` (all animation/transition disabled).

## State management

State needed (prototype uses a single component; map to the app's store/route as appropriate):
- `phase`: `'intro' | 'quiz' | 'result'`
- `step`: current item index (0–11)
- `answers`: `{ [itemId]: 0..4 }`
- `outcome`: `{ ranked, surfaced[], scores{} }` computed by the scorer
- `flipped`: `{ [cardIndex]: bool }`
- `chargeMyth`: myth id selected for metabolization (defaults to top surfaced)
- `chargeFlavor`: one of the five flavor keys
- `chargeIntensity`: `2 | 4 | 6 | 8 | 10`
- `emailValue`, `emailSaved`

### Scoring (§4 port — implement exactly)
For each myth: `raw = Σ(answerValue × weight)`, `max = Σ(4 × weight)`, `pct = raw/max`. Track `peak` = the largest single contribution to that myth.
Rank by `pct` desc, tie-break by `peak` desc, then by a fixed **canonical order** (`M8,M7,M1,M5,M6,M4,M2,M3,M9,M10`).
**Surface** the top 3, filtered by a **floor rule**: keep rank 1 always; keep ranks 2 and 3 only if their `pct ≥ 0.40`. Always surface ≥1.
**Strength label:** `pct ≥ 0.72` → "Loud"; `≥ 0.55` → "Clear"; else "Faint".

### Persistence & routing (mocked in prototype — build for real)
Per `logic_spec_reference.md §9`, persist a `myth_read` record: answers, ranked scores, surfaced myths, and the captured charge (myth + flavor + intensity). The Metabolize CTA should route into the engine on the flavor's mapped scene (see flavor table) carrying the seeded BAR; the prototype links to `Deck Experience.dc.html` as a stand-in.

## Design tokens

All from the **BARS Engine design system** (`_ds/…/tokens/`). Use the CSS vars, not raw hex, wherever the app exposes them.

**Surfaces:** canvas `#080706` (board) / `var(--bars-bg-base)` (phone); card `#1a1a18` (`--bars-surface-card`); inset/well `#111110`ish (`--bars-surface-inset`); lines `--bars-line`, `--bars-line-strong`.
**Text:** `--bars-text-primary`, `--bars-text-secondary`, `--bars-text-muted`.
**Signal gold (the "lit/metabolized" accent):** `#e0a92a` base; gradient `linear-gradient(150deg,#f0c04a,#d4a017)`; light `#f0c04a`. Glow `rgba(224,169,42,.4–.7)`.
**Liminal/action purple (charge panel + Metabolize CTA):** `#7c3aed` / `#8b5cf6`, text-accent `#a78bfa`. Reserved — never used as an element.
**Wuxing element colors** (charge flavors): Water `#2980b9`, Fire `#c1392b`, Metal `#8e9aab`, Earth `#9a8f6e`, Wood `#2ecc71`. Fills via `color-mix(… 12–18%, transparent)`.
**Radii:** cards 14px (system canonical 12px; this surface uses 14), buttons/inputs 8–13px, chips 6–8px, sheets/panels 16px, avatars/tiles circular or 9–12px.
**Shadows:** the load-bearing inset `inset 0 1px 0 rgba(255,255,255,0.05–0.06)` on every card; element ring `0 0 0 1px <color>`; outer glow `0 0 Npx -Mpx <color>` scaling with emphasis.
**Type:** Jost (display/chrome, `-0.02em`), Nunito (body), Space Mono (uppercase tracked micro-labels + numerals). Scales called out per component above; nothing below ~24px on the phone for body-of-attention text, micro-labels 8.5–10px.
**Motion:** ease `cubic-bezier(0.16,1,0.3,1)`; entry 0.32–0.5s; button press/hover per system.

## Assets

No raster/image assets are required for the quiz itself — all marks are Unicode glyphs (trigram bars are CSS, Wuxing sigils 火水木金土, geometric ◇ ♦ ○ ●) and CSS gradients/shadows. The book-spread map (D) and metaphor studies (E) use inline SVG. If the app wants card art on the myth cards, pull from `assets/card-art/` per the design system, but the prototype intentionally uses the type-forward "myth face" treatment instead.

## Files

- `Myths Read.dc.html` — the full prototype (design board): interactive phone flow + all six reference panels. Open in a browser to interact. Tweak props `showSampleResult` / `sampleMythCount` (1/2/3) jump straight to a result state.
- `logic_spec_reference.md` — authoritative content + scoring + persistence spec.
- `screenshots/` — 11 reference captures:
  - `01-board-overview.png` — the whole design board
  - `02-intro.png` — intro screen
  - `03-question.png`, `03b-question-scale.png` — question + the 5-point scale
  - `04-result-cards.png` — result header + surfaced myth cards
  - `05-card-reveal.png` — a flipped card (diagnosis / chapter / move)
  - `06-charge-capture.png` — Emotional Alchemy charge panel (myth chip + flavors)
  - `07-seeded-funnel.png` — intensity + seeded BAR + Metabolize CTA + board
  - `08-funnel-ctas.png` — Deck / Superpower / book / email save
  - `09-book-spread-map.png` — belief→myth→resolution diagram
  - `10-metaphors-tokens.png` — map metaphor studies
  - `11-token-sheet.png` — token sheet

## Open items (decisions for the team, not blockers)

1. **Art direction** — the prototype runs a single warm-gold "lit vs. stuck" logic rather than per-nation element colors on the myth cards (cleaner, on the counter-con brief). Decide whether to inherit the deck's per-nation card art literally.
2. **Book-spread map placement** — Chapter 0 illustration vs. endpaper (spec open call #3).
3. **Charge persistence + real engine route** — wire the seeded BAR to the `myth_read` record and the live scene routes (prototype mocks both).
4. **Belief-root grouping** — reconcile the book-spread's visual grouping with the content-authoritative belief→myth mapping in §3 before print.
