# BARS Engine API Spec --- Octalysis Integration

## Goal

Extend API to support motivation-aware game design using Octalysis.

------------------------------------------------------------------------

## Add Core Drive Enum

type CoreDrive = \| "epic_meaning" \| "development_accomplishment" \|
"empowerment_creativity_feedback" \| "ownership_possession" \|
"social_influence_relatedness" \| "scarcity_impatience" \|
"unpredictability_curiosity" \| "loss_avoidance"

------------------------------------------------------------------------

## Update BarRegistryRecord

analysis: { type wavePhase polarity motivationProfile?:
BarMotivationProfile }

------------------------------------------------------------------------

## Add BarMotivationProfile

-   primaryCoreDrives\[\]
-   secondaryCoreDrives\[\]
-   antiDrives\[\]
-   rationale
-   confidence

------------------------------------------------------------------------

## Update Quest Model

motivationDesign?: { primaryCoreDrives\[\] secondaryCoreDrives\[\]
techniques\[\] intendedLoopType }

------------------------------------------------------------------------

## Add LoopTemplate

type LoopTemplate = { id title coreDrives\[\] trigger action feedback
reward resetCondition cadence suitableFor }

------------------------------------------------------------------------

## Update CampaignArc

-   coreDrives\[\]
-   loopTemplates\[\]
-   engagementNotes

------------------------------------------------------------------------

## New Endpoints

POST /api/loop-templates\
GET /api/loop-templates

POST /api/campaign-arcs/:id/recommend-loops

POST /api/bar-registry/infer-motivation

------------------------------------------------------------------------

## Matching Logic Update

Match based on: - psychological fit (BAR) - campaign context -
motivational fit (Core Drives)

------------------------------------------------------------------------

## Design Principle

The system must balance: - tension (BAR) - intervention (Quest) -
motivation (Core Drive) - repetition (Loop)
