# Design Handoff: Emotional Alchemy Practice Surface

Date: 2026-07-06
Routes: `/practice/diagnose` (built — target 2), practice-card render (contract for target 3)
Implementation: `src/app/practice/diagnose/`, `src/components/practice/{DiagnosticFlow,DiagnosticSummary}.tsx`
Design law: [`UI_COVENANT.md`](../../../UI_COVENANT.md) · tokens: [`src/lib/ui/card-tokens.ts`](../../../src/lib/ui/card-tokens.ts)

> This is the design contract for the whole Emotional Alchemy arc, not just the diagnostic. The diagnostic is the **pre-card** half; the composer's practice card (target 3) is the **post-card** half. The two must read as one system with a threshold between them — that threshold is the product's core metaphor (UI_COVENANT law 10).

---

## The governing idea: pre-card → post-card is the alchemical moment

UI_COVENANT law 10: *"Raw/unformatted (pre-card) must look visually distinct from element-coded (post-card). This is the product's core metaphor."*

The Emotional Alchemy flow is the clearest place in the app to honor this:

| Phase | Surface | Register | Why |
|---|---|---|---|
| **Diagnose** (this build) | `SceneCard` — raw, hairline, contemplative | **Pre-card** | The charge is unformed. The player doesn't yet know its element. Showing full element chrome here would be a lie about where they are. |
| **Read** (summary) | The threshold — first element hint appears | **Liminal** | The channel is now named. The summary's `channel → target` line is where the first gem/accent glow enters — the charge is *becoming* legible. |
| **Practice** (target 3) | `CultivationCard`, full element/altitude/stage chrome | **Post-card** | The charge is now a move with an element, an altitude, and a satisfaction target. This is the formed artifact. |

**Do not skip the distinction to make the diagnostic prettier.** A diagnostic that already looks like a finished cultivation card destroys the alchemical payoff of the practice card. Restraint here is load-bearing.

This matches the app precedent exactly: `Shadow321Runner` and `ChargeCaptureForm` are both pre-card `SceneCard` surfaces; the deck and hand are post-card `CultivationCard` surfaces.

---

## Design system (BARS Engine — the values this surface uses)

All from `SURFACE_TOKENS` / `ELEMENT_TOKENS` / `ALTITUDE_TOKENS` in `card-tokens.ts`. No hex lives in a component (UI_COVENANT law 14).

**Shell**
- Background `#0a0908` (`SURFACE_TOKENS.bgBase`) — warm near-black, never lightened for contrast (law 13)
- Raw input wells `#111110` (`surfaceInset`) — the `bg-zinc-950` SceneInput fields land here
- Elevated (end-state panels, crisis card) `#242420` (`surfaceElevated`)
- Hairline borders: `zinc-800/900` at rest — deliberately faint; this is pre-card

**Text** (never `text-muted`/`text-zinc-600` at `text-xs` — ~3.2:1, fails AA, law 11)
- Primary `#e8e6e0` (`textPrimary`) — prompts, the read
- Secondary `#a09e98` (`textSecondary`) — subtext at `text-sm`
- Muted `#6b6965` (`textMuted`) — labels at `text-sm`+ only

**Primary action** — liminal purple `#7c3aed` (SceneNav "Continue", progress pips, intensity selection). Purple is reserved for primary action / liminal states only — it is **not** an element color (law: Metal is silver-slate `#8e9aab`, never purple).

**Element gems** (the five channels — used only at the threshold and beyond, `ELEMENT_TOKENS[el].gem`)
- Anger → Fire `#e74c3c` (frame `#c1392b`, glow `#e8671a`)
- Sadness → Water `#2980b9`
- Fear → Metal `#bdc3c7` (silver-slate — **never violet/purple**)
- Joy → Wood `#2ecc71`
- Neutrality → Earth `#d4a017`

**Altitude → border/glow** (`ALTITUDE_TOKENS`) — how "formed" a thing looks
- dissatisfied: 1px border, 30% opacity, **no glow** (the default state of a raw charge)
- neutral: 2px, 70%, 4px glow
- satisfied: 2px, 100%, 12px glow + inner ring

**Type** — the in-app practice surfaces use the app sans (`font-sans`, Geist) like `/capture`, with tabular-nums on every number (intensity, time, the read). Jost/Nunito/Space Mono are the marketing-surface stack (sales/launch) and do not apply here. Numerals always `tabular-nums` (UI_COVENANT law 2).

**Motion** — one ambient change per screen max (law 12). Section fade/rise on step advance; the summary's element accent may glow in once. Everything pauses under `prefers-reduced-motion`.

**Touch / a11y** — every tappable target ≥ 44px (law 11); WCAG AA 4.5:1 body / 3:1 large; the crisis affordance is reachable in ≤1 tap from every step.

---

## Screen-by-screen (current build + intended design)

### Chrome
Header: `← Dashboard` (muted), gold-adjacent mono eyebrow "Emotional Alchemy", H1 "Charge Diagnostic", one-line secondary. Max width `~430px` mobile-first (`max-w-lg`), thumb-first — nav and both exits live in the bottom 40% (law 5).

### The step scenes (`SceneCard`)
One question per scene, no nav chrome mid-scene, purple progress pips (context, not a frontloaded step count). Steps: blocker → thread → channel → [flat fork | can't-tell] → intensity → time → temporal → fuel → story → [layer check] → [harm relation] → [safety] → defaults.

- **Free-writes** (blocker, story): `SceneInput`, `bg-zinc-950` well (`surfaceInset` register), with the somatic-pause subtext ("notice where in your body it lives"). Copy stays terse — over-explanation activates cognition and defeats the felt-sense tool (the non-clinical boundary is a UX requirement).
- **Channel picker**: 2-col chip grid. **This is the most important pre-card design decision — see Alignment Gaps below.** Chips read as *unformed*: neutral by default, a restrained element-tinted **hint** on selection (the charge previewing what it will become), never full card chrome.
- **Flat fork** (`tone="somatized"`, the purple-tinted SceneCard tone): the four-answer disambiguation. Visually the most "held" scene — this is the system's single largest bypass guard.
- **Intensity**: 0–10 as an 11-cell tabular-nums row; selected = purple. A `10` reveals the amber crisis nudge inline.
- **Defaults**: altitude / target / (channel, when needed) as pre-selected editable chip rows — the "asked, not inferred" contract made visible. A cross-channel target shows the standing guard line.

### Nav + exits (bottom, always)
`SceneNav` (Back ghost + purple Continue). Below a hairline: **"Just get it down"** (capture-only, muted) and **"I need more than a practice"** (crisis, bordered, warms to amber on hover). Both present on every step (§8.4).

### End states
- **Summary — the threshold.** The read: `Channel N → Target`, altitude · temporal · fuel · time, thread + shape tiles, flag notes, the privacy reassurance. **This is where the first element accent belongs** (see gap A2).
- **Crisis.** Elevated warm panel, amber H2, the 988 line, "nothing was saved or sent", one calm way back. No card chrome — this is not a game moment.
- **Capture.** "Getting it down is a complete session." Honors the non-transformation path without shame.

---

## Alignment gaps in the current build (fix before target 3)

The instrument is functionally correct but has three token-discipline gaps against the covenant. These are cheap, high-value fixes:

**A1 — Channel chips use arbitrary Tailwind color (`border-red-600 bg-red-950/40`…), which law 7 forbids for game aesthetic.**
Fix: derive the selected-state accent from `ELEMENT_TOKENS[channel]` via CSS custom properties, not literal Tailwind classes. Keep the *resting* chip neutral (zinc hairline) so the pre-card register holds; only the **selected** chip previews its element — a low-intensity tint (think dissatisfied-altitude weight: thin border, no glow), never a full gem/glow. `flat` and `can't-tell` have no element and stay neutral. This preserves law 10 (pre-card ≠ post-card) *and* fixes law 7.

**A2 — The summary is fully neutral; the threshold moment is unmarked.**
Fix: the summary's `Channel N → Target` line is where the element enters for the first time — the channel's `gem` as a small accent (border-bottom or a gem dot), at **neutral** altitude weight (2px/70%/4px glow), not satisfied. This is the visual "your charge now has a shape" beat that sets up the practice card. Keep the rest of the summary raw.

**A3 — Ad-hoc accent maps risk drift.**
`DiagnosticSummary.CHANNEL_ACCENT` and `DiagnosticFlow.CHANNEL_OPTIONS[].active` are local color objects — the exact `CHANNEL_META`/`NATION_PALETTE` anti-pattern the covenant says to delete. Fix: one shared `channelElementVars(channel)` helper returning CSS vars from `ELEMENT_TOKENS`, consumed by both.

None of these change behavior or copy; they move color from literals to tokens and add exactly one element accent at the threshold.

---

## The post-card contract (target 3 — so the composer's practice card lands aligned)

When the composer renders a recommended practice, it **is** a post-card moment → use `CultivationCard`, not `SceneCard`:
- **Element** = the vector's channel (`EMOTION_TO_ELEMENT[channel]`).
- **Altitude** = the vector's `altitude` (dissatisfied at entry; the re-rate at close can visibly lift it toward satisfied — the altitude channel *is* the progress meter, honestly).
- **Stage** = `growing` for the active practice; `composted` once logged.
- The tool protocol lives in the description well (`surfaceInset`); the timebox and the re-rate delta are the stat block (tabular-nums). The Show Up options are the primary action (bottom 40%).
- Crossing from summary → practice card should feel like *formation*: the neutral read resolves into a fully element-coded card. That transition is the payoff the diagnostic's restraint has been saving up for.

---

## Paste into Claude Design

> Design the **Emotional Alchemy Charge Diagnostic** — a mobile-first (~430px), single-question-per-screen flow for a dark, warm, tactile allyship practice game. The player names an emotional charge and answers a few quick taps; the app returns a structured "read." **Critical metaphor: this is the PRE-CARD state — the charge is raw and unformed.** It must look deliberately *quieter and less finished* than the game's element-coded "cultivation cards," so that when the charge later resolves into a practice card, that formation feels earned.
>
> **System:** background `#0a0908` (warm near-black); raw input wells `#111110`; text primary `#e8e6e0`, secondary `#a09e98`; primary action + progress in liminal purple `#7c3aed`; app sans-serif, all numerals tabular. Hairline zinc borders at rest — faint, contemplative. One ambient motion per screen; respect `prefers-reduced-motion`; 44px min targets; WCAG AA.
>
> **Screens (one question each, purple progress pips, no step count):** (1) *Name the charge* — a textarea with a somatic-pause prompt ("notice where in your body it lives"). (2) *Label the thread* — short input. (3) *Which is closest?* — 6 chips: Mad / Sad / Scared / Bright-but-stuck / Flat-or-numb / I can't tell. Chips read as **unformed** — neutral by default; on selection a *restrained* element tint (Anger→ember-red, Sadness→deep-blue, Fear→silver-slate NOT purple, Joy→jade, Neutrality→ochre), thin, no glow — a preview, not a finished card. (4) If *flat*: a four-answer fork — Rested / Walled-off / Buried / Grey. (5) *Intensity 0–10* as a tabular row; a 10 reveals a calm amber "need more than a practice?" nudge. (6) time (2/10/30) · (7) when (now/replay/upcoming) · (8) fuel (depleted/steady/charged). (9) *The story you're telling* — optional textarea. (10) Conditional forks (layer check / did-you-receive-or-witness / power-over-safety) styled slightly more "held". (11) *Defaults* — altitude, target, shape as pre-selected editable chips ("asked, not inferred").
>
> **Persistent bottom bar (every screen):** ghost Back, purple Continue, plus two low-key exits — "Just get it down" and a bordered "I need more than a practice" that warms to amber.
>
> **End states:** (a) **The Read** — the threshold moment: `Channel Intensity → Target` (e.g. "Anger 6 → Triumph") where the channel's element accent appears for the *first time*, at medium weight (2px border, soft 4px glow), plus thread/shape tiles and a "your words never left this device" line. This is the one screen allowed to hint element color. (b) **Crisis** — a warm elevated panel, no game chrome, the 988 line, reassurance nothing was saved. (c) **Captured** — "getting it down is a complete session."
>
> **Feel:** a calm, honest diagnostic instrument — closer to a well-set questionnaire in a hand-made book than a SaaS form or a flashy game screen. Restraint is the point: this is the raw material *before* the alchemy, and it should visibly be that.

---

## References
- `UI_COVENANT.md` (laws 7, 10, 11, 12, 13, 14; three-channel encoding; CultivationCard API)
- `src/lib/ui/card-tokens.ts` (`SURFACE_TOKENS`, `ELEMENT_TOKENS`, `ALTITUDE_TOKENS`, `EMOTION_TO_ELEMENT` via `src/lib/emotional-alchemy`)
- `src/components/scene-card/SceneCard.tsx` (the pre-card primitive)
- `src/app/shadow/321/Shadow321Runner.tsx`, `src/components/charge-capture/ChargeCaptureForm.tsx` (pre-card precedents)
- `docs/handoffs/2026-07-02-launch-page-claude-design-handoff.md` (handoff format precedent)
- `.specify/specs/emotional-alchemy-diagnostic/spec.md` (behavior spec this design serves)
