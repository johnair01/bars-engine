# Tasks: Avatar Sprite Quality Process

## Phase 1: Style Guide

- [x] Create STYLE_GUIDE.md: aesthetic target, palette, dimensions, registration
- [x] Decide: 64×64 vs 32×32 (document rationale)
- [x] Add mood board links (Gathertown, Stardew, LPC references)
- [x] Define color palette (8–16 colors, hex)

## Phase 2: Base Layer

- [x] Source or create base/default.png per style guide
- [x] Source or create base/male.png, base/female.png, base/neutral.png
- [x] Canonical base process: derive variants from canonical.png (zero deviation)
- [x] Script: npm run sprites:derive-base (--init-from-default to bootstrap)
- [ ] Review gate: "Belongs in Construct Conclave?" (manual verification)

## Phase 3: Nation Layer

- [x] nation_body + nation_accent for argyra
- [x] nation_body + nation_accent for pyrakanth
- [x] nation_body + nation_accent for virelune
- [x] nation_body + nation_accent for meridia
- [x] nation_body + nation_accent for lamenth
- [x] Test stacking with base (placeholders; verify at /admin/avatars)

## Phase 4: Playbook Layer

- [ ] playbook_outfit + playbook_accent for each of 8 playbooks
- [ ] Test nation × playbook combinations

## Phase 5: Integration

- [ ] Combo testing (5 × 8 = 40 combos)
- [ ] Update docs/SPRITE_ASSETS.md with style guide
- [ ] Add Sprite Quality Checklist for contributors
