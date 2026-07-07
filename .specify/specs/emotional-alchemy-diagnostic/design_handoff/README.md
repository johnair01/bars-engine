# Handoff: Emotional Alchemy — Charge Diagnostic

## Overview
A mobile-first (~430px), single-question-per-screen flow where a player names a raw emotional **charge** and answers a few quick taps. The app returns a structured **"read"** — not a verdict. This is the **pre-card** half of the Emotional Alchemy arc (the diagnostic); the composer's practice card is the post-card half (out of scope here, but see "The threshold" below).

**Core metaphor (load-bearing):** this surface is the **PRE-CARD** state. The charge is raw and unformed, so the UI is deliberately *quieter and less finished* than the game's element-coded cultivation cards. Element color is withheld the entire flow and appears for the **first time** only at the end, on "The Read." That restraint is the point — do not "prettify" it by adding element chrome earlier.

---

## About the design files
The files in this bundle are **design references created in HTML** — a working prototype showing intended look and behavior. They are **not production code to copy directly.**

- `Charge Diagnostic.dc.html` — the prototype. It is a self-contained HTML "Design Component" that renders an iOS device frame + the full clickable flow. It uses a small in-house runtime (`support.js`, not included) and the BARS Engine design-system token CSS (also not bundled). **You do not need to run it** — the screenshots + this README are the source of truth. If you want to open it, it depends on the BARS Engine token stylesheets and `support.js` from the main app repo.
- `ios-frame.jsx` — the device-bezel component used only to present the screens as a phone. **Not part of the feature** — your app already runs on a real device; ignore the bezel, status bar, dynamic island, and home indicator.
- `screenshots/` — one PNG per screen/state (full device), referenced below.

**Your task:** recreate these screens in the target codebase's existing environment (the BARS Engine Next.js app: React + the existing `SceneCard`/`SceneInput`/`SceneNav` primitives and `card-tokens.ts`), using its established patterns — **not** by shipping this HTML. Where this prototype hand-rolls a control, prefer the app's existing component if one exists.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final and intended to be matched. Two caveats:
1. **Type:** the prototype renders the BARS *marketing* stack (Jost / Nunito / Space Mono) because that's what was requested for this exploration. **The real in-app practice surface should use the app sans (Geist) with `tabular-nums` on all numerals**, per the original diagnostic spec — swap the families, keep every size/weight/spacing value below.
2. **Slider thumb:** some screenshots render the range thumb as a small native dot — that's a screenshot-engine artifact. The intended thumb is specified exactly under "Intensity."

---

## Design tokens
All values come from the BARS Engine `SURFACE_TOKENS` / `ELEMENT_TOKENS` / `ALTITUDE_TOKENS`. Do not hardcode hex in components — read these from the token source.

### Surfaces
| Token | Hex | Use |
|---|---|---|
| bg-base | `#0a0908` | screen background (warm near-black — never lightened for contrast) |
| surface-inset | `#111110` | raw input wells (textarea/input) |
| surface-card | `#141412`–`#1a1a18` | option chips/rows, read tiles |
| surface-elevated | `#242420` | crisis panel, intensity crisis-nudge card |

### Text
| Token | Hex | Use |
|---|---|---|
| text-primary | `#e8e6e0` | prompts, the read, option labels |
| text-secondary | `#a09e98` | subtext (15px) |
| text-muted | `#6b6965` | mono micro-labels (≥14px only; never at 12px) |
| placeholder | `#57554f` | input placeholders |

### Primary action / liminal (RESERVED — never an element color)
| Token | Hex | Use |
|---|---|---|
| liminal | `#7c3aed` | Continue button, progress pips, all selection states (chips/rows/slider) |
| liminal-glow | `#a855f7` | button border, slider thumb ring, links (`a`), link hover `#c084fc` |

### Element gems (used ONLY on the selected channel chip + The Read)
| Emotion | Element | gem | frame | glow |
|---|---|---|---|---|
| Anger | Fire | `#e74c3c` | `#c1392b` | `#e8671a` |
| Sadness | Water | `#2980b9` | `#1a3a5c` | `#1a7a8a` |
| Fear | Metal (silver-slate — **never purple**) | `#bdc3c7` | `#8e9aab` | `#bdc3c7` |
| Joy | Wood | `#2ecc71` | `#4a7c59` | `#27ae60` |
| Neutrality | Earth | `#d4a017` | `#b5651d` | `#d4a017` |

Amber `#d4a017` / `#b5651d` is also the **crisis/pause** accent (see Crisis + intensity nudge).

### Altitude → border + glow (how "formed" something looks)
| Altitude | border | opacity | glow |
|---|---|---|---|
| dissatisfied (raw) | 1px | 30% | none |
| neutral (forming) | 2px | 70% | 4px |
| satisfied (formed) | 2px | 100% | 12px |

### Spacing / radius / motion
- Screen gutter: **22px** horizontal.
- Radii: inputs/buttons/rows **8px**, chips **6px** (channel chips use 8px here), crisis panel **20px**, read tiles **12px**.
- Hairline borders: `rgba(255,255,255,0.09)` (rest), dashed divider `#2a2a27`.
- Load-bearing inset highlight on card-like surfaces: `inset 0 1px 0 rgba(255,255,255,0.03–0.06)`.
- Motion: one ambient change per screen. Scene entry = fade + rise 8px, `.34s cubic-bezier(0.16,1,0.3,1)`. Honor `prefers-reduced-motion` (disable the entry animation).
- Touch targets ≥ **44px**. WCAG AA (4.5:1 body / 3:1 large).

### Type scale (sizes/weights to match; swap families to Geist in-app)
- Screen title (H1): **30px / 700 / -0.02em tracking / 1.12 line-height** (display sans).
- Body subtext: **15px / 1.55 / `#a09e98`**, `max-width: 32ch`.
- Option label: **15px / 700 / `#e8e6e0`**.
- Option sublabel + all micro-labels: **mono, 10px, letter-spacing 0.2em, uppercase, `#6b6965`**.
- The Read headline / intensity readout: **mono tabular, up to 34–64px / 700**.

---

## Global chrome (present on every step screen)
- **Top:** `← DASHBOARD` (muted mono, 11px, tap = exit) on the left; eyebrow `EMOTIONAL ALCHEMY` (mono 10px, `#b5651d`) on the right.
- **Progress pips:** a row of thin bars — one per active step. Completed = `rgba(124,58,237,0.5)`, current = solid `#7c3aed` (wider, 22px), upcoming = `rgba(255,255,255,0.1)`. **No numeric step count.**
- **Bottom bar (thumb zone, always):**
  - Row 1: ghost **Back** (`1px rgba(255,255,255,0.09)` border, disabled/no-op on first step) + filled **Continue** (`#7c3aed`, border `#8b5cf6`, glow `0 0 24px rgba(124,58,237,0.35)`; disabled = `#1a1a18` / muted until the step's answer is valid).
  - Row 2 (above a hairline): **"Just get it down"** (muted text → Captured end state) on the left; **"I need more than a practice"** (bordered, warms to amber `#d4a017`/`#b5651d` on hover → Crisis) on the right.
- Continue label is contextual: **"Continue"** normally, **"Skip — continue"** on the optional Story step when empty, **"See the read →"** on the Defaults step.

---

## Screens

Order of steps (with branching): **name → thread → channel → [flat fork] → intensity → time → when → fuel → story → [held fork] → defaults**, then end state **The Read**. Exits from any step: **Captured** or **Crisis**.

### 1. Name the charge — `screenshots/01-name.png`
- H1 "What's the charge?"; sub "Say it plainly, in your own words. Notice where in your body it lives."
- A `textarea` in a `#111110` well (`1px #26261f`, radius 8, min-height 150), placeholder "It's still sitting in my chest — that meeting…". Continue enabled once non-empty.

### 2. Name the thread — `screenshots/02-thread.png`
- H1 "Name the thread."; sub "The storyline this belongs to — a word or two. You'll recognize it later."
- Single-line `input`, same well styling. Placeholder "the standup thing". Required.

### 3. Which is closest? (channel picker) — `03-channel-empty.png`, `04-channel-treatmentA.png`, `05-channel-treatmentB.png`, `06-channel-treatmentC.png`
- H1 "Which is closest?"; sub "You don't have to be sure. A first read is enough — it's still unformed."
- **2-column grid** of 6 chips (`#141412`, `1px rgba(255,255,255,0.09)`, radius 8, min-height 72, inset highlight). Label 15/700 + mono sublabel:
  - **Mad** — "heat · push · no" → Anger/Fire
  - **Sad** — "weight · pull · loss" → Sadness/Water
  - **Scared** — "edge · brace · what-if" → Fear/Metal
  - **Bright, stuck** — "want · no traction" → Joy/Wood
  - **Flat / numb** — "muffled · far away" → Neutrality/Earth
  - **I can't tell** — "won't name itself" → no element
- **Selected-chip treatment (the key pre-card decision).** Resting chips are always neutral. The *selected* chip previews its element at **dissatisfied-altitude weight** (thin, no glow) — never a full gem/glow "card." Three treatments were prototyped (switchable in the prototype via the small "REVIEW · SELECTED-CHIP TREATMENT" toggle; ship ONE — **recommend A**):
  - **A — hairline tint** (`04`): `1px solid {frame}` border + `color-mix({gem} 12%, #141412)` wash. Restrained; reads most "unformed."
  - **B — gem dot** (`05`): neutral fill, gem-colored label, a `{gem}` dot top-right + a 2px `{frame}` bottom underline.
  - **C — accent bar** (`06`): neutral chip + 3px `{frame}` left border + faint `{gem} 7%` wash.
- Non-element chips ("I can't tell", any pre-element selection) select with **purple** (`#7c3aed` border + purple wash), since there is no element yet. "Flat / numb" selects with Earth/ochre (see `18-flat-fork.png` for the selected earth tint).

### 4. Flat fork (conditional) — `screenshots/18-flat-fork.png`
- Shown **only if** channel = "Flat / numb". H1 "Flat — but which flat?"; sub "Numbness has textures. Naming it is not the same as fixing it."
- Full-width stacked rows (purple-selected): **Rested** / **Walled-off** / **Buried** / **Grey**, each with a mono subline.

### 5. Intensity ("How loud") — `07-intensity.png`, `08-intensity-max-crisis-nudge.png`
- H1 "How loud, right now?"; sub "Not how bad — how loud. Drag to where it sits."
- **Slider control** (replaces an earlier 0–10 tap row):
  - Large **tabular-nums readout** (64px/700) + mono "/ 10". Readout is `#e8e6e0`; at **10** it turns amber `#d4a017`. Before the user moves it, readout shows `—` in `#57554f` and Continue stays disabled.
  - Native `range` (min 0, max 10, step 1), 6px track, radius 6. **Filled portion** `#7c3aed`, **unfilled** `#2a2a27` (a live `linear-gradient` at `value/10 %`). **Thumb:** 28px circle, `#7c3aed`, `2px #a855f7` border, `box-shadow: 0 0 18px rgba(124,58,237,0.6)`, brighter on `:active`. (Pre-set: full grey track.)
  - End labels `QUIET` / `FLOODING` (mono 10px, `#6b6965`).
  - **A value of 10 reveals an inline amber nudge card** (`08`): `#242420` panel, `1px #b5651d`, radius 12; mono eyebrow "A 10 IS A LOT TO HOLD"; body "At full flood, a practice may not be the right tool right now. That's not failure — it's data."; a "I need more than a practice →" link (`#d4a017`) → Crisis.

### 6. Time — `screenshots/09-time.png`
- H1 "How much time do you have?"; sub "Be honest about right now, not your best self."
- Stacked rows (purple-selected): **2 minutes** / "a breath and a note" · **10 minutes** / "one real move" · **30 minutes** / "room to sit with it".

### 7. When — `screenshots/10-when.png`
- H1 "When is this?"; sub "Where the charge lives in time changes the move."
- Rows: **Happening now** / "live, in the room" · **Replaying** / "already happened, still looping" · **Coming up** / "bracing for it".

### 8. Fuel — `screenshots/11-fuel.png`
- H1 "What's your fuel?"; sub "Capacity, not mood. It sizes the ask."
- Rows: **Depleted** / "running on empty" · **Steady** / "enough to work with" · **Charged** / "plenty in the tank".

### 9. Story — `screenshots/12-story.png`
- H1 "The story you're telling."; sub "Optional. The narration in your head — not the facts. Stuckness is data, not failure."
- Optional `textarea` (same well), placeholder "They think I can't handle it…". When empty the primary button reads **"Skip — continue"**.

### 10. Held fork (conditional) — `screenshots/13-held-fork.png`
- Shown **only if** channel = Mad or Scared. Styled slightly more "held": a purple-tinted mono eyebrow "A CAREFUL ONE". H1 "Did this land on you — or did you witness it?"; sub "Both are valid charges. The answer changes what a fair move even is."
- Rows: **It landed on me** / "I was the one it hit" · **I witnessed it** / "it happened to someone else" · **Both** / "it hit me and others".

### 11. Defaults — `screenshots/14-defaults.png`
- H1 "Here's what I'll assume."; sub "Asked, not inferred. Change any of it — nothing is locked."
- Three labeled rows of pre-selected editable pills (mono labels, purple-selected):
  - **ALTITUDE — WHERE IT SITS NOW:** Raw (default) / Forming / Formed.
  - **TARGET — WHAT IT WANTS TO BECOME:** channel-specific (Anger → Triumph / Boundary / Repair; Sadness → Acceptance / Comfort / Release; Fear → Safety / Clarity / Readiness; Joy → Momentum / Expression / Sharing; Neutrality → Aliveness / Curiosity / Contact). First option pre-selected.
  - **SHAPE — HOW IT'S HOLDING:** Knot / Weight / Fog / Spark / Static / Edge (default by channel: Anger→Edge, Sadness→Weight, Fear→Static, Joy→Spark, Neutrality→Fog).
- Primary button: **"See the read →"**.

---

## End states

### The Read — the threshold — `screenshots/15-the-read.png`
This is the single screen allowed to show element color, and it is the payoff of all the pre-card restraint. No top chrome/pips.
- Mono eyebrow "THE READ".
- Headline line, e.g. **"Anger 6 → Triumph"** (display 34px): channel name + **gem-colored tabular intensity number** + `→` + target.
- The line sits on a **bottom border at NEUTRAL altitude weight**: `2px solid color-mix({frame} 70%, transparent)` + soft `4px` element glow (`0 4px 12px -4px color-mix({gem} 45%, transparent)`). **Not** satisfied-weight — it's *becoming* legible, not finished.
- Mono meta line (uppercase): `RAW · REPLAYING · STEADY FUEL · 10 MIN` (altitude · when · fuel · time).
- Two tiles (`#111110`, radius 12): **THREAD** (the thread text) + **SHAPE**.
- Mono privacy line "YOUR WORDS NEVER LEFT THIS DEVICE." + body "This is the threshold. On the other side, the charge becomes a formed practice — with an element, and a move."
- Footer: primary **"Form the practice →"** (leads to the post-card practice card — out of scope) + text **"Begin again"** (resets).

### Crisis — `screenshots/16-crisis.png`
Reachable in ≤1 tap from every step. **No game chrome** — this is not a game moment.
- Elevated warm panel `#242420`, `1px #b5651d`, radius 20, big drop shadow.
- Mono eyebrow "PAUSE"; amber H2 (`#f0c84a`) "This might need more than a game."; body about crisis + reaching out being the stronger move.
- Inner `#0a0908` box: mono tabular **988** (22px) + "Suicide & Crisis Lifeline — call or text, 24/7 (US)".
- Mono reassurance "NOTHING HERE WAS SAVED OR SENT."
- Footer: **"Back to the diagnostic"** + "Begin again".

### Captured — `screenshots/17-captured.png`
Honors the non-transformation path without shame.
- Mono eyebrow "CAPTURED"; H1 "Getting it down is a complete session."; body "You named it and let it be named. That counts — no move required. It'll be here when there's more room to hold it."
- A `#111110` tile echoing what the user wrote (mono "YOU WROTE" + italic text).
- Footer: **"Done"** + "Begin again".

---

## Interactions & behavior
- **Navigation:** Continue advances through the *active* step list (branches included); Back goes one step back (no-op on first). Each transition plays the fade+rise entry and resets scroll to top.
- **Branching:** Flat fork appears iff channel = Flat; Held fork appears iff channel = Mad or Scared. Both are required when shown. Defaults' Target/Shape options and pre-selections are derived from the chosen channel.
- **Validation / gating:** Continue disabled until the current step's answer exists — name/thread non-empty; channel/intensity/time/when/fuel/(fork) chosen; story optional; defaults always valid.
- **Crisis affordance:** always present in the bottom bar; also surfaced inline when intensity = 10.
- **Exits:** "Just get it down" → Captured; "I need more than a practice" (or the inline nudge) → Crisis. Both end states offer one calm way back and a full reset.
- **Motion budget:** one ambient change per screen (the entry). The Read's element accent may glow in once. All motion pauses under `prefers-reduced-motion`.

## State (data captured by the flow)
`name` (string), `thread` (string), `channel` (mad|sad|scared|bright|flat|cant-tell), `flat` (rested|walled|buried|grey — if flat), `harm` (onme|witness|both — if mad/scared), `intensity` (0–10 | null), `time` (2|10|30), `when` (now|replay|upcoming), `fuel` (depleted|steady|charged), `story` (string, optional), `altitude` (dissatisfied|neutral|satisfied, default dissatisfied), `target` (string, channel-derived default), `shape` (string, channel-derived default). Plus UI state: current screen, chosen chip treatment (design-review only — ship one). Nothing is persisted or transmitted (the privacy copy must remain true).

## Assets
None beyond the token stylesheets and fonts. No icons/images are used (the geometric `→` and mono labels carry the UI). The phone bezel in the screenshots is presentation-only.

## Files in this bundle
- `Charge Diagnostic.dc.html` — the HTML prototype (reference only; depends on BARS tokens + `support.js`).
- `ios-frame.jsx` — presentation-only device frame (ignore for the feature).
- `screenshots/*.png` — 18 full-device state captures, named by step.
