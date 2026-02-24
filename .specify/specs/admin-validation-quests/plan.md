# Technical Implementation Plan: Admin Validation Quests

## Architecture Strategy
We will author three lightweight Twine JSON files that conform to our existing `ParsedTwine` schema. These will be loaded by a new backend seed script.

## Component Design

### 1. The Twine JSON Stories (`content/stories/admin_tests/`)
We will create three JSON files structured as a serialized `ParsedTwine` object:
- `the-quick-mint.json`: Contains just a Start node that links immediately to an End node.
- `the-labyrinth.json`: Contains multiple branching nodes to test traversal state, and ending nodes. Includes `inputs` tags to test input parsing if needed, but primarily tests `revertRun`.
- `the-resurrection-loop.json`: A standard short quest with distinct text identifying its purpose.

### 2. The Seed Script (`scripts/seed-admin-tests.ts`)
A Prisma-based seed script that reads the JSON files, creates `TwineStory` records, and creates corresponding `CustomBar` records representing the quests. 
- Uses `upsert` semantics to ensure idempotency.
- Sets `isSystem = true`, `visibility = 'public'`, `reward = 1`.

## Database Schema Impacts
None. We are utilizing existing `TwineStory` and `CustomBar` schemas.

## Data Flow
- `seed-admin-tests.ts` -> DB (`TwineStory`, `CustomBar`)
- UI fetch (`getMarketContent`) -> Market Graveyard / Quests
- User interaction -> `autoCompleteQuestFromTwine` -> Ledger Mint.

## Operational Considerations
This script is strictly for testing and validation on local or staging environments, ensuring the engine updates introduced in v0.1.0 are stable.
