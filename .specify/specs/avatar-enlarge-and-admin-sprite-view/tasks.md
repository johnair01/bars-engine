# Tasks: Avatar Click-to-Enlarge + Admin Sprite Viewer

## Phase 1: Avatar Click-to-Enlarge

- [x] Create `AvatarModal` component: backdrop, centered Avatar at large size, onClose (click outside, Escape)
- [x] Create `DashboardAvatarWithModal` client component: clickable Avatar, modal state, opens AvatarModal on click
- [x] Replace dashboard header Avatar with DashboardAvatarWithModal in page.tsx
- [x] Add `xl` size to Avatar component if 256×256 or similar is desired (optional; `lg` may suffice)

## Phase 2: Admin Avatar Gallery

- [x] Create `/admin/avatars` page: fetch players with avatarConfig, render grid of Avatar + name
- [x] Add "Avatars" or "Sprite Gallery" link to AdminNav
- [ ] (Optional) Add "Preview by config" section: nation/playbook selects, derive and render avatar

## Phase 3: Admin Sprite Asset Management

- [x] Create `/admin/avatars/assets` page (or tab): list sprite files by layer (base, nation_body, nation_accent, playbook_outfit, playbook_accent)
- [x] Derive expected keys from Nation/Playbook names (slugifyName); show which files exist vs missing
- [x] Add thumbnail preview for each existing sprite file
- [x] Create upload form: layer select, key input/select, file input (PNG)
- [x] Implement `uploadSpriteAsset` server action: validate, store to filesystem (public/sprites) or blob storage
- [x] Add link from Avatars page to Sprite Assets (or nav item)

## Verification

- [ ] Dashboard: click avatar → modal opens; dismiss works
- [ ] Admin: /admin/avatars shows player avatars
- [ ] Admin: (optional) Preview by config works
- [ ] Admin: /admin/avatars/assets shows sprite files by layer, exist/missing status
- [ ] Admin: upload sprite → new file used in avatar composition
