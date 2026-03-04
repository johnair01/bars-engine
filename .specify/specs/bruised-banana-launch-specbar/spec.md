# SpecBAR: Bruised Banana Campaign Launch — Oneshot Interactive Onboarding

## What This Is (Game Language)

This is an **emergent SpecBAR** — a kernel that compresses the launch thread for the Bruised Banana campaign. A SpecBAR is a BAR (compressed unit of potential) that holds a spec; it affects the larger thread of work. This SpecBAR coordinates multiple specs toward one goal: **oneshot the Bruised Banana campaign in an interactive, immersive onboarding flow**.

**WHO** (Campaign Owner) inputs the 6 Unpacking Questions. In the Mastering the Game of Allyship context, this is the Allyship Target or the Ally. (Founder applies when using this technology for launching an app.) **WHAT** (QuestPacket) is generated and becomes the onboarding quest. **WHERE** (Bruised Banana instance) is the campaign context. **Energy** (vibeulons) flows when visitors complete the ritual. **Personal throughput** (4 moves) is taught within the flow.

## Purpose

Enable the Campaign Owner (Allyship Target or Ally in the Mastering the Game of Allyship context) to input the 6 Unpacking Questions interactively, compile a QuestPacket, and oneshot the campaign onboarding — so visitors experience a mythic initiation that moves them before it teaches them. The flow is immersive, segment-aware (player/sponsor), and supports ritual+transaction donation.

## Thread This SpecBAR Affects

| Spec / Item | Role in Launch Thread |
|-------------|------------------------|
| [Quest Grammar Compiler](.specify/specs/quest-grammar-compiler/spec.md) | Compiles unpacking answers → QuestPacket; **add interactive Campaign Owner input** |
| [Campaign Onboarding Twine v2](.specify/specs/campaign-onboarding-twine-v2/spec.md) | Renders QuestPacket as initiation flow; Passages, state, donation |
| [Event Donation Honor System](.specify/specs/event-donation-honor-system/spec.md) | Donation flow; ritual+transaction moment |
| [Campaign In-Context Editing](.specify/specs/campaign-in-context-editing/spec.md) | Admin edit copy from within flow |
| [Bruised Banana Quest Map](.specify/specs/bruised-banana-quest-map/spec.md) | Kotter-stage quests; post-onboarding |
| [Voice Style Guide](/wiki/voice-style-guide) | Tone, rhythm, anti-drift checks |

## New Requirement: Interactive Unpacking Input

**As the Campaign Owner** (Allyship Target or Ally in the Mastering the Game of Allyship context), I want to input the 6 Unpacking Questions (and aligned action) through an interactive form or flow, so that I can oneshot the campaign without editing code or seed scripts.

**Acceptance**:
- Campaign Owner–facing UI (admin or dedicated flow) to enter Q1–Q6 and aligned action
- Optional: segment selection (player / sponsor / both)
- On submit: `compileQuest` runs → QuestPacket generated → Passages written (or preview shown)
- Flow is immersive: questions can be presented as a ritual (one at a time, with space) or as a form
- Output is immediately usable as the campaign onboarding content

## Integration Flow

```
Campaign Owner inputs Q1–Q6 + aligned action (interactive)
    → compileQuest(input) → QuestPacket
    → QuestPacket → Passages (seed or live write)
    → CampaignReader renders Passages
    → Visitor experiences initiation (player or sponsor variant)
    → Donation (ritual + transaction) → signup → orientation
```

## Priority

**Emergent.** This SpecBAR unblocks the Bruised Banana launch. The Campaign Owner (Allyship Target / Ally) must be able to oneshot the campaign by inputting unpacking answers — no code deploy required for content updates.

## Dependencies

- Quest Grammar Compiler (BY) — extend with interactive input
- Campaign Onboarding Twine v2 (BX) — consume QuestPacket, render flow
- Preservation strategy: [.cursor/plans/bb_flow_preservation_strategy_cc49be8e.plan.md](../../../.cursor/plans/bb_flow_preservation_strategy_cc49be8e.plan.md)

## Terminology (Mastering the Game of Allyship)

| Term | Meaning |
|------|---------|
| **Campaign Owner** | The person who owns/leads the campaign; inputs unpacking questions |
| **Allyship Target** | In MGTA context: the person or group the campaign is for |
| **Ally** | In MGTA context: someone using this technology for allyship work |
| **Founder** | Application-specific: when using this for launching an app |

## Reference

- House integration: [.specify/specs/bruised-banana-house-integration/ANALYSIS.md](../bruised-banana-house-integration/ANALYSIS.md)
- Cursor plan: [.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md](../../../.cursor/plans/bruised_banana_campaign_unblock_3fab45ae.plan.md)
