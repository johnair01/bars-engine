# Plan: MtGoA Menu — Skeuomorphic CYOA Redesign

> Implement per [.specify/specs/mtgoa-menu-skeuomorphic-cyoa/spec.md](./spec.md).
> **Intake-first**: do not write production CSS before `design-intake.md` is answered with
> the host. **Read `UI_COVENANT.md` at session start** (covenant Step 0).

## Architecture strategy

This is a **materiality** redesign, not a re-platforming. The data path
(`loadAllMtgoaSpokes` / `loadMtgoaInstanceMeta`) stays; we change how spokes *feel*. Anchor
everything to the existing design system (`card-tokens.ts`, `cultivation-cards.css`,
`CultivationCard`) — extend tokens, never invent component-local palettes.

## File impacts (provisional — finalized after intake)

| File | Change |
|------|--------|
| `.specify/specs/mtgoa-menu-skeuomorphic-cyoa/design-intake.md` (new) | The answered Phase-0 brief + token map |
| `src/lib/ui/card-tokens.ts` | Add agreed texture/bevel tokens (if any) |
| `src/styles/cultivation-cards.css` | Skeuomorphic classes (paper/wood/cloth, bevel, top-edge highlight, page-curl) |
| `src/app/mastering-allyship/hub/page.tsx` | Rebuild around the chosen object metaphor + CYOA affordances |
| `src/app/mastering-allyship/spoke/[index]/page.tsx` | (If in scope) match treatment |
| `scripts/seed-cert-mtgoa-menu-redesign.ts` (new) | Verification quest seed |

## Sequencing

1. **Read covenant + handbook** — `UI_COVENANT.md`, `card-tokens.ts`, `cultivation-cards.css`, `CultivationCard.tsx`, `HandbookReader.tsx`.
2. **Run the intake (FR0)** — answer §Phase 0 A–D with the host → `design-intake.md` + token map. **Gate.**
3. **Token/material foundation (FR1–FR2)** — add textures/bevels to token files + CSS.
4. **Hub rebuild (FR3–FR5)** — object metaphor, CYOA doorways, eight interaction states, motion guards.
5. **Accessibility + covenant check (FR6)** — Step 5 checklist (contrast, 44px, aria, no arbitrary values, reduced-motion).
6. **Verification quest** — Twine passages + idempotent seed.
7. **Fail-fix** — `npm run build`, `npm run check`.

## Risks
- **Skeuomorphism vs. accessibility**: texture/bevels can hurt contrast — every choice must still pass AA (covenant Law 11). Fix contrast on the **foreground** token, never by lightening the `#0a0908` base (Law 13).
- **Token sprawl**: resist component-local hex/texture; all new material lives in the token files (Law 14).
- **Scope creep**: confirm in intake whether the spoke page + reusable menu pattern are in scope, or just the hub.
