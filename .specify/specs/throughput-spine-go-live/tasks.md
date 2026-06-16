# Tasks: Throughput Spine — Go-Live

Implements [spec.md](./spec.md) per [plan.md](./plan.md). Order: journey map → close links → seed →
frames. Each phase is independently shippable.

## Phase 0 — Journey contract (do first) ✅ DONE
- [x] **T0.1** — `journey-map.md` written: spine states/transitions/surfaces + gap ledger. **Finding:**
  the spine breaks at exactly **two points — T4 (attach-to-campaign) and T6 (milestone authoring)**;
  everything else works or is frame-polish owned by an existing spec.
- [x] **T0.2** — Schema decision recorded: **NO new fields required for v1.** Attach reuses
  `CustomBar.campaignRef` + `ContributionAnnotation`; milestone authoring reuses `CampaignMilestone`
  (+ `CampaignMilestoneMarker` for the celebration/reach narrative). **Phases 1–3 need no migration.**
  Two optional future fields (`ContributionAnnotation.source`, `CampaignMilestone.celebration`) deferred.

## Phase 1 — Seed coherence (`GrowFromBar`)
- [ ] **T1.1** — Lock MVP artifact set (Quest, Daemon, generic Artifact); add a roadmap note for the
  deferred Show-Up artifact types (Story/Ritual/Plan/Gift/Deck Card/Contact).
- [ ] **T1.2** — Reframe `GrowFromBar` as one "Show Up / seed this" affordance; clear copy + correct
  post-seed routing (via `navigation-contract`). `npm run check`.

## Phase 2 — Explicit personal→collective bridge ← highest-value link
- [ ] **T2.1** — `src/actions/campaign-attach.ts`: `attachBarToCampaign`, `detachBarFromCampaign`,
  `listAttachableCampaigns` (write `campaignRef` + a contribution intent; idempotent).
- [ ] **T2.2** — "Offer to a campaign" affordance on BAR + quest detail and in the Vault.
- [ ] **T2.3** — Campaign hub surfaces the player-declared contribution (reuse contribution rollup).
- [ ] **T2.4** — Unit tests for the action; `npm run check`.

## Phase 3 — Milestone authoring
- [ ] **T3.1** — `src/actions/campaign-milestone-authoring.ts`: `proposeMilestone`,
  `updateMilestoneCraft`, `approveMilestone` (steward+).
- [ ] **T3.2** — Milestone craft UI (narrative "why it matters" + target + celebration copy).
- [ ] **T3.3** — Celebration on reach (narrative beat + reward), extending BBMT.
- [ ] **T3.4** — `npm run check`.

## Phase 4 — Now page rewrite (delegate)
- [ ] **T4.1** — Drive `now-event-vault-throughput-qol` to acceptance: high-contrast compass, ONE
  primary next-move CTA, visible charge→quest provenance, events discoverability.

## Phase 5 — Vault redesign (delegate)
- [ ] **T5.1** — Implement `home-vault-ia-redesign` core (Hand/Vault legibility + naming).
- [ ] **T5.2** — BRS **tend** action (incremental develop a seed; route-to-guide).
- [ ] **T5.3** — Finish `vault-page-experience` caps/compost; CYOA hard-compost modal = v2.

## Verification Quest (the walkability gate)
- [ ] **T6.1** — Twine `cert-throughput-spine-v1` (7 steps per spec § Verification Quest); final
  passage no-link.
- [ ] **T6.2** — `scripts/seed-cert-throughput-spine.ts` + `npm run seed:cert:throughput-spine`
  (idempotent; `isSystem`/public; Bruised Banana frame).
- [ ] **T6.3** — Run end-to-end in preview — this completing **is** the go-live readiness signal.

## Definition of done (go-live readiness)
- [ ] Phases 0–3 shipped (links closed, seed coherent); Phases 4–5 at their specs' acceptance.
- [ ] `cert-throughput-spine-v1` completable end-to-end.
- [ ] `npm run check` green; any migration committed with schema.
- [ ] BACKLOG `1.82 TSG` updated; `npm run backlog:seed`.
