# Spec: MtGoA Menu — Skeuomorphic CYOA Redesign

## Purpose

Redesign the *Mastering the Game of Allyship* menu/hub (`/mastering-allyship/hub`) from a
flat **black-on-black-with-color-accents** layout — which reads as "AI-generated" — into a
**skeuomorphic, CYOA-forward** experience where the eight curriculum spokes feel like **real
objects** the player moves through, the way the **handbook page pretends to be a book**.

**Problem**: The current hub (and the menu pattern it represents) is generic dark cards with
purple accents. The brand *colors* are right; the **materiality** is missing. Players don't
feel they're handling a thing. This erodes trust and the "the game creates the game" ethos,
and clashes with the project's own **UI Covenant**, which already mandates a "physical card
feel" (the `inset 0 1px 0 rgba(255,255,255,0.06)` highlight trick, semantic element color,
tactile cards) — the current page simply doesn't honor it.

**Practice**: Deftness Development — spec kit first, **design intake before pixels**,
deterministic over AI. **Read [`UI_COVENANT.md`](../../../UI_COVENANT.md) before any UI code**
and apply the three-channel encoding (element=color, altitude=border, stage=density) via
`src/styles/cultivation-cards.css` + `src/lib/ui/card-tokens.ts`; Tailwind for layout only.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Intake first | **Phase 0 is a structured design intake** (below). No production CSS until the object metaphor + token map are chosen with the host. This is the "whole design intake" the host asked for. |
| Anchor to the covenant | The redesign **realigns to `UI_COVENANT.md`**, not a new system. Skeuomorphism = the covenant's "Physical Card Feel" applied at full strength (top-edge highlight, frame, glow, warm near-black `#1a1a18` card body on `#0a0908` bg — **not** pure black). |
| Brand colors kept | Existing brand hues stay; what changes is **materiality + light** (bevels, insets, paper/wood/cloth texture, depth), not the palette. Decorative color stays forbidden (covenant Law 9). |
| Skeuomorphic reference | **DECIDED (intake 2026-06-15):** a **deck of cards on a dark-slate table**; each spoke is a `CultivationCard` carrying the **player's nation element**; **"Draw"** a card to enter. The handbook ("pretends to be a book") remains the materiality north star. See [`design-intake.md`](./design-intake.md). |
| CYOA framing | **Open board** — all eight spokes freely choosable (no gating, no lock-shaming). Entries read as cards you draw into the spoke, feeding the CYOA pipeline (GSCP). |
| No arbitrary Tailwind aesthetics | Per covenant Law 7: game aesthetic via CSS classes/tokens, never Tailwind arbitrary color/shadow values. New textures live in `cultivation-cards.css`. |
| Accessibility is a gate | WCAG AA (4.5:1 body, 3:1 large/UI), 44px targets, `prefers-reduced-motion` guards — covenant Law 11. |

## Phase 0 — Design Intake (the deliverable the host asked for)

> **✅ ANSWERED 2026-06-15 → [`design-intake.md`](./design-intake.md).** Outcome: deck of
> cards on a dark-slate table; `CultivationCard`s in the player's nation element; "Draw" to
> enter; open board; scope = hub + spoke + reusable primitive. **One item still open:**
> **C8 card-face content** is blocked on a short *launch-goals respec* (what each card
> foregrounds to serve the July 18 funnel). The questions below are kept for the record.

Resolve these **with the host** before implementation. Capture answers in
`design-intake.md` in this folder (the brief), then map every visual decision to a token.

**A. Object metaphor (WHAT is this menu, physically?)**
1. Is the hub a **book's table of contents** (closest to the handbook), a **quest board / field map** (spokes pinned in space), or a **deck of cards laid on a surface**? Pick one primary metaphor.
2. What material(s) carry the brand? (paper/parchment, wood, cloth/linen, metal plate, leather?)
3. What is the "surface" the objects rest on (table, desk, map, ground)?

**B. Light & depth (what makes it feel real?)**
4. Single light source direction (for consistent bevels/shadows)?
5. How much depth — subtle (covenant minimum: top-edge inset + frame) or richer (layered shadows, page curl, embossing)?
6. Texture intensity (clean vs. visibly grainy/aged)?

**C. CYOA reading (how do the 8 spokes present?)**
7. Linear chapters (1→8, gated) or an open board (choose any unlocked spoke)?
8. What does each spoke entry show at a glance (chapter number, Kotter stage, title, feeling chips, progress, lock state)?
9. Begin vs. Continue affordance — what's the verb and where does it sit (thumb-zone, covenant Law 5)?

**D. Tokens & scope**
10. Any **new tokens/textures** needed beyond `card-tokens.ts` (e.g. paper texture, bevel)? If yes, they must be added to the token files, not a component (covenant Law 14).
11. Scope: just `/mastering-allyship/hub`, or also the spoke page (`/mastering-allyship/spoke/[index]`) and the menu **pattern** reused elsewhere?

> Output of Phase 0: `design-intake.md` (answered brief) + a token-map table. Implementation
> phases below are provisional until the intake is answered.

## Conceptual Model

| Dimension | This feature |
|-----------|--------------|
| **WHO** | Authenticated player (the hub redirects to login); element/archetype via `NationProvider` (covenant Step 3) |
| **WHAT** | Eight curriculum **spokes** (Answer the Call → Design the Game) as choosable CYOA doorways |
| **WHERE** | `/mastering-allyship/hub` (MTGOA sub-hub of Bruised Banana spoke 7) |
| **Personal throughput** | Each spoke maps toward the four moves (Wake/Clean/Grow/Show) per the generated-spoke pipeline |

## API Contracts

No new persistence or server actions expected (the hub already loads spokes via
`loadAllMtgoaSpokes` / `loadMtgoaInstanceMeta`). **If** the intake adds per-player progress
or unlock state to spoke entries, define that read action here before UI. Pure UI/CSS
redesign otherwise — **no API surface**.

## Functional Requirements

### Phase 0: Intake (gate)
- **FR0**: Produce `design-intake.md` answering §Phase 0 A–D with the host; no production CSS before it.

### Phase 1: Token & material foundation
- **FR1**: Add any agreed textures/bevel tokens to `card-tokens.ts` + `cultivation-cards.css` (no component-local values).
- **FR2**: Establish the surface (warm near-black `#1a1a18`/`#0a0908`, **not pure black**) + the chosen material treatment.

### Phase 2: The hub redesign
- **FR3**: Rebuild `/mastering-allyship/hub` with the chosen object metaphor — spokes as tactile, skeuomorphic CYOA doorways (top-edge highlight present on every surface).
- **FR4**: CYOA affordance per spoke (Begin/Continue, chapter/stage, progress, lock state) in the thumb zone.
- **FR5**: All eight covenant interaction states on interactive surfaces; entry/idle motion guarded by `prefers-reduced-motion`.

### Phase 3: Accessibility + covenant check
- **FR6**: WCAG AA contrast, 44px targets, `aria-label`s; pass the covenant §Step 5 checklist.

## Non-Functional Requirements
- No AI calls (deterministic UI). Brand palette unchanged. Backward-compatible routes.
- The redesign must not regress the spoke-loading data path.

## Verification Quest (required — UX feature)
- **ID**: `cert-mtgoa-menu-redesign-v1`
- **Steps** (Twine passages; final no link → mints reward):
  1. Open `/mastering-allyship/hub` — notice it reads as a real object (book/board/deck), not flat dark cards.
  2. Identify a spoke's chapter/stage + progress at a glance.
  3. Choose a spoke (Begin/Continue) and confirm it routes to the spoke page.
  4. Toggle reduced-motion (or note the guard) — confirm motion respects it.
- **Fundraiser frame**: "Confirm the launch menu feels like a real book before the party, so guests meet *Mastering the Game of Allyship* as an object, not an app."
- Structure: TwineStory + CustomBar, `isSystem: true`, `visibility: 'public'`, idempotent seed `seed:cert:mtgoa-menu-redesign`. Reference: `.specify/specs/cyoa-certification-quests/`.

## Dependencies
- **`UI_COVENANT.md`** (governing law), `src/lib/ui/card-tokens.ts`, `src/styles/cultivation-cards.css`, `src/components/ui/CultivationCard.tsx`
- Handbook skeuomorphism reference: `src/components/handbook/HandbookReader.tsx`
- CYOA spoke pipeline: `generated-spoke-cyoa-pipeline` (1.72 GSCP), `campaign-hub-spatial-map` (1.61 HSM)
- `mtgoa-launch-barn-raising-party` (parent epic — the launch this menu fronts)

## References
- Page under redesign: `src/app/mastering-allyship/hub/page.tsx`
- Asset Register Design System (1.37 ARDS) — semantic registers / textures
- Prisma workflow (only if intake adds progress state): [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md)
