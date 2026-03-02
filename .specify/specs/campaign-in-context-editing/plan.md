# Plan: Campaign In-Context Editing

## Summary

Add an "Edit" control to CampaignReader for admins; clicking opens a modal to edit passage text, choices (branching), and optional slide breaks. Persist via server action that upserts Passage.

## Implementation

### 1. Pass isAdmin to CampaignReader

**File**: [src/app/campaign/page.tsx](src/app/campaign/page.tsx)

- Fetch current player (or use getCurrentPlayer); check if admin via PlayerRole.
- Pass `isAdmin: boolean` to CampaignReader.

```tsx
const player = await getCurrentPlayer()
const isAdmin = player ? await db.playerRole.findFirst({
  where: { playerId: player.id, role: { key: 'admin' } }
}) : false

<CampaignReader ... isAdmin={!!isAdmin} />
```

### 2. Campaign passage upsert action

**File**: [src/actions/campaign-passage.ts](src/actions/campaign-passage.ts) (new)

- `upsertCampaignPassage(adventureSlug, nodeId, { text, choices })`
- Resolve adventure by slug (e.g. bruised-banana); require ACTIVE.
- Upsert Passage: `db.passage.upsert({ where: { adventureId_nodeId }, create: {...}, update: {...} })`
- Revalidate `/campaign` and relevant API paths.
- Require admin (cookie check).

### 3. Edit modal component

**File**: [src/app/campaign/components/CampaignPassageEditModal.tsx](src/app/campaign/components/CampaignPassageEditModal.tsx) (new)

- Props: `isOpen`, `onClose`, `nodeId`, `initialText`, `initialChoices`, `adventureSlug`, `onSaved`
- Form fields:
  - Text (textarea, markdown)
  - Choices: list of { text, targetId } — add/remove rows, each row has two inputs
  - Help text: "Use `---` on its own line to force a slide break."
- Submit calls `upsertCampaignPassage`; on success, `onSaved()` then `onClose()`; parent refetches node.

### 4. Slide break support

**File**: [src/lib/slide-chunker.ts](src/lib/slide-chunker.ts)

- Add support for explicit `---` break: split on `\n---\n` or `\n\n---\n\n` before applying char-based chunking.
- So: `text.split(/\n\s*---\s*\n/)` first; if multiple parts, use those as slides; else fall back to existing logic.

### 5. CampaignReader integration

**File**: [src/app/campaign/components/CampaignReader.tsx](src/app/campaign/components/CampaignReader.tsx)

- Add prop `isAdmin?: boolean`
- When `isAdmin && currentNode`, render "Edit" button (e.g. top-right, subtle link or icon).
- On click, open CampaignPassageEditModal with current node data.
- Modal needs `adventureId` or `adventureSlug` — CampaignReader gets adventureSlug from props. For upsert we need adventureId; fetch from slug in the action or pass adventureId from page.
- When modal saves, call `fetchNode(currentNode.id)` to refresh.

### 6. Resolve adventure for upsert

- Campaign page can fetch Adventure by slug (bruised-banana) and pass `adventureId` to CampaignReader.
- Or: action accepts `adventureSlug`, looks up adventure, gets id. Prefer slug to avoid passing IDs through URL.

## File impacts

| Action | Path |
|--------|------|
| Create | src/actions/campaign-passage.ts — upsertCampaignPassage |
| Create | src/app/campaign/components/CampaignPassageEditModal.tsx |
| Modify | src/app/campaign/page.tsx — fetch isAdmin, pass to CampaignReader |
| Modify | src/app/campaign/components/CampaignReader.tsx — Edit button, modal, isAdmin prop |
| Modify | src/lib/slide-chunker.ts — support `---` explicit slide breaks |

## Verification

1. As admin, go to /campaign?ref=bruised-banana
2. On BB_Intro (or any node), see "Edit" control
3. Click Edit → modal opens with text and choices
4. Edit text, add `---` for slide break; add a new choice with targetId
5. Save → modal closes; refresh or refetch → changes visible
6. As non-admin, no Edit control
