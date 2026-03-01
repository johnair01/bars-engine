# Spec: Avatar Click-to-Enlarge + Admin Sprite Viewer

## Purpose

Fix three UX gaps: (1) Dashboard avatar is not clickable — users expect to click their avatar to open it in a larger view; (2) Admin cannot view generated sprites from the admin console — sprites are only visible inside character creation quests; (3) Admin cannot see or update the sprite asset files used to generate avatars — needed for editability and scalability.

## Rationale

- **Click-to-enlarge**: Players expect to inspect their character. The dashboard header shows a small avatar; clicking it should open a larger view (modal or pane) so they can see their composed sprite clearly.
- **Admin sprite visibility**: Admins need to verify sprite assets, debug avatar configs, and preview how players' characters render. Currently there is no admin surface to view avatars outside of the Build Your Character quest or campaign flow.
- **Admin sprite asset management**: Admins need to see which sprite files exist (by layer: base, nation_body, nation_accent, playbook_outfit, playbook_accent) and upload/replace PNGs without editing the codebase. Enables editability (tweak art) and scalability (add new nations/playbooks with sprites).

## Expected Behavior

1. **Dashboard**: Clicking the avatar in the header opens a modal/overlay showing the avatar at a larger size (e.g. 2–3×). Modal can be dismissed by clicking outside or pressing Escape.
2. **Admin**: Admin console has a way to view generated sprites — e.g. an Avatar Gallery page or a section in Admin Players that shows each player's avatar in a larger view, with optional config preview (nation, playbook, domain).
3. **Admin sprite assets**: Admin can browse sprite files by layer, see which files exist vs expected (from Nation/Playbook names), preview each PNG, and upload/replace sprite files for a given layer+key.

## User Stories

### P1: Avatar click opens larger view

**As a player**, I click my avatar in the dashboard header, and a larger view of my character opens so I can see the composed sprite clearly.

**Acceptance**: Avatar in dashboard header is wrapped in a clickable element; onClick opens a modal/dialog that renders the same Avatar at `size="lg"` or larger (e.g. 256×256px). Modal has backdrop, close button or click-outside-to-close, and Escape key to dismiss.

### P2: Admin can view player sprites

**As an admin**, I can open the admin console and see generated sprites for players, so I can verify assets and debug avatar configs.

**Acceptance**: Admin has access to a view (e.g. `/admin/avatars` or a section in `/admin/players`) that lists players with their avatars rendered at a larger size. Each row/card shows player name and their composed avatar. Players without avatarConfig show initials fallback.

### P3: Admin can preview sprite by config (optional)

**As an admin**, I can preview how a sprite would look for a given nation/playbook/domain combination without a real player.

**Acceptance**: Admin Avatar Gallery (or similar) includes a "Preview by config" control: select nation, playbook, optionally domain; render the derived avatar for that config. Helps verify sprite assets exist and composite correctly.

### P4: Admin can see sprite asset files

**As an admin**, I can browse the sprite files used to generate avatars, organized by layer (base, nation_body, nation_accent, playbook_outfit, playbook_accent), so I know what exists and what's missing.

**Acceptance**: Admin has a Sprite Assets view (e.g. `/admin/avatars/assets` or a tab in `/admin/avatars`) that lists layers and their files. For each layer: show expected keys (from Nation/Playbook names via slugify) and which PNGs exist. Preview each existing file. Highlight missing files (expected but no PNG).

### P5: Admin can update sprite asset files

**As an admin**, I can upload or replace a PNG for a given layer+key, so I can add new nation/playbook sprites or fix art without editing the codebase.

**Acceptance**: Sprite Assets view includes an upload form: select layer, enter or select key (e.g. nation slug, playbook slug), choose PNG file. On submit, the file is stored and used for avatar composition. Supports both adding new sprites and replacing existing ones.

## Functional Requirements

- **FR1**: Dashboard header avatar MUST be clickable. On click, open a modal that displays the Avatar component at a larger size (e.g. `size="lg"` or custom 256×256px). Modal MUST support: click-outside-to-close, Escape key to close, and optional explicit close button.
- **FR2**: Admin MUST have a route (e.g. `/admin/avatars`) or a dedicated section that displays player avatars. Each player with `avatarConfig` shows their composed sprite; players without show initials fallback. Layout: grid or list of cards with avatar + name.
- **FR3**: Admin avatar view MUST be gated: only players with admin role can access it.
- **FR4** (optional): Admin view MAY include a "Preview by config" form: nation dropdown, playbook dropdown, optional domain; render `deriveAvatarConfig` + Avatar for the selected combo. Useful for asset verification.
- **FR5**: Admin MUST have a Sprite Assets view that lists sprite files by layer. For each layer (base, nation_body, nation_accent, playbook_outfit, playbook_accent): show expected keys (derived from Nation/Playbook names via `slugifyName`), which files exist, which are missing. Allow preview of each existing PNG.
- **FR6**: Admin MUST be able to upload a PNG for a given layer+key. Upload stores the file (filesystem for self-hosted, or blob storage for serverless). After upload, the new/replaced sprite is used for avatar composition. Keys for nation/playbook layers can be derived from Nation/Playbook selectors or entered manually.

## Non-functional Requirements

- No schema changes for v1 (filesystem-based storage). Optional: SpriteAsset model + blob storage for serverless scalability.
- Sprite asset storage: For self-hosted (filesystem), write to `public/sprites/parts/{layer}/{key}.png`. For serverless (Vercel), use blob storage (Vercel Blob, S3) and optionally a SpriteAsset model to map layer+key → URL; avatar-parts would resolve paths from storage when configured.
- Reuse existing Avatar component and avatar-utils; no new sprite generation logic.
- Modal should be accessible (focus trap, Escape, aria-label).

## Out of Scope (v1)

- Exporting avatar as downloadable PNG (would require canvas compositing).
- Editing avatar config from admin (separate spec if needed).

## Sprite Layer Reference

| Layer | Key source | Example path |
|-------|------------|--------------|
| base | genderKey (male, female, neutral, default) | `/sprites/parts/base/default.png` |
| nation_body | nationKey (slugified Nation name) | `/sprites/parts/nation_body/pyrakanth.png` |
| nation_accent | nationKey | `/sprites/parts/nation_accent/pyrakanth.png` |
| playbook_outfit | playbookKey (slugified Playbook name) | `/sprites/parts/playbook_outfit/danger-walker.png` |
| playbook_accent | playbookKey | `/sprites/parts/playbook_accent/danger-walker.png` |

## Reference

- Avatar component: [src/components/Avatar.tsx](../../src/components/Avatar.tsx)
- Avatar utils: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts)
- Avatar parts: [src/lib/avatar-parts.ts](../../src/lib/avatar-parts.ts)
- Dashboard: [src/app/page.tsx](../../src/app/page.tsx) (header Avatar at ~line 363)
- Admin layout: [src/app/admin/layout.tsx](../../src/app/admin/layout.tsx)
- Admin players: [src/app/admin/players/page.tsx](../../src/app/admin/players/page.tsx)
- Sprite paths: [public/sprites/parts/](../../public/sprites/parts/) — layer subdirs with `{key}.png`
- slugifyName: [src/lib/avatar-utils.ts](../../src/lib/avatar-utils.ts) — for deriving keys from Nation/Playbook names
