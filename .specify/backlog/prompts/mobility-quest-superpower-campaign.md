# Spec Kit Prompt: Mobility Quest — Superpower Polarity Campaign

## Role
You are a Spec Kit agent responsible for shipping the Mobility Quest campaign as
an interactive route fronted by a superpower-discovery CYOA and backed by tiered,
scoped skill/time donation toward milestones.

## Objective
Let a person **discover** their superpower + orientation (internal/external) via a
CYOA, then **apply** it as well-scoped, needle-moving help toward Mobility Quest
milestones. The organizing primitive is: **Card × Superpower × Orientation =
Personalized Quest**, where a personalized quest is also the unit of scoped
contribution. Reconcile the two prior superpower specs by composing both axes:
domain emphasis (WHERE) + orientation (HOW = inner/outer aspect).

## Prompt (API-First)
> Implement per
> [.specify/specs/mobility-quest-superpower-campaign/spec.md](../../specs/mobility-quest-superpower-campaign/spec.md).
> **API-first**: land the deterministic translation lib
> (`translateCardForSuperpower`, `orientationToMoveAspect`), the `buildDeckSeed`
> `{ superpower, orientation }` extension, and the server-action signatures
> (`submitSuperpowerIntake`, `listMilestoneNeedsForPlayer`, `claimMilestoneNeed`,
> `completeMilestoneNeed`) before any UI. **Deterministic over AI** — the 6×2
> matrix and CYOA routing weights are authored data.

## Requirements
- **Surfaces**: Mobility Quest campaign hub section; `/campaign/[ref]/superpower`
  intake + reveal (`ComposerStepRenderer`); `TranslatedCard` + `MilestoneNeeds`
  components (UI_COVENANT, `CultivationCard`, tokens only).
- **Mechanics**: ECI `superpowerWeights` → `SuperpowerRoutingResult`; translation
  matrix; tiered needs (Tier 1 superpower-matched → Tier 2 open `GameboardAidOffer`).
- **Persistence**: Phase 4 only — additive `LatentAllyshipIntake.superpower(+Orientation)`,
  optional `Player.superpower(+Orientation)`, `MilestoneNeed` (or `needsJson`).
- **API**: Server Actions (`{ success, error, data }`); pure translation lib; no
  Route Handler.
- **Verification**: `cert-mobility-superpower-v1` (Twine + idempotent seed),
  fundraiser-framed (MtGoA Launch + Barn Raising).

## Checklist (API-First Order)
- [ ] Translation lib + tests (12 cells)
- [ ] `buildDeckSeed` opts + provenance
- [ ] ECI routing extension + tests
- [ ] Server actions implemented
- [ ] UI wired to actions (reveal + needs)
- [ ] Phase 4: schema additive migration committed; `npm run db:sync`; record hash
- [ ] Verification quest seeded
- [ ] `npm run build` && `npm run check` green

## Deliverables
- [x] .specify/specs/mobility-quest-superpower-campaign/spec.md
- [x] .specify/specs/mobility-quest-superpower-campaign/plan.md
- [x] .specify/specs/mobility-quest-superpower-campaign/tasks.md
- [x] .specify/backlog/prompts/mobility-quest-superpower-campaign.md
