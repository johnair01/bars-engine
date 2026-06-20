# Tasks: Mobility Quest — Superpower Polarity Campaign

> Implement per [spec.md](./spec.md) and [plan.md](./plan.md). **API-first**:
> lib + action signatures before UI. Gate every phase with `npm run build` &&
> `npm run check`. Check items off as completed.

## Phase 1 — Ontology + deterministic translation library (no I/O, no migration)

- [ ] **T1.1** `src/lib/superpowers/types.ts` — `Superpower`,
      `SuperpowerOrientation`, `SuperpowerTranslation`, `SuperpowerDef`; document
      `internal→inner` / `external→outer`. (FR1)
- [ ] **T1.2** `src/lib/superpowers/matrix.ts` — authored **7×2** matrix (prompt +
      suggestedArtifact per superpower×orientation) + per-superpower `domains`,
      element/emotion, overuse/avoidance shadow, and pairings — **derived from the
      six Strategy Guides**; Coach authored from the addendum (flag: no Drive
      guide). Reconcile with `superpower-move-extensions`. (FR2)
- [x] **T1.2a** Author a **Coach Strategy Guide** matching the other six — DONE:
      [coach-strategy-guide.md](../superpower-quiz-design/coach-strategy-guide.md)
      (Strategist's POV; Fire Frustration→Triumph; Taskmaster/Empty-Cheerleader
      shadows; integrator of the six; pairings + signs).
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
- [ ] **T2.3** Build the discovery CYOA from the **Allyship Superpower Quiz**:
      since the Drive quiz file is empty, construct items from each Strategy Guide's
      "Signs Someone Needs an X" + overuse/avoidance shadows + element/emotion
      (Coach from the addendum); hidden `superpowerWeights` per choice; **re-author
      copy in Wendell's narrative voice** (Borogove heist register), preserving a
      coherent branch structure. (FR5; Resolved Qs: quiz basis + voice)
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
      `claimMilestoneNeed`, `completeMilestoneNeed`. Needs include
      `unit ∈ {action|currency|hours}` (default `action`/`1`); returned so UI can
      group. **No multiplier field.** (FR9; Six Faces Δ T3.2)
- [ ] **T3.3** On completion, route the contribution to the correct **unit
      bucket**: write `MilestoneContribution` + `ContributionRecord` and advance
      the milestone's per-unit total via the existing path
      (`campaign-contributions.ts`); money needs reuse the **DSW / barn-raising
      `wallKey`** money path, not a new ledger. (FR10; Six Faces Δ T3.3)
- [ ] **T3.4** `src/components/superpowers/MilestoneNeeds.tsx` — matched needs +
      open-aid fallback; **group by unit into separate sub-bars**; **never** show a
      per-action point value to the contributor (UI_COVENANT). Wire into Mobility
      Quest hub section. (FR8, FR11a; Six Faces Δ T3.4)
- [ ] **T3.5** Steward seed/UI to author milestone needs
      (`{ superpower, orientation, cardId, unit, value }`) for Mobility Quest;
      steward picks unit to match the milestone target, cannot weight one action
      over another. (FR11)
- [ ] **T3.5a** Persist the **per-campaign** superpower result on
      `CampaignMembership` (Phase 3: ride existing storage; Phase 4: typed
      columns) — not on global `Player`. (Resolved Q: per-campaign)
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
      **per-campaign** result on `CampaignMembership.superpower String?` +
      `.superpowerOrientation String?` (not global `Player`);
      `MilestoneNeed` model (or `CampaignMilestone.needsJson`) with
      `unit String @default("action")`, `value Float @default(1)`, **no
      multiplier field** (Six Faces Δ T4.2). (FR12)
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

## Cross-cutting acceptance (addendum + Six Faces)
- [ ] Cards translate by superpower and orientation.
- [ ] Internal cards generate self-allyship prompts; external cards generate
      world-facing prompts.
- [ ] Users can toggle orientation when card metadata does not specify it.
- [ ] Existing `allyship-deck.json` remains source of truth.
- [ ] Superpowers act as translation layers, not new card systems.
- [ ] **No player-facing surface displays a per-action point value; milestones
      aggregate per unit (honest sub-bars, never blended).** (Six Faces)
- [ ] **Internal-orientation contributions are tracked separately from external
      money/hours totals** (protects the polarity). (Six Faces)
- [ ] Superpower result is stored **per campaign**, not globally.
