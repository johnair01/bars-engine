# Spec: Prisma Client Browser Fix (Compile & Preview)

## Purpose

Fix "PrismaClient is unable to run in this browser environment" when clicking Compile & preview. Prisma is server-only; it must not be bundled for the browser.

## Root Cause

Client components (`UpgradeQuestToCYOAFlow`, `GenerationFlow`) import `compileQuestWithPrivileging` from `@/lib/quest-grammar`, which uses `db` (Prisma) for nation/playbook choice privileging. That pulls Prisma into the client bundle.

## API Contract (API-First)

Define the server action surface before implementation:

```ts
// src/actions/quest-grammar.ts

export async function compileQuestWithPrivilegingAction(
  input: QuestCompileInput
): Promise<SerializableQuestPacket | { error: string }>
```

- **Input**: `QuestCompileInput` (serializable; from `@/lib/quest-grammar`)
- **Output**: `SerializableQuestPacket` (omit `telemetryHooks`) or `{ error: string }`
- **Behavior**: Calls `compileQuestWithPrivileging` server-side; strips `telemetryHooks` for client safety

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | Add `compileQuestWithPrivilegingAction` per API contract above |
| FR2 | `UpgradeQuestToCYOAFlow` and `GenerationFlow` call the action; no lib import of `compileQuestWithPrivileging` |
| FR3 | No other client components import lib functions that use `db` |

## Non-Functional

- No schema changes, no new routes, minimal surface change.

## References

- [UpgradeQuestToCYOAFlow](../../src/components/admin/UpgradeQuestToCYOAFlow.tsx)
- [GenerationFlow](../../src/app/admin/quest-grammar/GenerationFlow.tsx)
- [quest-grammar actions](../../src/actions/quest-grammar.ts)
- [compileQuestWithPrivileging](../../src/lib/quest-grammar/compileQuest.ts)
