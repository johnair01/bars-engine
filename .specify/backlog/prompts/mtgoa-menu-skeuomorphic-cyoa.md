# Spec Kit Prompt: MtGoA Menu — Skeuomorphic CYOA Redesign

## Role
You are a Spec Kit + UI agent redesigning the Mastering the Game of Allyship menu/hub.

## Objective
Turn `/mastering-allyship/hub` from flat black-on-black-with-accents (reads "AI-generated")
into a **skeuomorphic, CYOA-forward** experience where the 8 spokes feel like real objects —
like the handbook page pretends to be a book. Brand colors stay; materiality changes.
**Intake-first.**

## Prompt
> Implement per [.specify/specs/mtgoa-menu-skeuomorphic-cyoa/spec.md](../../specs/mtgoa-menu-skeuomorphic-cyoa/spec.md).
> **Read `UI_COVENANT.md` first.** Phase 0 is a **design intake** with the host (object
> metaphor, material, light/depth, CYOA reading, token scope) → `design-intake.md`. No
> production CSS before the intake. Then extend `card-tokens.ts` + `cultivation-cards.css`
> (no component-local palettes), rebuild the hub as tactile CYOA doorways, pass the covenant
> Step-5 checklist. Verification quest `cert-mtgoa-menu-redesign-v1`.

## Requirements
- **Surfaces**: `/mastering-allyship/hub` (+ spoke page if intake says so)
- **Mechanics**: skeuomorphic materiality (top-edge highlight, bevel, paper/wood/cloth), CYOA Begin/Continue
- **Persistence**: none expected (UI/CSS); add a progress read action only if intake requires
- **Verification**: `cert-mtgoa-menu-redesign-v1` — hub reads as a real object; spoke choosable; motion respects reduced-motion

## Deliverables
- [x] spec.md / plan.md / tasks.md under `.specify/specs/mtgoa-menu-skeuomorphic-cyoa/`
- [ ] `design-intake.md` (answered Phase-0 brief + token map)
- [ ] `npm run build` + `npm run check` pass; covenant Step-5 checklist green
