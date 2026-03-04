# Prompt: Cert Quest Grammar Runtime Error

**Use when fixing the cert-quest-grammar-v1 runtime error and related feedback.**

## Source

Spec: [cert-quest-grammar-runtime-error](../../specs/cert-quest-grammar-runtime-error/spec.md)

## Summary

Fix blocking runtime error when QuestPacket (with telemetryHooks functions) is passed to client. Also: Report Issue kick to dashboard, Quest Grammar page layout (centered).

## Prompt text

> Fix cert-quest-grammar-v1 issues per [.specify/specs/cert-quest-grammar-runtime-error/spec.md](../../specs/cert-quest-grammar-runtime-error/spec.md). FR1: Strip telemetryHooks when returning packet from compileQuestWithAI and when storing in client (GenerationFlow). FR2: Report Issue must not kick to dashboard when typing. FR3: Center Quest Grammar page content on desktop.

## Reference

- Spec: [.specify/specs/cert-quest-grammar-runtime-error/spec.md](../../specs/cert-quest-grammar-runtime-error/spec.md)
- Plan: [.specify/specs/cert-quest-grammar-runtime-error/plan.md](../../specs/cert-quest-grammar-runtime-error/plan.md)
- Tasks: [.specify/specs/cert-quest-grammar-runtime-error/tasks.md](../../specs/cert-quest-grammar-runtime-error/tasks.md)
