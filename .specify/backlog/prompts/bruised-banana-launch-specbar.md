# Prompt: Bruised Banana Launch SpecBAR — Oneshot Interactive Onboarding

**Use this prompt when implementing the emergent SpecBAR that coordinates the Bruised Banana campaign launch. This is a meta-spec: a kernel that affects the larger thread.**

## Context

This SpecBAR enables the Campaign Owner (Allyship Target or Ally in the Mastering the Game of Allyship context) to oneshot the campaign by inputting the 6 Unpacking Questions interactively. The flow is immersive and segment-aware (player/sponsor). It pulls together: Quest Grammar Compiler (with Campaign Owner input), Campaign Onboarding Twine v2, donation (ritual+transaction), and related Bruised Banana backlog items.

## Prompt text

> Implement the Bruised Banana Launch SpecBAR per [.specify/specs/bruised-banana-launch-specbar/spec.md](../specs/bruised-banana-launch-specbar/spec.md). This is an emergent SpecBAR affecting the launch thread. Coordinate: (1) Quest Grammar Compiler with **interactive Campaign Owner input** (Allyship Target / Ally) for Q1–Q6 + aligned action; (2) Campaign Onboarding Twine v2 to render QuestPacket as initiation flow; (3) ritual+transaction donation moment. Campaign Owner must be able to oneshot the campaign without editing code. Use game language: WHO (Campaign Owner inputs), WHAT (QuestPacket), WHERE (Bruised Banana), Energy (vibeulons), Personal throughput (4 moves). See [quest-grammar-compiler](quest-grammar-compiler.md) and [campaign-onboarding-twine-v2](campaign-onboarding-twine-v2.md) for implementation details.

## Checklist

- [ ] Quest Grammar Compiler: add Campaign Owner–facing unpacking input UI
- [ ] compileQuest → QuestPacket → Passages flow
- [ ] Campaign Onboarding Twine v2: consume QuestPacket, render initiation
- [ ] Donation: ritual + transaction framing
- [ ] Oneshot flow: Campaign Owner inputs → campaign live

## Reference

- SpecBAR: [.specify/specs/bruised-banana-launch-specbar/spec.md](../specs/bruised-banana-launch-specbar/spec.md)
- Quest Grammar: [.specify/specs/quest-grammar-compiler/spec.md](../specs/quest-grammar-compiler/spec.md)
- Campaign Onboarding: [.specify/specs/campaign-onboarding-twine-v2/spec.md](../specs/campaign-onboarding-twine-v2/spec.md)
