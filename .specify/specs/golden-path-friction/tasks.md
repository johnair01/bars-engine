# Tasks: Golden Path Friction

## Phase 1: Schema

- [x] Add `frictionType String?`, `frictionRecordedAt DateTime?` to PlayerQuest in prisma/schema.prisma
- [x] Run `npm run db:sync`

## Phase 2: Server Action

- [x] Create `recordQuestFriction(questId, frictionType)` server action
- [x] Validate frictionType in enum

## Phase 3: QuestDetailModal UI

- [x] Surface "I'm stuck" more prominently (expand by default or primary placement)
- [x] Add friction type selector; call recordQuestFriction
- [x] Normalize copy: "Friction is part of play"

## Phase 4: Verification

- [x] Run `npm run build` and `npm run check`
