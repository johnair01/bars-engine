# Spec: Admin Onboarding Passage Edit (Node-Level)

## Purpose

Enable admins to edit individual passages (nodes) in the onboarding .twee draft via a modal, instead of editing the entire file. Each node opens to a form for title, body, and choices. Selective edits affect the whole document through an API that parses, updates, and persists.

**Problem**: The current "Edit .twee Draft" section requires editing the full raw file. Admins cannot selectively edit one passage without risking corruption or losing context.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Edit granularity | Per-passage (node). One passage = one modal. |
| Serialization | String replacement: locate passage block, replace, preserve StoryTitle/StoryData and other passages |
| Passage identifier | Passage name (e.g. "Arrival", "The Invitation"). Used as `id` in API. |
| Rename handling | PATCH with `name` change updates all `links[].target` that point to old name |
| Special passages | StoryTitle, StoryData excluded from editable passages list |

## API Contracts (API-First)

### GET /api/admin/onboarding/draft/passages

**Auth**: Admin only.

**Output**:
```ts
{
  passages: Array<{
    id: string        // passage name
    name: string     // same as id
    tags: string[]
    body: string     // prose only (links stripped)
    links: Array<{ label: string; target: string }>
  }>
}
```

- Parses `bruised-banana-onboarding-draft.twee` via `parseTwee`.
- Excludes StoryTitle, StoryData.
- `body` = passage text with `[[...]]` link markup stripped.

### PATCH /api/admin/onboarding/draft/passages/:id

**Auth**: Admin only.

**Input**:
```ts
{
  name?: string      // new passage name (rename)
  body?: string      // prose content (may include [TOKEN], {{INPUT}})
  links?: Array<{ label: string; target: string }>
}
```

**Output**: `{ success: true }` or `{ error: string }` (4xx/5xx).

**Behavior**:
1. Read full .twee from file.
2. Parse with `parseTwee`.
3. Find passage by `id`.
4. Apply updates (merge). If `name` changed, update all links targeting old name.
5. Rebuild passage block: `body + "\n\n" + linksToTwee(links)`.
6. Replace passage block in twee string (string replacement).
7. Validate: `parseTwee`, `translateTweeToFlow`.
8. Write file.

## User Stories

### P1: Admin edits a single passage

**As an admin**, I want to click a node in the Template Structure and edit that passage's title, text, and choices in a modal, so I can make targeted changes without editing the whole file.

**Acceptance**: Click "Arrival" → modal opens with title, body, links. Edit and Save → only that passage changes; file persists; flow remains valid.

### P2: Admin sees passage structure before editing

**As an admin**, I want the graph to show which nodes are editable and open the correct passage when I click, so I know what I'm editing.

**Acceptance**: Each node in the graph is clickable; click opens modal with that passage's data pre-filled.

## Functional Requirements

### Phase 1: API + serialization

- **FR1**: `serializePassageToBlock(name, tags, body, links)` → Twee block string.
- **FR2**: `replacePassageInTwee(tweeSource, passageId, newBlock)` → updated twee string. Preserves StoryTitle, StoryData, other passages.
- **FR3**: GET `/api/admin/onboarding/draft/passages` returns `{ passages }`. Admin auth.
- **FR4**: PATCH `/api/admin/onboarding/draft/passages/:id` accepts `{ name?, body?, links? }`. Apply, replace, validate, write. Admin auth.

### Phase 2: UI

- **FR5**: `PassageEditModal` component: form with name, body (textarea), links (dynamic list). Load on open, Save calls PATCH.
- **FR6**: Graph nodes in `OnboardingFlowTemplate` are clickable; click opens `PassageEditModal` with passage `id`.
- **FR7**: On successful save, close modal and refresh flow (or invalidate so graph reflects changes).

### Phase 3: Links editor (optional)

- **FR8**: Links editable as list: label + target (dropdown of passage names). Add/remove links.

## Non-Functional Requirements

- Deterministic: no AI. Parse, replace, validate.
- Preserve `[TOKEN] SET` and `{{INPUT}}` in body; admin edits them as part of passage text.
- Rename: when passage name changes, update all incoming links (other passages' `links[].target`).

## Verification Quest

- **ID**: `cert-admin-onboarding-passage-edit-v1`
- **Steps**: Visit /admin/onboarding; click a node (e.g. Arrival); edit body; Save; confirm change persists; Play draft shows updated content.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [admin-onboarding-flow-api](.specify/specs/admin-onboarding-flow-api/spec.md)
- [Draft API](.specify/specs/admin-onboarding-draft-api) — GET/PUT `/api/admin/onboarding/draft` (existing)

## References

- [src/lib/twee-parser.ts](src/lib/twee-parser.ts) — parseTwee
- [src/lib/twine-parser.ts](src/lib/twine-parser.ts) — ParsedPassage, ParsedLink
- [src/app/admin/onboarding/OnboardingFlowTemplate.tsx](src/app/admin/onboarding/OnboardingFlowTemplate.tsx)
- [content/twine/onboarding/bruised-banana-onboarding-draft.twee](content/twine/onboarding/bruised-banana-onboarding-draft.twee)
