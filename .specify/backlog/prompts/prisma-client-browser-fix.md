# Prompt: Prisma Client Browser Fix

**Use when fixing "PrismaClient is unable to run in this browser environment" during Compile & preview.**

## Source

> When attempting to generate & compile I got a prisma error.

Error: `PrismaClient is unable to run in this browser environment...`

## Prompt (API-First)

> Fix Prisma browser error: client components import `compileQuestWithPrivileging` from lib (uses Prisma). **API-first**: define server action `compileQuestWithPrivilegingAction(input: QuestCompileInput): Promise<SerializableQuestPacket | { error: string }>` in `src/actions/quest-grammar.ts`, implement it, then wire `UpgradeQuestToCYOAFlow` and `GenerationFlow` to call the action instead of the lib. Spec: [.specify/specs/prisma-client-browser-fix/spec.md](../../specs/prisma-client-browser-fix/spec.md).

## Reference

- [spec](../../specs/prisma-client-browser-fix/spec.md) | [plan](../../specs/prisma-client-browser-fix/plan.md) | [tasks](../../specs/prisma-client-browser-fix/tasks.md)
