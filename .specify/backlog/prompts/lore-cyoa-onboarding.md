# Prompt: Lore Index + Event-Driven CYOA Onboarding

**Use this prompt when implementing the merged Lore Index, Knowledge Base, and Event-Driven CYOA onboarding. Supersedes [lore-index-knowledge-base](lore-index-knowledge-base.md) (AF) and [event-driven-cyoa-developmental-assessment](event-driven-cyoa-developmental-assessment.md) (AC).**

## Context

The lore index and wiki are the canonical content source for both the Event page and the CYOA onboarding. Event page information is essential for creating CYOA content; both share the same definitions and campaign context. Admin edits to Instance flow to both Event page and CYOA intro nodes.

## Prompt text

> Implement the Lore Index + Event-Driven CYOA per [.specify/specs/lore-cyoa-onboarding/spec.md](../specs/lore-cyoa-onboarding/spec.md). Phase 1: Create content/lore-index.md, /wiki layout and index, knowledge base pages (campaign/bruised-banana, moves, domains, glossary). Add "Learn more" link from Event page Wake Up to wiki. Phase 2: Extend BB CYOA to optionally inject wiki links; add developmental assessment nodes; store developmental signal in storyProgress; update assignOrientationThreads to accept personalization params; add cert-lore-cyoa-onboarding-v1 verification quest. Use game language: WHO (nations, archetypes), WHAT (quests, BARs), WHERE (allyship domains), Energy (vibeulons), personal throughput (4 moves).

## Checklist

- [ ] Phase 1: content/lore-index.md, /wiki layout, /wiki index, knowledge base pages
- [ ] Phase 1: "Learn more" link on Event page
- [ ] Phase 2: Lore-aware CYOA nodes (optional wiki links)
- [ ] Phase 2: Developmental assessment nodes, storyProgress storage
- [ ] Phase 2: assignOrientationThreads personalization params
- [ ] Phase 2: cert-lore-cyoa-onboarding-v1 verification quest

## Reference

- Spec: [.specify/specs/lore-cyoa-onboarding/spec.md](../specs/lore-cyoa-onboarding/spec.md)
- Plan: [.specify/specs/lore-cyoa-onboarding/plan.md](../specs/lore-cyoa-onboarding/plan.md)
- Tasks: [.specify/specs/lore-cyoa-onboarding/tasks.md](../specs/lore-cyoa-onboarding/tasks.md)
- Related: [avatar-from-cyoa-choices](avatar-from-cyoa-choices.md)
