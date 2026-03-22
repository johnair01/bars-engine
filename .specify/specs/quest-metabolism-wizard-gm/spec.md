# Spec: Quest Metabolism & Wizard (GM guidance)

## Purpose

Align **Quest Wizard** output, **BAR vs quest** semantics, **personal vs collective** subquests, **fork**, and **agent moves** (e.g. add subquest) with a metabolizable, engine-complete model.

**Authoritative GM commentary:** [SIX_FACES_GUIDANCE.md](./SIX_FACES_GUIDANCE.md)

**Related specs:**

- `.specify/specs/typed-quest-bar-building-blocks/` — typed edges, quality, revisions
- `.specify/specs/quest-wizard-template-alignment/` — templates & alignment (see backlog)
- `.specify/specs/flow-321-iching-quest-wizard/` — **321 → Quest Wizard**, dashboard 321, **I Ching → BAR / wizard** branches

## Problem

- Wizard exists at `/quest/create` but is **under-linked** in the UI.
- Players conflate **inspiration BARs** with **work quests**.
- Collective subquests need **fork** without junk; system quests need **self-unblock** paths.
- Agents need a **standard move list** shared with UI.

## Acceptance criteria (draft)

- [ ] Primary nav or hand/adventures surfaces link to `/quest/create` with clear label.
- [ ] `createQuestFromWizard` rejects non-metabolizable payloads (template + contract).
- [ ] Move registry document lists agent-preparable actions with preconditions.

## Status

**Guidance captured** — implementation tasks to be split into `tasks.md` when prioritized.
