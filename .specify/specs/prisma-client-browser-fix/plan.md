# Plan: Prisma Client Browser Fix

## API-First Flow

1. **Define** the action signature and contract (see spec).
2. **Implement** the action; then wire clients to it.

## Architecture

- **Before**: Client → `compileQuestWithPrivileging` (lib) → Prisma bundled → error
- **After**: Client → `compileQuestWithPrivilegingAction` (server) → server runs lib → returns serializable packet

## File Impacts

| File | Change |
|------|--------|
| `src/actions/quest-grammar.ts` | Add `compileQuestWithPrivilegingAction` |
| `UpgradeQuestToCYOAFlow.tsx` | Lib import → action call |
| `GenerationFlow.tsx` | Lib import → action call |

## Order

1. Add action (API contract → implementation).
2. Wire UpgradeQuestToCYOAFlow.
3. Wire GenerationFlow.
4. `npm run build` && `npm run check`.
