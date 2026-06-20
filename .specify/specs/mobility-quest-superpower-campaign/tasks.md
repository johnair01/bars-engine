# Tasks: Mobility Quest — Superpower Polarity Campaign

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). **API-first**:
> lib + action signatures before UI. Gate every phase with `npm run build` &&
> `npm run check`. Check items off as completed.

## Phase 1 — Ontology + deterministic translation library (no I/O, no migration)

- [ ] **T1.1** `src/lib/superpowers/types.ts` — `Superpower`,
      `SuperpowerOrientation`, `SuperpowerTranslation`, `SuperpowerDef`; document
      `internal→inner` / `external→outer`. (FR1)
- [ ] **T1.2** `src/lib/superpowers/matrix.ts` — authored 6×2 matrix (prompt +
      suggestedArtifact per superpower×orientation) + `domains` per superpower,
      reconciled with `superpower-move-extensions`. (FR2)
- [ ] **T1.3** `src/lib/superpowers/translate.ts` — `translateCardForSuperpower`,
      `orientationToMoveAspect`. (FR3)
- [ ] **T1.4** Extend `buildDeckSeed` in `src/lib/allyship-deck/seed.ts` with
      optional `{ superpower, orientation }`; thread into provenance;
      backward-compatible. (FR4)
- [ ] **T1.5** Unit tests: all 12 translation cells assert internal⇒self-prompt /
      external⇒world-prompt + correct artifact; `orientationToMoveAspect`;
      `buildDeckSeed` provenance with/without opts.
- [ ] **T1.6** Update cross-refs in `inner-outer-allyship-moves` and
      `superpower-move-extensions` specs to point at this merge spec.
- [ ] **T1.7** Gate: `npm run check` green.

## Phase 2 — Superpower CYOA intake (reuse ECI)

- [ ] **T2.1** Extend `src/lib/cyoa-intake/intakeSurface.ts` choice types with
      optional `superpowerWeights`. (FR5)
- [ ] **T2.2** Extend `src/lib/cyoa-intake/resolveRouting.ts` to accumulate
      `superpowerWeights` and resolve `SuperpowerRoutingResult` (top superpower +
      orientation), preserving existing routing fields. (FR5)
- [ ] **T2.3** Port the Borogove CYOA into intake passages with per-choice hidden
      `superpowerWeights` (re-author to ECI shape; preserve choice structure). (FR5)
- [ ] **T2.4** `src/actions/superpower-intake.ts` — `submitSuperpointIntake`
      (`submitSuperpowerIntake`) server action; persists result on existing
      `LatentAllyshipIntake` (anon-capable via session). (FR6)
- [ ] **T2.5** Routing unit tests with deterministic path fixtures.
- [ ] **T2.6** Reveal UI: `src/app/campaign/[ref]/superpower/page.tsx` (RSC) +
      client using `ComposerStepRenderer`; `src/components/superpowers/TranslatedCard.tsx`
      via `CultivationCard` — Superpower · Orientation · base card · translation ·
      suggested artifact (UI_COVENANT; tokens only). (FR7)
- [ ] **T2.7** Orientation toggle ("Where is this card asking you to ally?"):
      honor card metadata when present, else allow toggle (addendum AC). (FR7, P2)
- [ ] **T2.8** Gate: `npm run build` && `npm run check`.

## Phase 3 — Campaign route + tiered milestone needs

- [ ] **T3.1** Seed/author the **Mobility Quest** `Campaign` (slug, allyshipDomain,
      wake-up/show-up copy) + its `CampaignMilestone`s if not present. (FR8)
- [ ] **T3.2** `src/actions/milestone-needs.ts` — `listMilestoneNeedsForPlayer`
      (Tier 1 superpower-matched first; Tier 2 open `GameboardAidOffer` fallback),
      `claimMilestoneNeed`, `completeMilestoneNeed`. (FR9)
- [ ] **T3.3** On completion, write `MilestoneContribution` + `ContributionRecord`
      and advance milestone `currentValue` via existing contribution path
      (`campaign-contributions.ts`). (FR10)
- [ ] **T3.4** `src/components/superpowers/MilestoneNeeds.tsx` — matched needs +
      open-aid fallback (UI_COVENANT). Wire into Mobility Quest hub section. (FR8)
- [ ] **T3.5** Steward seed/UI to author milestone needs
      (`{ superpower, orientation, cardId, value }`) for Mobility Quest. (FR11)
- [ ] **T3.6** Integration test: matched player sees Tier-1 needs; completing one
      advances the milestone; unmatched capacity falls back to Tier 2.
- [ ] **T3.7** Gate: `npm run build` && `npm run check`.

## Phase 4 — Persistence hardening + Verification Quest

> **Prisma discipline** — read
> [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).
> No `db push` for changes that merge to main.

- [ ] **T4.1** Decide model-vs-JSON for needs + result home (Open Q #1/#2).
- [ ] **T4.2** Edit `prisma/schema.prisma` — additive:
      `LatentAllyshipIntake.superpower String?` + `.superpowerOrientation String?`;
      optional `Player.superpower String?` + `.superpowerOrientation String?`;
      `MilestoneNeed` model (or `CampaignMilestone.needsJson`). (FR12)
- [ ] **T4.3** `npx prisma migrate dev --name add_superpower_fields`; **commit**
      `prisma/migrations/…` together with `schema.prisma`. (FR12)
- [ ] **T4.4** `npm run db:sync` (regenerate client); then
      `npm run db:record-schema-hash` per CLAUDE.md. (FR12)
- [ ] **T4.5** Human-glance the generated `migration.sql` (additive, not destructive).
- [ ] **T4.6** Migrate Phase-3 ad-hoc storage onto the new columns/model.
- [ ] **T4.7** Verification Quest: `scripts/seed-cert-mobility-superpower.ts`
      (Twine + `CustomBar` `cert-mobility-superpower-v1`, `isSystem: true`,
      `visibility: 'public'`, idempotent), fundraiser-framed; add
      `seed:cert:mobility-superpower` npm script. (FR13)
- [ ] **T4.8** Gate: `npm run build` && `npm run check`; run the verification quest
      end-to-end (the 6 reveal→claim→complete steps).

## Backlog sync
- [ ] **T5.1** Add this spec to `.specify/backlog/BACKLOG.md`; run
      `npm run backlog:seed`.

## Cross-cutting acceptance (addendum)
- [ ] Cards translate by superpower and orientation.
- [ ] Internal cards generate self-allyship prompts; external cards generate
      world-facing prompts.
- [ ] Users can toggle orientation when card metadata does not specify it.
- [ ] Existing `allyship-deck.json` remains source of truth.
- [ ] Superpowers act as translation layers, not new card systems.
