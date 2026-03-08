# Spec: Admin CYOA Preview, DRAFT-Only Extensions, New Passage Form

## Purpose

1. Admins can preview DRAFT adventures from the adventures pane.
2. All extended/generated adventures are created as DRAFT (no auto-publish of broken content).
3. New Passage flow: enhanced form with Connect from, choice builder (no raw JSON), guide rails.

## Root Cause

- Preview link and play API require `status === 'ACTIVE'`; DRAFT adventures are unreachable.
- Quest grammar, upgrade, append, and import flows create adventures with `status: 'ACTIVE'`.
- Create Passage form uses raw JSON for choices; no placement guidance; orphan nodes common.

---

## API Contracts (API-First)

### 1. Preview API

**Contract:** `?preview=1` + admin session → bypass ACTIVE check.

| Surface | Contract |
|---------|----------|
| Play page | `GET /adventure/[id]/play?preview=1` — if admin, load adventure without status filter |
| Adventures API | `GET /api/adventures/[slug]/[nodeId]?preview=1` — if admin, skip `status !== 'ACTIVE'` |
| AdventurePlayer | `isPreview?: boolean` — when true, append `?preview=1` to fetch URL |

### 2. Status Contract

**Contract:** All adventure-creation paths emit `status: 'DRAFT'`.

| Function | Change |
|----------|--------|
| `publishQuestPacketToPassages` | `status: 'DRAFT'` |
| `publishQuestPacketToPassagesWithSourceQuest` | `status: 'DRAFT'` |
| `createAdventureAndThreadFromTwee` | `status: 'DRAFT'` |
| `appendQuestToAdventure` | After append: `db.adventure.update({ status: 'DRAFT' })` |
| `expandEdgeWithStory`, `expandEdgeWithQuest`, merge | `status: 'DRAFT'` |

### 3. Create Passage API

**Contract:** Extend `createPassage` to accept optional `linkFrom`; form consumes it.

```ts
// src/app/admin/adventures/[id]/passages/create/actions.ts

type LinkFrom =
  | { mode: 'after'; passageId: string; nodeId: string }
  | { mode: 'branch'; passageId: string; nodeId: string; choiceIndex?: number }
  | null

createPassage(prevState, formData): FormData includes linkFrom (JSON string)
```

- **after**: Create passage; update from-passage choices to add `{ text: 'Continue', targetId: newNodeId }`.
- **branch**: Create passage; update from-passage choice at `choiceIndex` to point to `newNodeId`.
- **null**: Standalone (current behavior).

---

## Functional Requirements

### Preview

| ID | Requirement |
|----|-------------|
| FR1 | Preview link shows when `passages.length > 0`; link to `/adventure/[id]/play?preview=1` |
| FR2 | Play page: if `preview=1` and admin, load adventure without ACTIVE filter |
| FR3 | Adventures API: if `preview=1` and admin, allow DRAFT adventures |
| FR4 | AdventurePlayer accepts `isPreview`; appends `?preview=1` to fetch when true |

### DRAFT-Only

| ID | Requirement |
|----|-------------|
| FR5 | All quest-grammar adventure-creation paths use `status: 'DRAFT'` |
| FR6 | `appendQuestToAdventure` sets adventure to DRAFT after append |

### New Passage Form (Deft: form enhancement, shared ChoiceBuilder)

| ID | Requirement |
|----|-------------|
| FR7 | Single form: Connect from (optional) + Content + Choices sections |
| FR8 | Connect from: passage dropdown + mode (After \| Branch \| Standalone); if Branch, show choices from passage |
| FR9 | Content: Node ID + suggestions; passage text; collapsible macros help |
| FR10 | Shared `ChoiceBuilder` component: rows (text + target dropdown); used in Create and Edit forms |
| FR11 | `createPassage` accepts `linkFrom`; implements after/branch wiring |
| FR12 | Guide rails: standalone warning; node ID conflict error; invalid target validation |

---

## Non-Functional

- No schema changes.
- Minimal new routes (reuse play + API with query param).
- Form enhancement (no wizard); shared ChoiceBuilder for Create + Edit; backward-compatible action.

---

## References

- [admin adventures page](../../src/app/admin/adventures/[id]/page.tsx)
- [adventure play page](../../src/app/adventure/[id]/play/page.tsx)
- [adventures API](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- [quest-grammar actions](../../src/actions/quest-grammar.ts)
- [create passage actions](../../src/app/admin/adventures/[id]/passages/create/actions.ts)
