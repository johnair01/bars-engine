# BARS Engine --- Unified Game Loop Architecture Spec

## Core Principle

The system transforms human tension into playable, repeatable
transformation loops.

It integrates: - BAR (tension) - Quest (intervention) - Core Drive
(motivation) - Loop (mechanic) - Campaign (composition)

------------------------------------------------------------------------

## System Model

  Layer        Function
  ------------ -------------------------------
  BAR          Defines tension
  Quest        Defines intervention
  Core Drive   Defines motivation
  Loop         Defines repeated behavior
  Campaign     Defines structured experience

------------------------------------------------------------------------

## Unified Flow

BAR → Quest → Core Drive → Loop → Campaign

------------------------------------------------------------------------

## Key Objects

### BAR

-   tension expression
-   type
-   polarity
-   wavePhase
-   motivationProfile

------------------------------------------------------------------------

### Quest

-   intervention structure
-   supported BAR types
-   motivationDesign

------------------------------------------------------------------------

### Core Drive (Octalysis)

Enum of 8 drives: - epic_meaning - development_accomplishment -
empowerment_creativity_feedback - ownership_possession -
social_influence_relatedness - scarcity_impatience -
unpredictability_curiosity - loss_avoidance

------------------------------------------------------------------------

### LoopTemplate

Defines repeatable engagement pattern

-   trigger
-   action
-   feedback
-   reward
-   cadence

------------------------------------------------------------------------

### CampaignDraft

Braids: - playerArc - campaignContext - loop structure

------------------------------------------------------------------------

## Loop Model

Trigger → Action → Feedback → Reward → Repeat

------------------------------------------------------------------------

## Data Model Additions

### BarMotivationProfile

-   primaryCoreDrives\[\]
-   secondaryCoreDrives\[\]
-   antiDrives\[\]

------------------------------------------------------------------------

### QuestMotivationDesign

-   primaryCoreDrives\[\]
-   techniques\[\]
-   intendedLoopType

------------------------------------------------------------------------

### CampaignArc (extended)

-   coreDrives\[\]
-   loopTemplates\[\]
-   engagementNotes

------------------------------------------------------------------------

## API Additions

### Loop Templates

POST /api/loop-templates\
GET /api/loop-templates

### Motivation Inference

POST /api/bar-registry/infer-motivation

### Loop Recommendation

POST /api/campaign-arcs/:id/recommend-loops

------------------------------------------------------------------------

## Matching Logic

Match on: 1. Psychological fit (BAR) 2. Campaign fit (objective) 3.
Motivational fit (Core Drive) 4. Loop viability (repeatability)

------------------------------------------------------------------------

## Design Rules

1.  Every quest should activate at least one Core Drive\
2.  Every campaign arc should define loop mechanics\
3.  Avoid single-drive dominance\
4.  Balance intrinsic vs extrinsic motivation\
5.  Design for repeatability, not one-off actions

------------------------------------------------------------------------

## Example

BAR: "Waiting to feel ready instead of starting"

Loop: - Trigger: hesitation moment - Action: take 1 small step -
Feedback: visible progress - Reward: completion + recognition

Core Drives: - development_accomplishment - social_influence_relatedness

------------------------------------------------------------------------

## Outcome

System evolves from: - static analysis

into: - dynamic engagement engine

------------------------------------------------------------------------

## Cursor Task Prompt

Extend system to: - integrate Core Drives into BAR + Quest models -
introduce LoopTemplate entity - connect loops to campaign arcs - enable
loop-based recommendation engine

Ensure: - backward compatibility - explainable matching - human-editable
structures
