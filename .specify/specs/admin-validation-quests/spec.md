# Specification: Admin Validation Quests

## Overview
Create a suite of test quests for administrators that specifically validate the success criteria of the v0.1.0 walkthrough (Unified Discovery, Graveyard Lifecycle, Resurrection Ritual, and Vibeulon Rewards).

## Target Audience
Game Administrators and QA testers verifying the core engine mechanics.

## User Stories
1. **As an Admin,** I want to play a very short "Quick Mint" quest so that I can immediately verify Vibeulon reward minting and the transition of the quest to the Graveyard.
2. **As an Admin,** I want to traverse a multi-step "Labyrinth" quest so that I can test the `revertRun` (Back button) functionality, state persistence, and branching logic.
3. **As an Admin,** I want a quest specifically meant to be "resurrected" so I can verify that completing it, finding it in the Graveyard, clicking Restore, and re-completing it works flawlessly.
4. **As a System Engineer,** I want a seed script to load these test quests into the database automatically so I can quickly set up a testing environment.

## Functional Requirements
- **FR1 (Stories):** Create 3 distinct Twine stories in JSON format representing the 3 testing scenarios.
- **FR2 (Seed Script):** The seed script must insert these stories into `TwineStory` and link them to `CustomBar` records.
- **FR3 (Configuration):** The quests must be marked as `isSystem: true`, `visibility: 'public'`, and have a `reward: 1` to properly test the admin pipeline.

## Non-Functional Requirements
- The JSON stories must parse correctly using our existing Twine Parser.
- The seed script must be idempotent (safe to run multiple times).

## Milestones
1. Story Drafting (JSON generation)
2. Seed Script Implementation
3. Final Verification Run
