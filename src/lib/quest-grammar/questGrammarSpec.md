# Quest Grammar Spec

## Overview

The Quest Grammar compiles 6 Unpacking Questions + one Aligned Action into a QuestPacket: an Emotional Alchemy Signature and a 6-beat Epiphany Bridge quest thread. Output supports segment variants (player vs sponsor). Heuristic-based for v1; no AI/LLM calls.

## Input Schema

| Field | Type | Description |
|-------|------|-------------|
| q1 | string | What experience do you want to create? |
| q2 | string | How will you feel when you get this? (satisfaction feelings) |
| q3 | string | Compared to that what's life like right now? |
| q4 | string | How does it feel to live here? (dissatisfaction or neutral) |
| q5 | string | What would have to be true for someone to feel this way? (emotional logic) |
| q6 | string | What reservations do you have about your creation? (self-sabotaging beliefs) |
| alignedAction | string | The aligned action (e.g. "Update the onboarding flow...") |
| segment | "player" \| "sponsor" | Audience lens |
| campaignId | string? | Optional campaign context |

## Output Schema: QuestPacket

- **signature**: Emotional Alchemy Signature
- **nodes**: 6 nodes (Epiphany Bridge Micro beats)
- **segmentVariant**: "player" | "sponsor"
- **telemetryHooks**: Interface for questStarted, nodeViewed, choiceSelected, donationClicked, donationCompleted

## Emotional Alchemy Signature

- **primaryChannel**: Fear | Anger | Sadness | Joy | Neutrality
- **dissatisfiedLabels**: string[] (from Q4)
- **satisfiedLabels**: string[] (from Q2)
- **movementPerNode**: "translate" | "transcend" per node
- **shadowVoices**: string[] (from Q6: "not ready", "not worthy", etc.)

## Epiphany Bridge Micro (6 Beats)

1. **Orientation** — Set the stage
2. **Rising engagement** — Draw the player in
3. **Moment of tension** — Peak of conflict
4. **Integration** (translation) — Begin resolution
5. **Transcendence** (completion) — Full resolution; may contain donation
6. **Structural consequence** — System event, identity flag, unlock suggestion

## Constraints

- Node word count: 75–200 words (target)
- Choices per node: 2–3
- Lore gates per node: 0–2, each ≤ 120 words
- Anchors: each node has ≥1 of goal, identityCue, consequenceCue
- Primary channel locked across nodes 1–5

## Segment Lens

- **Player**: participation, discovery, "entering a living world mid-formation"
- **Sponsor**: stewardship, catalysis, "protecting emergence"
- Spine (channel, beat sequence) unchanged; only framing differs

## Donation Node

- Frames as threshold/ritual crossing
- Includes practical transaction language (what happens, what it supports)
- Consequence node: system event, identity flag (Early Believer / Catalyst), unlock suggestion
