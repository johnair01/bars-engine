# Prompt: 2-Minute Ride — Story Bridge + UX Expansion

**Use this prompt when implementing the 2-Minute Ride spec. Extends [lore-cyoa-onboarding](lore-cyoa-onboarding.md) (AG). Merges Campaign BB flow fix (Instance.campaignRef).**

## Context

Bridge the game world (Heist, Conclave, vibeulons) to the real world (Bruised Banana Residency, fundraiser, party). The 2-minute ride is invite → event → CYOA → sign-up → dashboard. Target: coherent journey, reduced abandonment, surfaced vibeulon payoff.

## Prompt text

> Implement the 2-Minute Ride per [.specify/specs/two-minute-ride-story-bridge/spec.md](../specs/two-minute-ride-story-bridge/spec.md). Add Instance.campaignRef; campaign page uses it when ref missing. Add story bridge copy (admin-editable); BB nodes render it. Add progress indicator, vibeulon payoff preview, optional donate link. Add error recovery (retry + Continue later). Add cert-two-minute-ride-v1 verification quest. See ANALYSIS.md for Teal-level backlog merge rationale.

## Surfaces

- Campaign page
- EventCampaignEditor
- CampaignReader
- BB nodes (adventures API)

## Checklist

- [ ] Schema: Instance.campaignRef
- [ ] Campaign page: use instance.campaignRef when ref absent
- [ ] Story bridge copy: editable, rendered in BB_Intro/BB_ShowUp
- [ ] Progress indicator in CYOA
- [ ] Vibeulon payoff preview in BB_Moves_ShowUp
- [ ] Donation soft-link in BB_ShowUp
- [ ] Error recovery in CampaignReader
- [ ] cert-two-minute-ride-v1 verification quest
- [ ] Backlog: add AH, mark T superseded

## Reference

- Spec: [.specify/specs/two-minute-ride-story-bridge/spec.md](../specs/two-minute-ride-story-bridge/spec.md)
- Analysis: [.specify/specs/two-minute-ride-story-bridge/ANALYSIS.md](../specs/two-minute-ride-story-bridge/ANALYSIS.md)
- Tasks: [.specify/specs/two-minute-ride-story-bridge/tasks.md](../specs/two-minute-ride-story-bridge/tasks.md)
- Related: [lore-cyoa-onboarding](lore-cyoa-onboarding.md), [bruised-banana-onboarding-flow](../specs/bruised-banana-onboarding-flow/spec.md)
