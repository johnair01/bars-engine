# Tasks: Prisma P6009 Response Size Fix

## Phase 1: Immediate Fix

- [x] Modify listBooks to use select (exclude extractedText)
- [x] Run npm run build and check

## Phase 2: Error Handling

- [x] Add try/catch to admin books page
- [x] Create src/lib/prisma-errors.ts with isPrismaP6009
- [x] Log P6009 when detected

## Phase 3: Documentation

- [x] Add developer note on large-field select pattern
