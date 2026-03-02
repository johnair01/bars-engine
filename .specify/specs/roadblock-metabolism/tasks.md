# Tasks: Roadblock Metabolism System

## Phase 1: Scripts

- [ ] Add `build:type-check` script to package.json (`tsc --noEmit`)
- [ ] Add `validate-manifest` script to package.json (`tsx scripts/validate-manifest.ts`)
- [ ] Create `scripts/validate-manifest.ts` (check "use client" for hooks, etc.)

## Phase 2: Husky

- [ ] Install husky: `npm install -D husky`
- [ ] Run `npx husky init`
- [ ] Create `.husky/pre-commit` that runs `npm run build:type-check` (and optionally `npm run validate-manifest`)

## Phase 3: Agent Skill

- [ ] Create `.agents/skills/roadblock-metabolism/SKILL.md`
- [ ] Include verification rules, reflection step, "Metabolizing a Roadblock" phrasing

## Phase 4: FOUNDATIONS

- [ ] Add "Metabolism of Roadblocks" section to FOUNDATIONS.md

## Verification

- [ ] Introduce a type error, attempt commit — should be rejected
- [ ] Agent skill is discoverable and actionable
