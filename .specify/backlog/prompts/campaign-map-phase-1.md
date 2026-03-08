# Prompt: Campaign Map — Phase 1 (Opening Momentum)

**Use this prompt when implementing the Campaign Map layer for the Bruised Banana Residency.**

## Context

The Campaign Map provides situational awareness: where players are in the campaign, where activity is happening, and where they can contribute. This spec extends the existing gameboard at `/campaign/board` with three layers: (1) Campaign Phase Header, (2) Domain Regions, (3) Field Activity Indicators. The current gameboard is the MVP of Layer 1.

## Prompt text

> Implement the Campaign Map Phase 1 spec per [.specify/specs/campaign-map-phase-1/spec.md](../specs/campaign-map-phase-1/spec.md). Extend the gameboard at `/campaign/board` with: Layer 1 — Campaign Phase Header (campaign name, Phase: Opening Momentum, phase description); Layer 2 — Domain Regions (four regions: Gather Resources, Skillful Organizing, Raise Awareness, Direct Action; quest count, active players; click to view quests); Layer 3 — Field Activity Indicators (BARs, completions, active players). Create `src/lib/campaign-map.ts` with getCampaignPhaseHeader, getDomainRegionCounts, getFieldActivityIndicators. Add post-onboarding redirect option to Campaign Map. Add cert-campaign-map-phase-1-v1 verification quest. Run `npm run build` and `npm run check`.

## Checklist

- [ ] Layer 1: Campaign Phase Header
- [ ] Layer 2: Domain Regions (counts + click to view quests)
- [ ] Layer 3: Field Activity Indicators
- [ ] Post-onboarding redirect option
- [ ] Verification quest cert-campaign-map-phase-1-v1
- [ ] npm run build and check

## Reference

- Spec: [.specify/specs/campaign-map-phase-1/spec.md](../specs/campaign-map-phase-1/spec.md)
- Plan: [.specify/specs/campaign-map-phase-1/plan.md](../specs/campaign-map-phase-1/plan.md)
- Tasks: [.specify/specs/campaign-map-phase-1/tasks.md](../specs/campaign-map-phase-1/tasks.md)
- Gameboard: [.specify/specs/gameboard-campaign-deck/spec.md](../specs/gameboard-campaign-deck/spec.md)
