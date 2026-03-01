# Plan: Avatar Click-to-Enlarge + Admin Sprite Viewer

## Summary

1. **Avatar modal**: Wrap dashboard header Avatar in a clickable element; on click, open a modal that shows the Avatar at larger size. Reusable `AvatarModal` or `AvatarEnlargeModal` component.
2. **Admin Avatar Gallery**: New admin page `/admin/avatars` that lists players with their avatars in a grid. Optional "Preview by config" form for nation/playbook/domain.
3. **Admin Sprite Assets**: Sprite asset browser + upload. Admin can see files by layer, which exist vs expected, and upload/replace PNGs for editability and scalability.

## Phase 1: Avatar Click-to-Enlarge (Dashboard)

### 1.1 Create AvatarModal component

**File**: [src/components/AvatarModal.tsx](../../src/components/AvatarModal.tsx) (new)

- Props: `player`, `open`, `onClose`, `size?` (default `xl` for 256×256 or similar)
- Renders: backdrop (fixed, full-screen, semi-transparent), centered Avatar at large size, optional player name
- Behavior: `onClick` on backdrop calls `onClose`; `useEffect` to listen for `Escape` key; focus trap optional for a11y
- Uses existing Avatar component with `size="lg"` or a new `xl` size

**Alternative**: Add `onClick` and `enlargeable` prop to Avatar; when `enlargeable`, wrap in button and use a shared modal. Simpler: keep Avatar dumb, wrap it in dashboard with a client component that handles click + modal.

### 1.2 Integrate into dashboard header

**File**: [src/app/page.tsx](../../src/app/page.tsx)

- Dashboard header Avatar is server-rendered. We need a client component for the click + modal state.
- Create `DashboardAvatarWithModal` (client): wraps Avatar, has `useState` for modal open, renders AvatarModal when open. Pass `player` from server.
- Replace `<Avatar ... />` with `<DashboardAvatarWithModal player={player} />` in the header.

**File**: [src/components/DashboardAvatarWithModal.tsx](../../src/components/DashboardAvatarWithModal.tsx) (new)

- Client component
- Renders: Avatar (clickable, cursor-pointer, maybe ring on hover)
- onClick: setModalOpen(true)
- Renders AvatarModal when open; onClose sets modalOpen(false)

## Phase 2: Admin Avatar Gallery

### 2.1 Create admin avatars page

**File**: [src/app/admin/avatars/page.tsx](../../src/app/admin/avatars/page.tsx) (new)

- Server component, admin-gated (layout already gates /admin)
- Fetch: players with `avatarConfig`, `name`, `nationId`, `playbookId`; include nation and playbook for display
- Layout: grid of cards, each card = Avatar (size lg or xl) + player name + optional nation/playbook labels
- Players without avatarConfig: show initials fallback (Avatar handles this)

### 2.2 Add admin nav link

**File**: [src/components/AdminNav.tsx](../../src/components/AdminNav.tsx) or equivalent

- Add link to `/admin/avatars` (e.g. "Avatars" or "Sprite Gallery")

### 2.3 Optional: Preview by config

**File**: [src/app/admin/avatars/page.tsx](../../src/app/admin/avatars/page.tsx)

- Add a section at top: "Preview by config" — nation select, playbook select, optional domain
- On change, derive `avatarConfig` via `deriveAvatarConfig` (server action or client if we pass nations/playbooks)
- Render Avatar with derived config
- Requires nations and playbooks from getWorldData; can be server-fetched and passed to a client PreviewForm

## Phase 3: Admin Sprite Asset Management

### 3.1 Sprite asset browser

**File**: [src/app/admin/avatars/assets/page.tsx](../../src/app/admin/avatars/assets/page.tsx) (new) or tab in avatars page

- Fetch: list files in `public/sprites/parts/{layer}/` for each layer. Options: (a) API route that reads filesystem (Node.js `fs.readdirSync`), (b) static manifest generated at build, (c) for serverless: read from blob storage or SpriteAsset table.
- Fetch: nations and playbooks to derive expected keys (slugifyName for each).
- Layout: by layer (base, nation_body, nation_accent, playbook_outfit, playbook_accent). For each layer: table or grid of keys (expected from Nation/Playbook) with status (exists / missing), thumbnail preview for existing.
- Base layer: expected keys = male, female, neutral, default (fixed).

### 3.2 Sprite upload

**File**: [src/app/api/admin/sprites/upload/route.ts](../../src/app/api/admin/sprites/upload/route.ts) (new) or server action

- Accept: layer, key, file (PNG). Validate: layer in allowed set, key alphanumeric-hyphen, file is PNG.
- **Self-hosted**: Write to `public/sprites/parts/{layer}/{key}.png` via `fs.writeFile`. Revalidate or restart to pick up new file.
- **Serverless**: Upload to Vercel Blob (or S3). Optionally add SpriteAsset model: `layer`, `key`, `storageUrl`. Update avatar-parts to resolve paths from SpriteAsset when present, else fall back to static `/sprites/parts/...`.

**File**: [src/actions/admin-sprites.ts](../../src/actions/admin-sprites.ts) (new)

- `listSpriteAssets(layer?)` — returns { layer, key, exists, url? } for each expected + existing
- `uploadSpriteAsset(layer, key, file)` — handles upload, returns success/error

### 3.3 UI for upload

**File**: [src/app/admin/avatars/assets/page.tsx](../../src/app/admin/avatars/assets/page.tsx)

- Add "Upload sprite" form: layer dropdown, key input (or select from expected keys for nation/playbook layers), file input. Submit calls upload action.
- After upload, refresh list or optimistically add to UI.

## File Structure

| Action | File |
|--------|------|
| Create | [src/components/AvatarModal.tsx](../../src/components/AvatarModal.tsx) |
| Create | [src/components/DashboardAvatarWithModal.tsx](../../src/components/DashboardAvatarWithModal.tsx) |
| Create | [src/app/admin/avatars/page.tsx](../../src/app/admin/avatars/page.tsx) |
| Modify | [src/app/page.tsx](../../src/app/page.tsx) — use DashboardAvatarWithModal in header |
| Modify | [src/components/AdminNav.tsx](../../src/components/AdminNav.tsx) or admin layout — add Avatars link |
| Modify | [src/components/Avatar.tsx](../../src/components/Avatar.tsx) — add `xl` size if needed (optional) |
| Create | [src/app/admin/avatars/assets/page.tsx](../../src/app/admin/avatars/assets/page.tsx) — sprite asset browser + upload |
| Create | [src/actions/admin-sprites.ts](../../src/actions/admin-sprites.ts) — listSpriteAssets, uploadSpriteAsset |
| Create | [src/app/api/admin/sprites/upload/route.ts](../../src/app/api/admin/sprites/upload/route.ts) — optional API route for upload |

## Verification

- Dashboard: click avatar → modal opens with larger avatar; click outside or Escape → modal closes
- Admin: navigate to /admin/avatars → see grid of player avatars
- Admin: (if implemented) use Preview by config → select nation/playbook → see derived avatar
- Admin: navigate to /admin/avatars/assets → see sprite files by layer, which exist vs missing
- Admin: upload PNG for layer+key → file stored, avatar composition uses new sprite
