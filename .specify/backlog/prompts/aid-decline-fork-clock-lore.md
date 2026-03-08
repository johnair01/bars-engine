# Prompt: AID Decline Fork, Clock, and Lore Update

**Use this prompt when implementing the AID decline clock, fork-on-decline option, and lore updates for Jira–GitHub–CYOA metaphor and Architect Game Master.**

## Context

AID offers currently have no time pressure; when stewards decline quest-type offers, the offerer has no recourse. We need: (1) configurable decline clock (default 24h) so stewards must respond within a window, (2) when steward declines or offer expires, offerer can fork the linked quest and complete it privately, (3) lore updates: BARs Engine as Jira–GitHub–CYOA bridge; Architect Game Master as virtual sys-admin teacher.

## Prompt text

> Implement the AID Decline Fork, Clock, and Lore spec per [.specify/specs/aid-decline-fork-clock-lore/spec.md](../specs/aid-decline-fork-clock-lore/spec.md). Add expiresAt to GameboardAidOffer; configurable aidOfferTtlHours (default 24); forkDeclinedAidQuest action; "Your declined AID" UI; docs/JIRA_GITHUB_CYOA_METAPHOR.md; update game-master-sects, FOUNDATIONS, ARCHITECTURE, conceptual-model; cert-aid-decline-fork-v1 verification quest.

## Checklist

- [ ] Phase 1: Schema + config + offerAid (expiresAt)
- [ ] Phase 2: Decline clock UI (Respond by / Expires in)
- [ ] Phase 3: Fork on decline (action + data + UI)
- [ ] Phase 4: Lore updates (metaphor doc, game-master-sects, FOUNDATIONS, ARCHITECTURE, conceptual-model)
- [ ] Phase 5: Verification quest + build/check

## Reference

- Spec: [.specify/specs/aid-decline-fork-clock-lore/spec.md](../specs/aid-decline-fork-clock-lore/spec.md)
- Plan: [.specify/specs/aid-decline-fork-clock-lore/plan.md](../specs/aid-decline-fork-clock-lore/plan.md)
- Tasks: [.specify/specs/aid-decline-fork-clock-lore/tasks.md](../specs/aid-decline-fork-clock-lore/tasks.md)
- Related: [gameboard-deep-engagement](gameboard-deep-engagement.md)
