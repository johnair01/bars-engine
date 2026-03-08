# Spec Kit Prompt: Lore-Immersive Onboarding

## Role

You are a Spec Kit agent implementing story-world immersion in onboarding so new users are drawn into the fiction and campaign actions equally.

## Objective

Implement Lore-Immersive Onboarding per [.specify/specs/lore-immersive-onboarding/spec.md](../specs/lore-immersive-onboarding/spec.md). **Content-first**: story before mechanics, show through narrative not explanation. Lead with Conclave, heist, nations, archetypes, vibeulons. Interleave story and actions. Tone: comedic heist (Ocean's 11) + Hitchhiker's Guide wit.

## Prompt (Content-First)

> Implement Lore-Immersive Onboarding per [.specify/specs/lore-immersive-onboarding/spec.md](../specs/lore-immersive-onboarding/spec.md). **Content-first**: (1) Create canonical story intro copy (content/onboarding-story-intro.md or Instance defaults). (2) Ensure BB_Intro, BB_ShowUp, chained initiation intro use story-world language. (3) Add story beats before nation/playbook/domain choices in characterCreationPacket. (4) Introduce vibeulons in-story in moves packet. (5) Add cert-lore-immersive-onboarding-v1. Use game language and story_context.md. Spec: [path].

## Requirements

- **Surfaces**: BB_Intro, BB_ShowUp, chained initiation intro, characterCreationPacket, movesGMPacket, Event page
- **Content**: Story-first copy from story_context.md, lore-index; Instance fields as editable source
- **Mechanics**: No structural changes; enhance copy and framing
- **Verification**: cert-lore-immersive-onboarding-v1 — story world in first passage, story-framed choices, vibeulons in-story

## Checklist (Content-First Order)

- [ ] Create canonical story intro content
- [ ] Instance defaults or BB nodes use story-world copy
- [ ] characterCreationPacket story beats before hubs
- [ ] movesGMPacket vibeulon intro in-story
- [ ] Add verification quest
- [ ] Run npm run build and npm run check — fail-fix

## Deliverables

- [ ] content/onboarding-story-intro.md (or Instance seed update)
- [ ] characterCreationPacket.ts story beats
- [ ] movesGMPacket.ts vibeulon intro
- [ ] BB/Instance content alignment
- [ ] cert-lore-immersive-onboarding-v1

## References

- Spec: [.specify/specs/lore-immersive-onboarding/spec.md](../specs/lore-immersive-onboarding/spec.md)
- Plan: [.specify/specs/lore-immersive-onboarding/plan.md](../specs/lore-immersive-onboarding/plan.md)
- Tasks: [.specify/specs/lore-immersive-onboarding/tasks.md](../specs/lore-immersive-onboarding/tasks.md)
- Story context: [docs/handbook/world/story_context.md](../../docs/handbook/world/story_context.md)
- Lore index: [content/lore-index.md](../../content/lore-index.md)
- Related: [lore-cyoa-onboarding](../specs/lore-cyoa-onboarding/spec.md), [two-minute-ride-story-bridge](../specs/two-minute-ride-story-bridge/spec.md), [auto-flow-chained-initiation](../specs/auto-flow-chained-initiation/spec.md)
