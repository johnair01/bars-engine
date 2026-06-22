# Prompt: Throughput Spine — Go-Live (1.82 TSG)

Implement per the spec kit:

- **Spec:** [.specify/specs/throughput-spine-go-live/spec.md](../../specs/throughput-spine-go-live/spec.md)
- **Plan:** [plan.md](../../specs/throughput-spine-go-live/plan.md)
- **Tasks:** [tasks.md](../../specs/throughput-spine-go-live/tasks.md) — Phase 0 first.

## Objective

Make the personal→collective throughput spine **walkable end-to-end** for go-live: capture → seed
(quest/daemon/artifact) → tend (Vault) → **attach to a campaign** → advance a **well-crafted
milestone**. A consolidating epic — it sequences existing specs and closes two missing links.

## Agent instructions

1. **Phase 0** — write `journey-map.md` (states/transitions/surfaces + gap ledger) and decide the
   schema-reuse question (prefer `campaignRef` + `CampaignMilestone` + `ContributionAnnotation`; no
   new fields unless proven necessary).
2. **Close the links first:** Phase 2 (`attachBarToCampaign` + "Offer to a campaign" affordance +
   hub surfacing) and Phase 3 (milestone authoring + celebration). These are small actions over
   existing models and are the only places the spine has no path today.
3. **Phase 1** seed coherence on `GrowFromBar` (copy + routing; MVP artifact set = Quest, Daemon,
   generic Artifact).
4. **Phases 4–5** — drive `now-event-vault-throughput-qol` and `home-vault-ia-redesign` (+ BRS,
   `vault-page-experience`) to acceptance; do **not** re-spec them.
5. `npm run check` per phase; implement Verification Quest `cert-throughput-spine-v1` — completing it
   IS the go-live signal.
6. Update `1.82 TSG` in `BACKLOG.md`; `npm run backlog:seed`.

## Decisions (2026-06-16)

- Consolidating epic: sequence + connect, don't duplicate the redesign specs.
- Build on existing models; minimal schema churn.
- Two missing links (explicit attach, milestone authoring) are the true go-live blockers; the Now +
  Vault redesigns are the ergonomic frames (delegated to their specs).
