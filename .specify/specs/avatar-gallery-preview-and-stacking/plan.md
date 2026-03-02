# Plan: Avatar Gallery Preview and Sprite Stacking Fix

## Summary

1. **Fix deriveAvatarConfig**: Use empty string for nationKey/playbookKey when not selected instead of `'unknown'`, so `getAvatarPartSpecs` skips nation layers and avoids 404s.
2. **Fix Avatar fallback**: When base layer fails to load, show initials fallback instead of partial avatar.
3. **Add preview to AssignAvatarForm**: Derive config from form state and render Avatar with that config; preview updates on dropdown change.

## Phase 1: Stacking Fix

### 1.1 deriveAvatarConfig: avoid 'unknown' keys

**File**: [src/lib/avatar-utils.ts](../../../src/lib/avatar-utils.ts)

- Change `nationKey: nationKey || 'unknown'` to `nationKey: nationKey || ''`.
- Change `playbookKey: playbookKey || 'unknown'` to `playbookKey: playbookKey || ''`.
- `getAvatarPartSpecs` already treats empty string as falsy (`if (config.nationKey)`), so nation/playbook layers are skipped when not selected.
- Ensures no requests for `nation_body/unknown.png` or `playbook_outfit/unknown.png` when only one is selected.

### 1.2 Avatar: base failure triggers full fallback

**File**: [src/components/Avatar.tsx](../../../src/components/Avatar.tsx)

- Add condition: `showFallback = specs.length === 0 || visibleSpecs.length === 0 || failedLayers.has('base')`.
- When base fails to load (404, etc.), show initials/colored circle instead of partial layers (e.g. only playbook_accent).

## Phase 2: Preview in Assign Avatar Form

### 2.1 Derive preview config from form state

**File**: [src/components/admin/AssignAvatarForm.tsx](../../../src/components/admin/AssignAvatarForm.tsx)

- Import `deriveAvatarConfig` from `@/lib/avatar-utils`.
- Use `useMemo` to derive `previewConfig` from `nationId`, `playbookId`, `genderKey`, and the `nations`/`playbooks` arrays (to resolve names).
- When `nationId` or `playbookId` is set, call:
  ```ts
  deriveAvatarConfig(nationId ?? null, playbookId ?? null, null, {
    nationName: nations.find(n => n.id === nationId)?.name,
    playbookName: playbooks.find(p => p.id === playbookId)?.name,
    genderKey: genderKey ? (genderKey as AvatarConfig['genderKey']) : undefined
  })
  ```
- `previewConfig` is `string | null`; when null, Avatar shows fallback.

### 2.2 Render preview Avatar

**File**: [src/components/admin/AssignAvatarForm.tsx](../../../src/components/admin/AssignAvatarForm.tsx)

- Add a preview section above or beside the form controls (e.g. left column on larger screens, or above on mobile).
- Render `<Avatar player={{ name: 'Preview', avatarConfig: previewConfig }} size="xl" />` (or `lg` for compactness).
- Label: "Preview" or "Avatar preview".
- Preview updates reactively when `nationId`, `playbookId`, or `genderKey` change (via `previewConfig` in useMemo).

### 2.3 Layout

- Option A: Preview in a card to the left of the form on `lg` screens; stacked on small screens.
- Option B: Preview above the form, centered.
- Prefer Option B for simplicity: preview row, then form row.

## File Structure

| Action | File |
|--------|------|
| Modify | [src/lib/avatar-utils.ts](../../../src/lib/avatar-utils.ts) — nationKey/playbookKey empty instead of 'unknown' |
| Modify | [src/components/Avatar.tsx](../../../src/components/Avatar.tsx) — base failure → full fallback |
| Modify | [src/components/admin/AssignAvatarForm.tsx](../../../src/components/admin/AssignAvatarForm.tsx) — add preview |

## Verification

- Assign playbook-only (no nation): avatar shows base + playbook layers; no 404s for nation_body/unknown.png.
- Assign nation + playbook: avatar shows base + nation + playbook layers composited.
- Break base (e.g. rename default.png): avatar shows initials fallback, not partial layers.
- Change nation/playbook/base in Assign form: preview updates immediately without submit.
- Assign to player: avatar in grid matches preview.
