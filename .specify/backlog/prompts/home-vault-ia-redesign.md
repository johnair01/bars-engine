# Spec Kit Prompt: Home / Vault IA Redesign — Capture-First, Pokémon Rules

## Role
You are a Spec Kit agent responsible for redesigning the home (`/`) and Hand/Vault information architecture so capturing and metabolizing ideas is as fast as possible.

## Objective
Make `/` the **active loop** (capture + daily charge + ambient Hand), adopt **Pokémon inventory rules** (capture into a bounded Hand or unbounded Vault; full Hand forces a deposit), point the **daily charge at the Hand** (mint or advance), and route each BAR to a **home that follows its maturity**. Mobile-first.

## Prompt (API-First)
> Implement Home/Vault IA per [.specify/specs/home-vault-ia-redesign/spec.md](../../specs/home-vault-ia-redesign/spec.md). **API-first**: ship `captureBar({ content, title?, destination })`, `getTodayChargeTargets()`, and `applyDailyCharge({ mode })` before the "Now" UI. Reuse the Hand model + `OverflowModal` from `hand-vault-bounded-inventory` (prerequisite). Spec: `.specify/specs/home-vault-ia-redesign/spec.md`.

## Requirements
- **Surfaces**: `src/app/page.tsx` ("Now"), `NowHome`/`CaptureBox`/`DailyChargePanel`/`HandGlance`, cleaned `NavBar`.
- **Mechanics**: capture-now/contextualize-later; destination choice (Vault default); overflow modal on full Hand; daily charge mints or advances a **Hand** BAR (promote from Vault first); maturity→location routing.
- **Persistence**: no new models here — `HandSlot` is a dependency (`hand-vault-bounded-inventory`).
- **API**: `captureBar`, `getTodayChargeTargets`, `applyDailyCharge` (Server Actions).
- **Verification**: `cert-home-vault-ia-v1` certification quest (Bruised Banana framing).

## Checklist (API-First Order)
- [ ] API contracts defined in spec (done) and implemented before UI
- [ ] No Prisma schema change in this kit (HandSlot owned by dependency)
- [ ] Server Actions implemented first, then "Now" UI wired
- [ ] Verification quest seeded (`seed:cert:home-vault-ia`)
- [ ] `npm run build` and `npm run check` — fail-fix

## Deliverables
- [x] .specify/specs/home-vault-ia-redesign/spec.md
- [x] .specify/specs/home-vault-ia-redesign/plan.md
- [x] .specify/specs/home-vault-ia-redesign/tasks.md
- [x] .specify/specs/home-vault-ia-redesign/DESIGN_BRIEF.md

## Dependencies
- `hand-vault-bounded-inventory` (prerequisite: HandSlot + Hand actions + OverflowModal)
- `hand-vault-rename` (route/title/concept alignment before nav edits)
- `bar-seed-metabolization` (maturity phases), `world-portal-save-state`, `narrative-os-map-v0`
