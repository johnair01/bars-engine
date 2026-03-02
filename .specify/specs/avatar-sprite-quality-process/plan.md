# Plan: Avatar Sprite Quality Process

## Overview

Process-first spec. No code changes required. Deliverables: style guide document, development workflow, and decision log for sprite dimensions and sourcing.

## Phases

### Phase 1: Style Guide (Document)

Create `.specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md` with:
- Target aesthetic (Gathertown/Stardew feel + game tone)
- Color palette (8–16 colors; hex values)
- Pixel dimensions (64×64 confirmed or 32×32)
- Registration point (center-bottom for full-body; center for bust)
- Line weight (1px outline vs none)
- Example mood board (links to Gathertown, Stardew, LPC references)

### Phase 2: Base Layer Redesign

- Replace current base/*.png with new assets per style guide
- 4 files: default, male, female, neutral
- Review gate: "Belongs in Construct Conclave?"

### Phase 3: Nation Layer

- Nation body + accent for each of 5 nations
- Align with handbook nation aesthetics
- Test stacking with base

### Phase 4: Playbook Layer

- Playbook outfit + accent for each of 8 playbooks
- Test nation × playbook combos

### Phase 5: Integration

- Combo testing
- Update docs/SPRITE_ASSETS.md
- Sprite Quality Checklist for contributors

## File Impacts

| File | Change |
|------|--------|
| docs/SPRITE_ASSETS.md | Add style guide section, quality checklist |
| public/sprites/parts/* | Replace/add PNG assets |
| .specify/specs/avatar-sprite-quality-process/ | New spec, plan, tasks, style guide |

## Dependencies

- No schema changes
- No API changes
- Admin sprite upload (AX) already supports adding/replacing assets
