# BARS Engine — Design System

> A reusable design system for **BARS Engine**, the product surface of **Mastering the Game of Allyship** (Wendell Britt). BARS Engine is a narrative-driven quest engine — *"if Jira could interface with GitHub via a procedurally generated choose-your-own-adventure game"* — where players capture emotional **charge**, metabolize it through the **emotional alchemy** of the five Wuxing elements, and pave a **Yellow Brick Road** of completed quests. The currency of progress is the **Vibeulon (♦)**.

This system is the visual + interaction language of that world: a dark "operating system" that contains glowing, element-coded **cultivation cards**.

## Source material

This system was reverse-engineered from the product codebase. Explore these to build with higher fidelity:

- **GitHub:** [`johnair01/bars-engine`](https://github.com/johnair01/bars-engine) — Next.js 14 app. The visual source of truth lives in:
  - `src/lib/ui/card-tokens.ts` — `ELEMENT_TOKENS`, `ALTITUDE_TOKENS`, `STAGE_TOKENS`, `SURFACE_TOKENS` (the three-channel encoding).
  - `src/styles/cultivation-cards.css` — the card aesthetic (ported here to `tokens/cards.css`).
  - `src/components/ui/CultivationCard.tsx` — the card primitive.
  - `src/lib/ui/card-art-registry.ts` — the 40 nation×archetype card-art pairings + DALL·E grammar.
  - `docs/SEMANTIC_REGISTERS.md`, `GUI_ASSET_INTEGRATION.md`, `FOUNDATIONS.md`, `docs/PLAYER_SUCCESS.md` — ontology, asset registers, voice.

The reader is encouraged to browse the repo directly to recreate flows beyond what this kit covers.

---

## The ontology in one breath

Five dimensions structure the game: **WHO** (Nation + Archetype), **WHAT** (Quests), **WHERE** (Allyship domains), **Energy** (Vibeulons), and **personal throughput** — the four **moves**: **Wake Up** (notice), **Clean Up** (metabolize), **Grow Up** (capacity), **Show Up** (act). A **BAR** is a kernel — *"a seed with provenance"* — that blooms into a quest. The five **Nations** map to the five Wuxing elements:

| Nation | Element | Sigil | Essence |
|--------|---------|:-----:|---------|
| **Pyrakanth** | Fire | 火 | blazing vanguard of passion & transformation |
| **Lamenth** | Water | 水 | deep current of emotion, intuition, flow |
| **Virelune** | Wood | 木 | living network of growth & connection |
| **Argyra** | Metal | 金 | silver mirror of precision & clarity |
| **Meridia** | Earth | 土 | grounded center of stability & nurture |

---

## CONTENT FUNDAMENTALS

**Voice — second person, present tense, contemplative.** The app speaks *to you* about *your* practice: "Name where you're stuck. Choose your move. Enter the scene." Success copy is in the second person too: "You have arrived successfully if you captured one charge." Never corporate, never hype.

**Mythic but grounded.** The world has its own lexicon — *charge, metabolize, field, kernel, cultivation, the road, yellow brick, alchemy, attune, compost.* Use it precisely; it is load-bearing, not decoration. But the payoff is always practical: "The game's job is to make you more capable in the world."

**Reframes over judgments.** *"Stuckness is data, not failure."* *"Divergence is evolution, not failure."* *"Control moves are high-cost precision moves, not bad moves."* The tone treats difficulty as raw material, never as fault.

**Casing & rhythm.** Chrome/labels are **UPPERCASE, mono, letter-spaced wide** and terse ("FIELD ACTIVE · SADNESS", "VIBULON"). Titles are tight, declarative display sans. Body is warm and unhurried. Sentences are short. Em-dashes and colons set up the reframe.

**Numbers are quiet.** Stats appear as tabular mono with a gem ♦, never as dashboards of vanity metrics. "Steady accumulation is the form."

**Emoji.** Avoid on card surfaces — they break the pixel-art register. The codebase tolerates emoji in system banners only; prefer the Wuxing sigils (火水木金土) and geometric marks (◇ ♦ ○ ●). This system uses **no emoji** in chrome.

**Examples to imitate**
- CTA: *"Check in to awaken your field"*, *"Show up — complete the quest"*, *"Begin check-in →"*
- Reframe: *"A forked BAR may preserve structural maturity while restarting social adoption."*
- Completion: *"A yellow brick is paved. You metabolized the charge into action."*

---

## VISUAL FOUNDATIONS

**The core idea — an OS that contains cards.** Surfaces are imperceptibly-warm near-blacks (never pure `#000`); the *only* chromatic signal is the element of the card in front of you. "The cards are the content; chrome is the absence of content."

**Color.** Five Wuxing palettes, each with `frame` (border), `glow` (shadow), `gem` (accent). Deliberately desaturated — *"cultivation is a long game, not a spectacle."* Saturation rises with **altitude** via glow intensity, not hue shift. **Purple (`#7c3aed`) is reserved for action/liminal states and is never an element.** Metal is silver-slate, not purple. See `tokens/colors.css`.

**The three-channel encoding** (the heart of the system):
- **Element → color** (frame / glow / gem / gradient). `data-element`.
- **Altitude → border + glow intensity** — `dissatisfied` (1px, 30%, no glow — raw, pre-alchemy), `neutral` (2px, 70%, 4px glow), `satisfied` (2px, 100%, 12px glow + idle float). `data-altitude`.
- **Stage → density** — `seed` / `growing` / `composted` (art-window height, composted crosshatch, 20% art opacity).

**Type.** Display = **Jost** (geometric, a Futura PT substitute), tight `-0.02em` tracking, for titles/chrome. Body = **Nunito** (warm rounded) for player prose. Mono = **Space Mono** for the signature uppercase tracked micro-labels and tabular numerals. (See substitution note below.)

**Backgrounds & imagery.** No gradients-as-decoration. Card bodies carry a subtle element-tinted radial gradient (`.bars-card__gradient`) + a soft corner glow node. The hero imagery is **dark 16-bit pixel art** — chiaroscuro, low-saturation, square, a lone robed cultivator silhouetted against elemental light. 40 such images exist (5 nations × 8 archetypes). Cards crop them square from the top (`object-position: center top`).

**Shadow system (load-bearing).** Every card carries `inset 0 1px 0 rgba(255,255,255,0.06)` — *"the single most important trick for making a flat dark card feel like a physical object. Do not remove it."* Plus an element-frame ring (`0 0 0 Npx`) and an outer element glow whose radius scales with altitude. Elevated surfaces (modals/sheets) get a large soft drop shadow.

**Corners & cards.** Canonical card radius is **12px**. Buttons/inputs 8px, chips 6px, sheets 16–24px, avatars circular. Cards = `#1a1a18` body + inset highlight + element ring + glow; no flat borders.

**Motion.** Quiet and physical. Ease `cubic-bezier(0.16,1,0.3,1)`. Hover lifts (`scale 1.02`) and brightens the glow; **press shrinks** (`scale 0.97`, 80ms) with an inset shadow. `satisfied` cards **idle-float** (±3px, 4–6s). The alchemical **ritual** moment expands a double glow + `scale 1.05`. Entry fades up 8px. All animations honor `prefers-reduced-motion`.

**Transparency & blur.** Sheets/overlays use `rgba(5,4,3,0.86)` + `backdrop-filter: blur`. Element fills use `color-mix(... 12–18%, transparent)` washes, never solid floods.

**Layout.** Mobile-first single column; generous negative space; chrome (status/top/bottom nav) is quiet and recedes. Element color enters only through the cards.

---

## ICONOGRAPHY

The system is **intentionally imageless except for card art and a tiny glyph set.**

- **Wuxing sigils** `火 水 木 金 土` — the primary element/nation marks (Unicode CJK, rendered in the body font, tinted to the element `gem` with a soft glow). Use `ElementSigil`.
- **Geometric Unicode** as game UI markers: `◇ ♦ ○ ●` (and `♦` for the Vibeulon). Used in nav and counts.
- **Four move icons** — 24×24 monochrome line PNGs (Wake / Clean / Grow / Show), shipped in `assets/icons/moves/` and embedded into the `MoveIcon` component as data URIs for portability. White by default; tint via CSS mask.
- **Four growth glyphs** — recolorable SVG line art (sprout → sapling → plant → tree) in `assets/icons/growth/`. Use as CSS masks to tint (they are `currentColor` line art).
- **No icon font, no emoji on surfaces.** If you need an icon not in this set, draw it in the same hairline geometric register or reach for a minimal Unicode mark — do not introduce a third-party icon library.

---

## VISUAL ASSETS

- `assets/card-art/` — 10 representative pixel-art card illustrations (a sample of the full 40). Naming: `{nation}-{archetype}.png`, 1024×1024. Two source images are quarantined for watermarks (`argyra-truth-seer`, `pyrakanth-joyful-connector`) — not imported here.
- `assets/icons/moves/` — the four move glyphs.
- `assets/icons/growth/` — the four growth-stage glyphs.

---

## ⚠ Font substitution (action needed)

The covenant specifies **Futura PT Bold** for titles/chrome; it is a licensed font and was **not** in the source repo. This system substitutes **Jost** (a geometric, Futura-adjacent open font). Body uses **Nunito** (matching the `ui-rounded` intent) and stats use **Space Mono**. **To restore exact brand type, send the licensed Futura PT files** and we'll wire them in `tokens/fonts.css`.

---

## INDEX — what's in this system

**Root**
- `styles.css` — the single entry point (consumers link this). `@import`s only.
- `README.md` — this guide. · `SKILL.md` — Agent-Skill manifest.

**`tokens/`** (all reached from `styles.css`)
- `colors.css` — surfaces, text, five element palettes, liminal, channel accents, `[data-element]` scopes.
- `typography.css` — families, scale, weights, tracking + helper classes.
- `spacing.css` — spacing, radii, altitude channel, shadows, motion.
- `cards.css` — the `.bars-card` cultivation-card aesthetic (states, art window, gradient, float, ritual).
- `fonts.css` — webfont `@import` (Jost / Nunito / Space Mono).

**`components/`** (React primitives — `window.BARSEngineDesignSystem_*`)
- `core/` — `Button`, `Badge`, `ChromeLabel`, `ElementSigil`, `MoveIcon`, `VibulonStat`.
- `cards/` — `CultivationCard` (+ `CardArtWindow`, `CardWell`).

**`ui_kits/bars-engine/`** — interactive mobile recreation: identity card, four-move compass, active quest board, the 4-step **daily alchemy check-in**, quest detail, and the ritual completion overlay.

**`guidelines/`** — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.
