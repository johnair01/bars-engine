# Handoff: Lenses — Goal-Setting Onboarding (BARS Engine)

> ## ⚠️ CRITICAL SCOPE NOTE — build the descent for ALL FIVE categories
>
> The prototype only **mocks the descent (Quarter → Month → Week) on ONE category: Health.** That was done to keep the prototype legible and to line up with the downstream Tap-the-Vein and Plant-a-BAR examples.
>
> **The real product must run the full Year → Quarter → Month → Week authoring descent for every one of the five lenses — Relationships, Career, Money, Health, and Allyship — not just Health.** Each kept year goal needs its own descent passes. Do not ship a version that only descends Health. See **Open Questions #1** for the recommended UX (a goal/lens picker at the top of each cadence so the player descends one parent goal at a time).

## Overview

**Lenses** is the upstream goal-imagining and goal-setting surface for BARS Engine. It moves a new player from a vague sense of what they're moving toward into an **authored year frame** across five life domains, then walks that frame *down* through nested time cadences (Year → Quarter → Month → Week) until it hands off to **Tap the Vein**, the existing daily-execution surface.

The core belief encoded in this flow: **the player authors their own goals by dreaming, not by accepting machine suggestions.** There is no LLM/generation step. The product's job is to develop the player's own muscle of dreaming, visioning, and focus. Every level of the hierarchy is authored by the same humane loop:

> **Free-write (10 min) → Make up to 10 options → Keep ~5 → lock in.**

Tap the Vein is explicitly **not** a top-down push. Once the lenses are authored, the player captures whatever emerges in their day, and the lenses help them *notice* which emergent action is quietly serving a goal they already set — surfacing the alignment between emergent feeling and aspirational goal.

The five domains ("lenses"):
- **Relationships**
- **Career**
- **Money**
- **Health**
- **Allyship**

## Screenshots

Reference renders of every surface live in `screens/` (captured from the prototype at 392px device width):

| File | Surface |
|------|---------|
| `01-entry.png` | Entry (after superpower quiz) |
| `02-vague-movement.png` | Vague Movement |
| `03-workshop-freewrite.png` | Lens Workshop — Free-write phase (with live 10-min timer) |
| `04-workshop-options.png` | Lens Workshop — Options phase |
| `05-workshop-keep.png` | Lens Workshop — Keep phase |
| `06-year-lens-review.png` | Year Lens Review |
| `07-quarter-descent.png` | Quarter authoring pass (**Health thread only — must be built for all 5**) |
| `08-month-descent.png` | Month authoring pass (**Health thread only — must be built for all 5**) |
| `09-week-descent.png` | Week authoring pass (**Health thread only — must be built for all 5**) |
| `10-tap-the-vein.png` | Tap the Vein handoff ("What's bubbling up?") |
| `11-plant-bar-gate.png` | Plant a BAR — pre-plant gate |
| `12-plant-bar-planted.png` | Plant a BAR — planted ritual confirmation |

Note: in the static PNGs a title/prompt may appear to overlap on a couple of workshop frames — that's an artifact of the screenshot renderer, not the design; the live DOM spaces them correctly.

## About the Design Files

The two files in this bundle are **design references created in HTML** — interactive prototypes that demonstrate the intended look, copy, and behavior. **They are not production code to copy directly.** They were built as single-file "Design Components" (a streaming-template format with an inline logic class) specific to the prototyping environment; that wrapper is irrelevant to your implementation.

Your task is to **recreate these designs in BARS Engine's existing codebase** — the Next.js 14 app at [`johnair01/bars-engine`](https://github.com/johnair01/bars-engine) — using its established patterns, its React component conventions, and (critically) its **existing design-token system**. The prototype already styles everything against the BARS Engine design tokens (`--bars-*` CSS variables); map those to whatever the codebase exposes (`card-tokens.ts`, `cultivation-cards.css`, the `--bars-*` vars) rather than re-deriving values.

- `BARS Lenses Onboarding.dc.html` — the full interactive prototype: a 390px mobile phone frame with a left "director rail" for jumping between screens and toggling prototype states. **This is the source of truth for every screen, all copy, and all interactions.**
- `BARS Lenses Onboarding - Canvas.dc.html` — a pannable storyboard that mounts the same component 16 times, each locked to a specific screen/state, for an at-a-glance overview. Reference only; it adds no new UI.

To view either file's behavior, open it in a browser. The director rail (left side of the main file) lets you reach every screen; the "Superpower" and "Free-write" toggles at the bottom of the rail switch between the prototype states described below.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, motion, and copy are all intentional and pulled from the BARS Engine design system. Recreate the UI faithfully using the codebase's existing component library and tokens. Where a measurement below is given in px, it's the intended value; prefer the codebase's token/scale equivalents (they were designed to match — see **Design Tokens**).

Two deliberate scoping decisions you should preserve (or consciously change with the product owner):
1. **No card art.** Per current project direction, the cultivation-card pixel-art imagery is *not* used anywhere in this flow. Cards are rendered art-free: element color via ring/glow, an optional faint element sigil (火水木金土) watermark, and the title text. Do not add card art.
2. **The descent is demonstrated on a single thread (Health) — production must cover all five.** In the prototype, the Quarter/Month/Week authoring passes carry the **Health** lens's goals downward, so they line up with the Tap the Vein and Plant-a-BAR examples. **In production, every kept year goal across all five lenses must get its own descent** (see the scope banner at the top and **Open Questions #1**).

## Screens / Views

The flow is a linear sequence of 9 logical surfaces. The phone frame is **392 × 844px** content area (414px-wide device with 11px bezel), single column, dark background `#0a0908`. Every screen has: a status bar, a header chrome row (`LENSES` mono label + `Step N / 8` + a segmented progress bar), and a scrollable body. A persistent primary CTA sits at the bottom of each screen (full-width, liminal purple).

### 0. Chrome (persistent, all screens)
- **Status bar**: `9:41` (mono, `--bars-text-secondary`) left; signal dots right. Padding `13px 24px 4px`.
- **Header row**: `LENSES` (mono, 9px, `letter-spacing:0.24em`, uppercase, color `--bars-liminal-glow`) left; `Step N / 8` (mono, 9px, `--bars-text-muted`) right.
- **Progress bar**: 8 equal segments, 3px tall, 4px gap. Filled segments (index ≤ current) = `--bars-liminal` with a glow; unfilled = `--bars-line-strong`.
- **Primary CTA pattern** (reused everywhere): full-width, `padding:16px`, `border-radius:8px`, background `--bars-liminal`, white display-font label ~16px + `→`. Box shadow: inset-top highlight + 1px liminal ring + `0 0 24px` liminal glow. Press state: `scale(0.975)` over 80ms.

### 1. Entry (after Superpower quiz)
- **Purpose**: Orient the player; frame the superpower as a *lens, not a sentence*.
- **Layout**: Title → body copy → superpower card → spacer → primary CTA + secondary text button.
- **Title** (display/Jost, 800, 28px, `line-height:1.12`, `letter-spacing:-0.02em`, `--bars-text-primary`): "Let's imagine the year you're moving toward."
- **Body** (Nunito, 15px, `line-height:1.6`, `--bars-text-secondary`): "You'll dream your own goals here — the writing is the point. Your superpower is just a lens on how you tend to show up."
- **Superpower card** (`--bars-surface-card`, radius 12px, inset-top + 1px hairline + faint liminal glow, padding 18px): mono kicker "YOUR ALLYSHIP SUPERPOWER"; `Connector` (display 800, 26px) + `second wind · Storyteller` (mono 10px); a liminal pill "A lens on how you show up" with a glowing dot. A radial liminal glow node sits top-right, clipped.
- **Primary CTA**: "Begin Lenses →".
- **Secondary**: text button "Choose without quiz" (switches to no-quiz state).

### 2. Vague Movement
- **Purpose**: Start with desire before goals.
- **Mono kicker**: "BEFORE GOALS · DESIRE".
- **Title** (display 800, 25px): "What are you moving toward?"
- **Body**: "No goals yet. Just the shape of it — what would feel different if this year worked? We'll carry this feeling into each lens."
- **Free-write textarea**: inset well (`--bars-surface-inset`, radius 12px, 1px hairline, 4px outer padding), `min-height:140px`, 15px Nunito, placeholder "Write loosely. Half-sentences are fine."
- **Feeling chips** (mono kicker "THE SATISFACTION FEELING"): a wrap row of toggle pills — `alive, settled, connected, free, proud, clear, generous, relieved`. Default-on: `settled`, `connected`. On = liminal wash bg + `--bars-liminal-glow` text + liminal ring; off = `--bars-surface-card` + `--bars-text-secondary` + hairline. Chip: `padding:8px 14px`, `border-radius:full`, Nunito 600 13px.
- **Primary CTA**: "Work through the five lenses →".

### 3. Lens Workshop — the authoring engine (the heart of the design)
This is **one reusable screen** that runs a 3-phase loop, cycled once per lens (5 times) for the Year pass, and **reused verbatim** for the Quarter, Month, and Week descent passes. The phase machinery is identical; only the header context and seed content differ.

**Workshop header**
- Lens identity row: element/domain glyph (`○ ◇ ◈ ● ◆` for Relationships/Career/Money/Health/Allyship) + lens name (display 700, 16px). Right side: for the **Year pass**, `Lens N of 5` (mono); for a **descent pass**, `{Quarter|Month|Week} pass` (mono, liminal).
- **Year pass** shows a 5-segment dot bar (one per lens): current = solid liminal + glow; locked = 55%-liminal; pending = `--bars-line-strong`.
- **Descent pass** shows a 4-step **cadence ladder** instead: `Year · Quarter · Month · Week` with a dot + label each. Current step = liminal; completed = secondary; pending = muted.
- **Phase stepper**: a 3-segment pill toggle — `Free-write · Options · Keep`. Active segment = liminal bg + white; inactive = transparent + muted. Tapping a segment jumps phases.

**Phase A — Free-write**
- **Title**: per-lens, e.g. "Free-write your relationships." / "Free-write this quarter."
- **Prompt** (per lens/cadence). Year examples:
  - Relationships: "Who are you with? What is the quality of contact? Write toward what you actually want."
  - Career: "What are you making, practicing, selling, serving, or becoming known for?"
  - Money: "What flow of income, stability, generosity, or receiving would change your life?"
  - Health: "What body, energy, rhythm, and practice would carry you?"
  - Allyship: "Who is better off because you showed up?"
  - Descent prompts (Health thread): Quarter — "Given your kept Health goals, what could you actually do in the next 90 days to move toward them?"; Month — "What could you do this month to move your quarter goals forward?"; Week — "What are the small moves this week — the ones that actually happen?"
- **"Moving toward" card (descent passes only)**: an inset card with mono kicker "MOVING TOWARD · {parent level label}" listing the kept goals from the level above (bulleted, liminal dots). This is what makes each level inherit from its parent.
- **Calm 10-minute timer** (inset strip): a glowing pulsing dot + status label ("ten quiet minutes · no pressure" / "paused" / "the ten minutes are up · stay as long as you like"); a large mono tabular clock `MM:SS` counting down from `10:00`; a Pause/Resume button. Below: a 3px depleting progress bar (liminal gradient). **The timer never blocks or forces** — it's ambient. Stays where it is when it hits 0; copy invites staying in flow. Implemented with a 1s interval that only ticks while on a workshop screen, in the write phase, running, and > 0.
- **Free-write textarea**: large (`min-height:260px`), flex-grow, 15px Nunito `line-height:1.65`. Placeholder: "Just write. What do you actually want here? No editing, no goals yet — let it be messy."
- **Footer microcopy** (mono, centered, muted): "No floor to clear · the page keeps no score / Stay past the timer if you're in flow."
- **Primary CTA**: "I'm done — make options →".
- **Secondary**: "Park this lens for now" (year) / "Skip this level" (descent).

**Phase B — Options**
- **Title**: "Turn it into options."
- **Body**: "Pull what you wrote into up to ten goal options. Dream wide — you'll narrow to five next."
- **Free-write echo** (if any): a scrollable inset card (max-height ~96px) showing the player's free-write text under a mono kicker "YOUR FREE-WRITE", for reference while distilling.
- **Options list**: a `count / 10` counter. Each option is an editable inline row: a 2-digit mono index, a borderless text input (placeholder "A goal you'd want…"), and an `×` remove button. An "+ Add an option" dashed-border button appends a row (disabled/dimmed at 10).
- **Primary CTA**: "Choose which to keep →".
- **Secondary**: "← Back to the page".

**Phase C — Keep**
- **Title**: "Keep five."
- **Body**: "Narrowing is focus, not loss. The rest stay in your dream notes for later."
- **Keep meter**: a progress bar + `N / 5 kept` count (count turns liminal at 5).
- **Selectable option cards**: each option from Phase B as a tappable card. Kept = liminal-wash bg + liminal ring + a numbered badge (1–5, the keep order) + primary text. Unkept = card bg + hairline + hollow badge + secondary text. When 5 are kept, the remaining unkept cards dim to 0.45 opacity (you must deselect to swap). Cap enforced at 5.
- **Primary CTA**: dynamic label — "Lock in N & review" (last lens of year) / "Lock in N · next lens" (year) / "Lock in N · build the {month|week}" (descent) / "Lock in N · into Tap the Vein" (week→ttv). Disabled (50% opacity, not-allowed) until ≥1 kept.
- **Secondary row**: "Back to options" + "Park this lens" / "Skip this level".
- **On lock**: Year pass advances to next lens (or to Review after the 5th). Descent pass advances to the next cadence (Quarter→Month→Week) or, after Week, into Tap the Vein.

### 4. Year Lens Review
- **Purpose**: See the authored year frame across all five domains.
- **Mono kicker**: "YOUR AUTHORED LENSES". **Title**: "The year you're moving toward."
- Optional saved confirmation banner (liminal wash + ◆): "Year frame saved. It's yours to revisit any time."
- **Per-domain card** (one per lens): header row = glyph + domain name (mono) + a status pill (`active` = liminal; `parked` = muted, card dims to 0.5). Body = the **list of kept goals** for that lens (bulleted, liminal dots). Footer = "Edit in workshop" (jumps back into that lens's Keep phase) + "Park" / "Make active" toggle.
- **Primary CTA**: "Derive quarterly goals →". **Secondary**: "Save year frame" → "Year frame saved ✓".

### 5–7. Quarter / Month / Week (the descent)
These are **not separate screens** — they are the **Lens Workshop reused** with a descent context (see Screen 3). Each:
- Carries the kept goals from the level above into the "Moving toward" card.
- Runs the same free-write → options → keep loop, with the calm 10-minute timer.
- Shows the cadence ladder so the player always sees where they are in Year → Quarter → Month → Week.
- Chains automatically on lock. Week's lock hands off into Tap the Vein.

### 8. Tap the Vein — Handoff ("What's bubbling up?")
- **Purpose**: Show how daily tasks become meaningful **without flooding** the system, and without top-down assignment. This is a conceptual handoff to the *existing* Tap the Vein surface — do not rebuild that whole app.
- **Mono kicker**: "TAP THE VEIN · TODAY". **Title**: "What's bubbling up?"
- **Body**: "Your lenses are set. Capture the day as it comes — then let the lenses show you which goal each thing is quietly serving."
- **Lens legend strip**: mono "YOUR LENSES" + the five domain glyphs (so the player can read resonance at a glance).
- **Emergent task cards** (5 examples): each = the task title, then an inset **resonance row** = domain glyph + mono "RESONATES WITH · {lens}" + the kept goal it serves + a pull tag (`strong pull` = liminal / `quiet thread` = muted). The lens *notices* alignment; it does not assign. Per-card actions: "Plant as BAR" (liminal), "Keep as task", "Park".
  - Example tasks → resonance: "Practice Qigong" → Health · Practicing Tai Chi and Qi Gong daily (strong); "Reach out to 50 people about $50 donation" → Allyship · 100 people in an Allyship Dojo (strong); "Finish first chapter of MTGOA" → Career · 10,000 books in real hands (quiet); "Have relationship check-in with Ari" → Relationships · A weekly repair / check-in ritual (strong); "Make coaching sales page" → Money · A steady $10,000 / month (quiet).
- **Footer note** (inset): "The lens doesn't assign — it helps you notice which emerging thing is quietly serving the year you're moving toward. Plant the ones worth growing."

### 9. Plant a BAR — Confirmation
- **Purpose**: Show a planted Tap-the-Vein task becoming a **BAR** ("a seed with provenance") carrying its full lineage. This screen is **element-coded Earth** (`data-element="earth"`), since the example is the Health/Qigong thread.
- **Pre-plant state**:
  - Mono kicker "PLANT A BAR". **Title**: "Worth growing." Body: "A planted task becomes a BAR — a seed with provenance. It carries its whole lineage with it."
  - **BAR card** (Earth-coded): `--bars-surface-card` + `0 0 0 2px` Earth frame ring + Earth glow; a large faint `土` watermark bottom-right (opacity ~0.1); a small glowing `土` + "EARTH · GROUNDED BODY" + "LENS · TODAY"; title "Practice Qigong" (display 800, 22px). **No card art.**
  - **Lineage list** (mono "CARRIES ITS LINEAGE"): four inset rows — `WEEKLY` Practice Qigong / `MONTHLY` Sign up for Bruce Frantzis Qigong / `QUARTERLY` Weekly Qigong / Tai Chi practice / `YEARLY` Practicing Tai Chi and Qi Gong daily. Lens labels tinted Earth gem.
  - **Light plant gate** (inset card, mono "A LIGHT PLANT GATE"): "Desired outcome" → "Build a practice that carries me"; "From (dissatisfaction)" chip row → `scattered, stiff, avoidant`; "Toward (satisfaction)" chip row → `grounded, alive, clear`. Chips are Earth-tinted when selected.
  - **Primary CTA**: "Plant BAR ◆" (Earth frame bg + Earth glow). **Secondary**: "Keep as task".
- **Planted state (ritual confirmation)**: a centered, idle-floating Earth-coded card (`土` glyph, "EARTH · SEED · PLANTED", "Practice Qigong") with a strong double Earth glow; "A BAR is planted." (display 800, 23px); body "It carries its lineage — year to today — into Tap the Vein. You metabolize the charge into action from here." CTAs: "Back to Today", "Review year frame".

## Interactions & Behavior

- **Navigation**: Linear forward via primary CTAs; the director rail (prototype-only chrome) jumps anywhere. In production, the canonical order is Entry → Vague → Workshop(×5 lenses) → Review → Quarter → Month → Week → Tap the Vein → Plant. Each forward step resets the body scroll to top.
- **The authoring loop** (per level): free-write (with ambient timer) → options (add/edit/remove, cap 10) → keep (toggle, cap 5, order-numbered) → lock. Locking a year lens advances to the next lens; locking the 5th opens Review. Locking a descent cadence advances to the next finer cadence; locking Week opens Tap the Vein.
- **The descent inheritance**: each cadence's "Moving toward" card reads the *kept* goals of the level above (live — if you change what you keep at Quarter, the Month pass reflects it). This is the load-bearing mechanic; implement it as a real parent→child read, not static copy.
- **Timer**: 1-second interval; decrements only while `screen ∈ {workshop, quarter, month, week}` AND `phase === 'write'` AND running AND `> 0`. Pause/Resume toggles `running`. Hitting 0 stops at 0 and swaps the status copy — never blocks input or auto-advances.
- **Feeling / dissatisfaction / satisfaction chips**: independent multi-select toggles.
- **Park / Skip**: a lens can be parked (year) — it still appears in Review but marked `parked` and dimmed, never a red/failure state. A descent level can be skipped.
- **Tap the Vein**: read-only resonance display here (the prototype's per-task buttons are illustrative of the handoff). No task is auto-planted.
- **Motion**: press-shrink `scale(0.975)` @ 80ms on all CTAs; ease `cubic-bezier(0.16,1,0.3,1)`; the planted BAR card idle-floats ±3px over 6s; timer dot pulses opacity 0.55↔1 over 2s. **Honor `prefers-reduced-motion`** (disable animations). Note: an entrance fade was intentionally removed — it rendered unreliably; don't reintroduce a blocking entrance animation.

## State Management

Per-level authoring state, keyed by a unit id (the five lens keys `relationships|career|money|health|allyship`, plus descent unit ids `qh|mh|wh` for the demonstrated Health quarter/month/week):
- `write[unit]` — the free-write text.
- `options[unit]` — array of option strings (≤10).
- `kept[unit]` — array of indices into `options[unit]` (≤5, order = keep order/badge number).
- `locked[unit]` — `'locked' | 'parked'` once committed.

Navigation/UI state:
- `screen` — current surface (`entry|vague|workshop|review|quarter|month|week|ttv|plant`).
- `wLens` — index 0–4 of the active lens during the Year pass.
- `wPhase` — `'write' | 'options' | 'keep'`.
- `timer` (seconds, from 600), `timerRunning`.
- `parkedYear[domainName]` — parked flag surfaced in Review.
- `saved`, `planted` — confirmation flags.
- `feelings`, `diss`, `sat` — chip multi-select maps.

Prototype-only toggles (not production state): `hasQuiz` (Entry with/without superpower), `dreamFilled` (seed the demo content vs. empty page), `chrome` (`full` shows the director rail / `bare` hides it for the canvas).

**Data model implication for production**: a goal node needs `{ id, lensKey, cadence (year|quarter|month|week), title, parentId, status (active|parked), keepOrder }`. The free-write and the discarded options are worth persisting as "dream notes" (the copy promises "the rest stay in your dream notes for later"). Tap the Vein resonance is a lookup from an emergent task to the goal node it best matches — in this prototype it's hand-authored; in production it's where the player (or a heuristic) tags the alignment. **No BAR is auto-created from a task** — planting is always an explicit choice.

## Design Tokens

All values come from the BARS Engine design system (`tokens/colors.css`, `tokens/spacing.css`). Use the codebase's existing `--bars-*` vars / `card-tokens.ts`; do not hardcode.

**Surfaces**
- `--bars-bg-base: #0a0908` (screen; warm near-black, never `#000`)
- `--bars-surface-card: #1a1a18` · `--bars-surface-elevated: #242420` · `--bars-surface-inset: #111110`

**Text**
- `--bars-text-primary: #e8e6e0` · `--bars-text-secondary: #a09e98` · `--bars-text-muted: #6b6965` (only ≥14px)

**Hairlines**
- `--bars-line: rgba(255,255,255,0.07)` · `--bars-line-strong: rgba(255,255,255,0.12)` · `--bars-line-dashed: #2a2a27`
- `--bars-inset-top: rgba(255,255,255,0.06)` (the load-bearing inset-top highlight — apply on every card)

**Liminal / primary action (reserved — never an element color)**
- `--bars-liminal: #7c3aed` · `--bars-liminal-glow: #a855f7`

**Earth element (used on Plant-a-BAR)**
- frame `#b5651d` · glow `#d4a017` · gem `#d4a017` · sigil `土`. (The other four elements: Fire `#c1392b/#e8671a/#e74c3c` 火, Water `#1a3a5c/#1a7a8a/#2980b9` 水, Wood `#4a7c59/#27ae60/#2ecc71` 木, Metal `#8e9aab/#bdc3c7/#bdc3c7` 金 — present in tokens but the domains themselves stay neutral; only the planted BAR is element-coded.)

**Radii**: chips/badges `6px` · buttons/inputs/wells `8px` · cards `12px` (canonical) · sheets `16px` · pills/avatars `9999px`.

**Spacing**: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48px scale. Card padding ~14–18px; screen gutter 24px.

**Shadows**
- Card: `inset 0 1px 0 rgba(255,255,255,0.06)` (never remove) + element/liminal ring `0 0 0 1–2px` + outer glow whose radius scales with altitude.
- Primary CTA: inset-top + `0 0 0 1px` liminal ring + `0 0 24px` liminal glow.
- Pressed: `inset 0 1px 0 rgba(255,255,255,0.04), inset 0 2px 4px rgba(0,0,0,0.4)`.
- Elevated (sheets/modals): `0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`.

**Motion**: ease `cubic-bezier(0.16,1,0.3,1)`; press `80ms`; base `200ms`; float period 6s (satisfied). Altitude channel: dissatisfied (1px / 30% / no glow), neutral (2px / 70% / 4px glow / 4s float), satisfied (2px / 100% / 12px glow / 6s float).

**Typography**
- Display/chrome: **Jost** (Futura PT substitute), tight `-0.02em` tracking. Titles ~22–28px, weight 800; sub-labels weight 700.
- Body/prose: **Nunito**, 13–15px, `line-height` 1.5–1.65.
- Mono/labels: **Space Mono**, 8–10px, uppercase, wide `letter-spacing` (0.1–0.24em), tabular numerals for the timer/counters.
- ⚠ Brand spec is **Futura PT Bold** for display (licensed; substituted with Jost here). If the codebase has the licensed Futura PT, use it for display/chrome.

**Iconography**: no icon font, no emoji on surfaces. Domain glyphs use geometric Unicode (`○ ◇ ◈ ● ◆`); elements use Wuxing sigils (`火水木金土`); Vibeulon/marker `◆`. Draw any new icon in the same hairline geometric register.

## Assets

**None required.** This flow is intentionally art-free:
- No cultivation-card pixel art anywhere (current project direction — do not add it; do not use it as any background).
- No raster images. All "icons" are Unicode glyphs (domain marks + Wuxing sigils) rendered in the body font and tinted via tokens.
- Fonts: Jost, Nunito, Space Mono (already in the design system's `fonts.css`); swap Jost→Futura PT if licensed.

## Files

In this bundle:
- `BARS Lenses Onboarding.dc.html` — the full interactive prototype (all 9 surfaces, all copy, all state). **Primary reference.**
- `BARS Lenses Onboarding - Canvas.dc.html` — a 16-frame storyboard of the screens/states. Reference only.

In the broader prototype project (for context, not required to implement):
- `BARS Tap the Vein - UI.dc.html` — the existing daily-execution surface this flow hands off to.
- `_ds/bars-engine-design-system-…/` — the bound design-system tokens & components the prototype styles against (mirror of the codebase's token system).

### How to read the prototype source
Each `.dc.html` is a single file with three parts: an HTML template (the markup, between `<x-dc>` tags), a `class Component` logic block (state + handlers + a `renderVals()` that computes per-render values), and a small JSON props blob. The template uses `{{ name }}` holes filled by `renderVals()` and `<sc-if>` / `<sc-for>` control-flow tags. **Translate the structure and values into idiomatic React for the BARS codebase** — don't try to preserve the template syntax. Everything you need (copy, tokens, layout, state transitions) is in this README; the source is there for exactness.

## Open Questions (flag with the product owner)

1. **Per-goal descent across all five categories (REQUIRED, not optional).** The prototype demonstrates the Quarter/Month/Week descent on the single **Health** thread only. Production **must** run the descent for all five lenses — Relationships, Career, Money, Health, Allyship — with each kept year goal getting its own passes. Recommended UX: a goal/lens picker at the top of each cadence so the player descends one parent goal at a time, with clear progress across the set. This is the single most important gap between the mock and the shippable product.
2. **Tap the Vein resonance source.** Resonance (task → kept goal) is hand-authored in the prototype. Decide whether the player tags it, or a heuristic suggests it — but keep it as *noticing alignment*, never assignment, and never auto-planting.
3. **Persistence of dream notes.** Confirm that free-writes and discarded options are retained as "dream notes" (the copy promises this).
