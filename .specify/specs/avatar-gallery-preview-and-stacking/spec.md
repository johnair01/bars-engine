# Spec: Avatar Gallery Preview and Sprite Stacking Fix

## Purpose

1. **Fix stacking bug**: Avatar layers should composite correctly (base + nation + playbook visible). Currently, only the top layer (e.g. playbook_accent heart) may appear, or layers appear to replace each other instead of stacking.
2. **Add preview**: Admins should see a live preview of the composed avatar in the Assign Avatar form before pushing the config to a player's account.

## Rationale

- **Stacking**: The Avatar Gallery shows avatars that appear as a single layer (e.g. only the Bold Heart accent) instead of base + nation + playbook layers composited. This makes it impossible to verify sprite composition. Root causes may include: (a) `nationKey: 'unknown'` when only playbook is selected, causing 404s for `nation_body/unknown.png`; (b) base layer failing and being filtered out, leaving only accent; (c) overlay assets with opaque backgrounds covering layers below.
- **Preview**: Admins need to preview the composed avatar before assigning to avoid trial-and-error on player accounts. The Assign Avatar form has no preview today.

## Expected Behavior

1. **Stacking**: Avatar displays all applicable layers composited in order: base → nation_body → playbook_outfit → nation_accent → playbook_accent. Transparent areas in overlays show layers below. If base fails to load, show initials fallback instead of partial avatar.
2. **Preview**: Assign Avatar form includes a live preview area that shows the composed avatar for the currently selected nation, playbook, and base variant—before any player is selected or assigned. Preview updates when dropdowns change.

## User Stories

### P1: Avatar layers composite correctly

**As an admin**, when I assign an avatar (nation + playbook) to a player, I see the full composed avatar: base, nation layers, and playbook layers stacked, with transparent overlays showing through to layers below.

**Acceptance**:
- Base layer is always visible when config has nation or playbook.
- Nation layers (nation_body, nation_accent) only load when a nation is selected; no `nation_body/unknown.png` requests when nation is omitted.
- If base fails to load, show initials fallback instead of partial avatar (e.g. only accent).
- Overlay assets (nation_body, playbook_outfit, nation_accent, playbook_accent) use transparent backgrounds per [docs/SPRITE_ASSETS.md](../../../docs/SPRITE_ASSETS.md).

### P2: Live preview before assign

**As an admin**, I can see a preview of the composed avatar in the Assign Avatar form as I change nation, playbook, and base variant—before selecting a player or clicking Assign.

**Acceptance**:
- Assign Avatar form includes a preview area (e.g. circular avatar, size lg or xl).
- Preview updates reactively when nation, playbook, or base variant dropdowns change.
- Preview shows the same composition logic as the Avatar component (base + nation + playbook layers).
- Preview is visible even when no player is selected; it reflects the current form selections only.

## Functional Requirements

### Stacking fix

- **FR1**: `deriveAvatarConfig` MUST NOT set `nationKey: 'unknown'` when no nation is selected. Use `nationKey: ''` so `getAvatarPartSpecs` skips nation layers (avoids 404s for `nation_body/unknown.png`).
- **FR2**: `Avatar` component MUST treat base layer failure as full fallback: when `failedLayers.has('base')`, show initials fallback instead of partial layers.
- **FR3**: Overlay sprite assets MUST have transparent backgrounds (document in SPRITE_ASSETS.md if not already; no code change for asset creation).

### Preview

- **FR4**: `AssignAvatarForm` MUST render a live preview of the composed avatar using the current nation, playbook, and base variant selections.
- **FR5**: Preview MUST use the same rendering logic as `Avatar` (or a shared component) so it matches the final result.
- **FR6**: Preview MUST update when any of nation, playbook, or base variant change; no submit required.

## Non-functional Requirements

- No schema changes.
- Reuse `Avatar` or extract a shared `AvatarFromConfig` that accepts `AvatarConfig` directly for preview.
- Preview should be prominent (e.g. above or beside the form controls).

## Technical Notes

### deriveAvatarConfig change

Current: `nationKey: nationKey || 'unknown'`, `playbookKey: playbookKey || 'unknown'`.

Change: `nationKey: nationKey || ''`, `playbookKey: playbookKey || ''`. The `if (!nationKey && !playbookKey) return null` guard already ensures at least one is set. `getAvatarPartSpecs` uses `if (config.nationKey)` and `if (config.playbookKey)`—empty string is falsy, so nation/playbook layers are skipped when not selected.

### Avatar fallback logic

Current: `showFallback = specs.length === 0 || visibleSpecs.length === 0`.

Add: `showFallback = specs.length === 0 || visibleSpecs.length === 0 || failedLayers.has('base')`. When base fails, show initials instead of partial avatar.

### Preview implementation

- Derive `AvatarConfig` client-side from form state (nationId → nationName → nationKey, playbookId → playbookName → playbookKey, genderKey).
- Pass config to `Avatar` with a synthetic player `{ name: 'Preview', avatarConfig: JSON.stringify(config) }`, or create `AvatarFromConfig({ config, size })` that skips parsing.

## Reference

- Avatar component: [src/components/Avatar.tsx](../../../src/components/Avatar.tsx)
- Avatar parts: [src/lib/avatar-parts.ts](../../../src/lib/avatar-parts.ts)
- Avatar utils: [src/lib/avatar-utils.ts](../../../src/lib/avatar-utils.ts)
- Assign form: [src/components/admin/AssignAvatarForm.tsx](../../../src/components/admin/AssignAvatarForm.tsx)
- Admin manual avatar spec: [.specify/specs/admin-manual-avatar-assignment/spec.md](../admin-manual-avatar-assignment/spec.md)
