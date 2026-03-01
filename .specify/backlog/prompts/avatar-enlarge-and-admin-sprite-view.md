# Prompt: Avatar Click-to-Enlarge + Admin Sprite Viewer

**Use this prompt when implementing dashboard avatar click-to-enlarge, admin sprite visibility, and sprite asset management.**

## Context

1. **Perceived**: Clicking the avatar in the dashboard header does nothing. **Expected**: Avatar should open in a larger view (modal) when clicked.
2. **Perceived**: Admin can only see sprite images inside character creation quests. **Expected**: Admin should be able to view generated sprites from the admin console.
3. **Perceived**: Admin cannot manage sprite asset files. **Expected**: Admin should be able to see and update the PNG files used to generate sprites from the console, for editability and scalability.

## Prompt text

> Implement avatar click-to-enlarge: wrap dashboard header Avatar in a clickable component; on click, open a modal showing the avatar at larger size. Support click-outside and Escape to close. Add admin Avatar Gallery at /admin/avatars: grid of players with their avatars rendered at larger size. Optionally add "Preview by config" (nation/playbook select) for asset verification. Add admin Sprite Assets view at /admin/avatars/assets: list sprite files by layer (base, nation_body, nation_accent, playbook_outfit, playbook_accent), show expected keys from Nation/Playbook names, which exist vs missing, preview thumbnails. Add upload form: layer + key + PNG file; store to filesystem (self-hosted) or blob storage (serverless).

## Checklist

- [ ] AvatarModal component (backdrop, large Avatar, onClose)
- [ ] DashboardAvatarWithModal wraps header Avatar, opens modal on click
- [ ] /admin/avatars page with player avatar grid
- [ ] AdminNav link to Avatars
- [ ] (Optional) Preview by config in admin avatars page
- [ ] /admin/avatars/assets: sprite asset browser by layer
- [ ] Sprite upload: layer + key + PNG, store and use in avatar composition

## Reference

- Spec: [.specify/specs/avatar-enlarge-and-admin-sprite-view/spec.md](../specs/avatar-enlarge-and-admin-sprite-view/spec.md)
- Avatar: [src/components/Avatar.tsx](../../src/components/Avatar.tsx)
- Dashboard: [src/app/page.tsx](../../src/app/page.tsx)
- Sprite paths: [src/lib/avatar-parts.ts](../../src/lib/avatar-parts.ts)
