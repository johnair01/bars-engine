# Spec: Avatar Stacking Fix and Base-Only Preview

## Purpose

1. **Base-only preview**: When nation and archetype are unselected in the Assign Avatar form, show the base avatar (default or selected gender variant) instead of initials. Admins need to see the base model to verify it before adding overlays.
2. **Fix stacking**: Avatar layers (base → nation_body → playbook_outfit → nation_accent → playbook_accent) should composite correctly. Currently only the top layer (e.g. playbook_accent heart) may appear; base and intermediate layers are not visible.

## Rationale

- **Base visibility**: `deriveAvatarConfig` returns `null` when both nation and playbook are unselected, so the preview shows initials. Admins cannot verify the base sprite without selecting nation/archetype first.
- **Stacking**: When Argyra + Bold Heart are selected, the preview shows only the red heart on a checkered (transparent) background. Expected: base + Argyra nation layers + Bold Heart layers stacked. Root causes may include: (a) base layer failing to load and triggering fallback (but we'd see initials, not heart—so base may be loading but transparent or obscured); (b) overlay layers with opaque backgrounds covering base; (c) avatar container lacking a solid background so transparency shows through; (d) CSS stacking or z-index issues.

## Expected Behavior

1. **Base-only preview**: When nation and archetype are both unselected, the preview shows the base avatar (gender variant from dropdown, defaulting to `default`). No initials.
2. **Full stacking**: When nation and/or archetype are selected, the preview shows base + nation layers + playbook layers composited in order. Transparent areas in overlays reveal layers below. Base is always visible when any overlay is present.
3. **Solid background**: The avatar container has a solid background (e.g. `bg-zinc-900`) so transparent sprite areas don't show a checkered or parent background.

## User Stories

### P1: Base-only preview when nothing selected

**As an admin**, when I open the Assign Avatar form with no nation or archetype selected, I see the base avatar (default or selected base variant) in the preview—not initials.

**Acceptance**:
- Preview shows base layer when `nationId` and `playbookId` are both empty.
- Base variant dropdown (default/male/female/neutral) affects the preview.
- No 404s for base assets.

### P2: Full layer stacking when nation/archetype selected

**As an admin**, when I select Argyra and The Bold Heart, I see the full composed avatar: base, Argyra nation layers, and Bold Heart layers stacked—not just the heart accent.

**Acceptance**:
- Base layer is visible beneath overlays.
- Nation layers (nation_body, nation_accent) appear when nation is selected.
- Playbook layers (playbook_outfit, playbook_accent) appear when archetype is selected.
- Transparent areas in overlay sprites show layers below.
- Avatar container has a solid background so transparency is not confusing.

## Functional Requirements

### Base-only preview

- **FR1**: `AssignAvatarForm` MUST derive a preview config when nation and archetype are unselected. Use a "base-only" config: `{ nationKey: '', playbookKey: '', genderKey, variant: 'default' }`.
- **FR2**: `parseAvatarConfig` MUST accept configs with empty `nationKey` and `playbookKey` (base-only). Return the parsed config instead of null when both are empty strings.
- **FR3**: `getAvatarPartSpecs` MUST return at least the base layer when config has empty nationKey and playbookKey. Base path: `/sprites/parts/base/${genderKey}.png`.

### Stacking fix

- **FR4**: `Avatar` component MUST render a solid background behind the sprite layers (e.g. `bg-zinc-900`) so transparent areas don't show through to parent.
- **FR5**: Sprite layers MUST stack in DOM order: base first (bottom), then nation_body, playbook_outfit, nation_accent, playbook_accent (top). Each layer uses `absolute inset-0 object-contain`.
- **FR6**: If base fails to load, show initials fallback (existing behavior).

### Asset requirements (documentation)

- **FR7**: Overlay sprites (nation_body, playbook_outfit, nation_accent, playbook_accent) MUST have transparent backgrounds per [docs/SPRITE_ASSETS.md](../../../docs/SPRITE_ASSETS.md). Opaque backgrounds will cover base. This is an asset creation guideline; no code change for asset creation.

## Non-functional Requirements

- No schema changes.
- Reuse existing `Avatar` component; extend `deriveAvatarConfig` or add `buildBaseOnlyAvatarConfig` for base-only case.
- Backward compatible: existing avatar configs with nation/playbook continue to work.

## Technical Notes

### Base-only config

- `deriveAvatarConfig` currently returns `null` when `!nationKey && !playbookKey`. For preview, we need a config that has only base. Options:
  - **A**: Add `deriveBaseOnlyAvatarConfig(genderKey?: string)` that returns `JSON.stringify({ nationKey: '', playbookKey: '', variant: 'default', genderKey })`.
  - **B**: Change `deriveAvatarConfig` to accept optional `allowBaseOnly: true`; when true and both empty, return base-only config instead of null.
  - **C**: In AssignAvatarForm, when `!nationId && !playbookId`, manually build config: `JSON.stringify({ nationKey: '', playbookKey: '', variant: 'default', genderKey: genderKey || 'default' })`.
- Prefer **C** for minimal change: AssignAvatarForm builds base-only config inline; no changes to deriveAvatarConfig.

### parseAvatarConfig change

- Current: `if (parsed?.nationKey || parsed?.playbookKey) return parsed` — rejects config with both empty.
- Change: `if (parsed && (parsed.nationKey !== undefined || parsed.playbookKey !== undefined)) return parsed` — accept config with empty strings. Or: `if (parsed && typeof parsed === 'object') return parsed` — accept any valid config. Safer: `if (parsed && 'nationKey' in parsed && 'playbookKey' in parsed) return parsed` — accept config with empty nationKey/playbookKey.

### getAvatarPartSpecs

- Already returns base first. When `config.nationKey` and `config.playbookKey` are falsy, it returns only `[{ layer: 'base', ... }]`. No change needed.

### Avatar background

- Add `className="bg-zinc-900"` or `style={{ backgroundColor: 'rgb(24 24 27)' }}` to the avatar container div (the one with `relative overflow-hidden rounded-full`). Ensures transparent sprite areas show a solid dark background instead of checkered/parent.

## Reference

- Avatar component: [src/components/Avatar.tsx](../../../src/components/Avatar.tsx)
- Avatar parts: [src/lib/avatar-parts.ts](../../../src/lib/avatar-parts.ts)
- Avatar utils: [src/lib/avatar-utils.ts](../../../src/lib/avatar-utils.ts)
- Assign form: [src/components/admin/AssignAvatarForm.tsx](../../../src/components/admin/AssignAvatarForm.tsx)
- Sprite assets: [docs/SPRITE_ASSETS.md](../../../docs/SPRITE_ASSETS.md)
- Previous spec: [.specify/specs/avatar-gallery-preview-and-stacking/spec.md](../avatar-gallery-preview-and-stacking/spec.md)
