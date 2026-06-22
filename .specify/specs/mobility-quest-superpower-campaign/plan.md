# Plan: Mobility Quest — Superpower Polarity Campaign

> Implement per [spec.md](./spec.md). **API-first**: deterministic translation lib
> and server-action signatures land before any UI. **Deterministic over AI**:
> the superpower×orientation matrix and the CYOA routing weights are authored
> data. Reuse over rebuild: extend ECI, `buildDeckSeed`, and the milestone /
> contribution models rather than forking them.

## Architectural strategy

The feature is **four thin layers stacked on existing infrastructure**. Each
phase is independently shippable and leaves the app green (`npm run build` +
`npm run check`).

```
Layer 1  pure lib      superpowers/{types,matrix,translate} + buildDeckSeed opts
Layer 2  intake        ECI superpowerWeights → SuperpowerRoutingResult → reveal UI
Layer 3  campaign      Mobility Quest hub + tiered milestone needs (actions + UI)
Layer 4  persistence   additive Prisma fields + Verification Quest
```

### Why this order
- Layer 1 has **no I/O** and is fully unit-testable — it de-risks the addendum's
  acceptance criteria (translation correctness) before any wiring.
- Layer 2 reuses the proven ECI weighting pattern; only the vocabulary grows.
- Layer 3 reuses `CampaignMilestone`/`MilestoneContribution`/`ContributionRecord`
  and `GameboardAidOffer`; the new surface is matching + a needs list.
- Layer 4 promotes ad-hoc result storage (JSON/`pathJson`) into typed columns
  once the shape is proven, under full migration discipline.

## The reconciliation (key design move)

Two prior specs key superpowers differently. We **merge** them:

```ts
interface SuperpowerDef {
  key: Superpower
  domains: AllyshipDomain[]   // from superpower-move-extensions (WHERE it works)
  // orientation is NOT stored on the def — it is per-enactment (inner/outer)
}
```

`domains` selects which **card pool** a superpower draws from; `orientation`
(per enactment) selects the **inner/outer reading** of a chosen card. They never
collide because they answer different questions (WHERE vs HOW).

## Critical files

| Concern | File | Change |
|--------|------|--------|
| Types | `src/lib/superpowers/types.ts` | **new** — `Superpower`, `SuperpowerOrientation`, `SuperpowerTranslation`, `SuperpowerDef` |
| Matrix | `src/lib/superpowers/matrix.ts` | **new** — authored 6×2 prompts + artifacts + domain emphasis |
| Translate | `src/lib/superpowers/translate.ts` | **new** — `translateCardForSuperpower`, `orientationToMoveAspect` |
| Move generator | `src/lib/allyship-deck/seed.ts` | **extend** — optional `{ superpower, orientation }` → provenance |
| Move aspect bridge | `src/lib/quest-grammar/move-aspect.ts` | **reuse** — `MoveAspect`, `describeMove` (no change) |
| ECI routing | `src/lib/cyoa-intake/resolveRouting.ts` | **extend** — `superpowerWeights` → `SuperpowerRoutingResult` |
| Intake surface | `src/lib/cyoa-intake/intakeSurface.ts` | **extend** — superpower weight types on choices |
| Intake action | `src/actions/superpower-intake.ts` | **new** — `submitSuperpowerIntake` |
| Needs actions | `src/actions/milestone-needs.ts` | **new** — list/claim/complete (Tier 1+2) |
| Contribution path | `src/actions/campaign-contributions.ts` | **reuse** — record contribution on completion |
| Reveal UI | `src/app/campaign/[ref]/superpower/page.tsx` (+ client) | **new** — RSC + `ComposerStepRenderer` |
| Card display | `src/components/superpowers/TranslatedCard.tsx` | **new** — `CultivationCard`-based (UI_COVENANT) |
| Needs UI | `src/components/superpowers/MilestoneNeeds.tsx` | **new** — matched needs + open-aid fallback |
| Schema | `prisma/schema.prisma` | **Phase 4** — additive fields / `MilestoneNeed` |
| Verification | `scripts/seed-cert-mobility-superpower.ts` | **new** — Twine + CustomBar seed |

## API contract (locked before UI)

See [spec.md § API Contracts](./spec.md#api-contracts-api-first). Server Actions
return `{ success, error, data }`; the translation lib is pure (no I/O). No Route
Handler — there is no external/webhook consumer.

## Data model approach (Phase 3 → 4)

- **Phase 3** (no migration): milestone needs authored via a seed script and held
  in `CampaignMilestone` JSON (or a small in-repo config keyed by `campaignRef`);
  the superpower result rides the existing `LatentAllyshipIntake.pathJson`.
- **Phase 4** (migration): promote to typed columns —
  `LatentAllyshipIntake.superpower` / `.superpowerOrientation`, optional
  `Player.superpower` / `.superpowerOrientation`, and a first-class
  `MilestoneNeed` model (`milestoneId`, `superpower`, `orientation`, `cardId`,
  `value`, `status`, `claimedByPlayerId`). Decide model-vs-JSON at Phase 4 start
  per Open Question #1/#2.

## UI strategy (UI_COVENANT)

- Reuse `ComposerStepRenderer` for the CYOA (sealed/lock states, progress, prefill).
- Every card-like element is a `CultivationCard` with `element`/`altitude`/`stage`;
  colors only from `card-tokens.ts`; Tailwind for layout only.
- Map superpower → element channel for color (e.g. via existing `MOVE_ELEMENT`
  through the card's move) so the three-channel encoding stays coherent.
- Reveal page: server component fetches campaign + (anon) session, delegates to a
  client reveal that renders Superpower · Orientation · `TranslatedCard` ·
  suggested artifact.

## Dual-track / AI posture

- All Phase 1–3 logic deterministic. Any AI flavor (e.g. softening a translated
  prompt) sits behind `aiEnabled()` and degrades to the authored matrix text.

## Verification

- Unit tests: all 12 translation cells; `orientationToMoveAspect`; `buildDeckSeed`
  provenance; `resolveRouting` superpower accumulation (deterministic fixtures).
- Verification Quest `cert-mobility-superpower-v1` (Twine + idempotent seed),
  fundraiser-framed.
- Gate every phase: `npm run build` && `npm run check`.

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Two superpower specs drift further apart | This spec is the merge point; update both prior specs' cross-refs in Phase 1 docs. |
| Borogove CYOA weighting doesn't map cleanly to ECI | Re-author passages into ECI choice/weight shape (Open Q #4); keep the choice structure. |
| Milestone-need matching feels extractive (community AI allergy) | Frame as self-knowledge + solidarity; Tier-2 open aid keeps it non-coercive; copy review. |
| Premature schema churn | Phases 1–3 ship no migration; promote to columns only once shape is proven (Phase 4). |

## Dependencies
- [`inner-outer-allyship-moves`](../inner-outer-allyship-moves/spec.md),
  [`superpower-move-extensions`](../superpower-move-extensions/spec.md),
  `allyship-deck`, `cyoa-intake`, `donation-self-service-wizard`.
