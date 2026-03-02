# Plan: Avatar Stacking Fix and Base-Only Preview

## Summary

1. **Base-only preview**: AssignAvatarForm builds a base-only config when nation and archetype are unselected; parseAvatarConfig accepts it; preview shows base.
2. **parseAvatarConfig**: Accept configs with empty nationKey and playbookKey (base-only).
3. **Avatar background**: Add solid background to avatar container so transparent areas don't show checkered.
4. **Asset check**: Verify overlay sprites have transparent backgrounds (documentation; may need asset fixes if opaque).

## Phase 1: Base-Only Preview

### 1.1 parseAvatarConfig accepts base-only

**File**: [src/lib/avatar-utils.ts](../../../src/lib/avatar-utils.ts)

- Current: `if (parsed?.nationKey || parsed?.playbookKey) return parsed` — rejects when both empty.
- Change: Accept config when `parsed` has `nationKey` and `playbookKey` properties (even if empty). Use: `if (parsed && typeof parsed === 'object' && ('nationKey' in parsed || 'playbookKey' in parsed)) return parsed`. This allows base-only (both empty) and normal configs.

### 1.2 AssignAvatarForm builds base-only config

**File**: [src/components/admin/AssignAvatarForm.tsx](../../../src/components/admin/AssignAvatarForm.tsx)

- Current: `if (!nationId && !playbookId) return null` in previewConfig useMemo.
- Change: When both empty, build base-only config:
  ```ts
  if (!nationId && !playbookId) {
    return JSON.stringify({
      nationKey: '',
      playbookKey: '',
      variant: 'default',
      genderKey: (genderKey as AvatarConfig['genderKey']) || 'default',
    })
  }
  ```
- Import `AvatarConfig` type from avatar-utils if needed.

## Phase 2: Stacking Fix (Avatar Background)

### 2.1 Add solid background to Avatar container

**File**: [src/components/Avatar.tsx](../../../src/components/Avatar.tsx)

- Add `bg-zinc-900` to the avatar container div (the one with `relative overflow-hidden rounded-full`). This ensures transparent sprite areas show a solid dark background instead of checkered or parent background.
- Apply to both the fallback div and the sprite-stack div for consistency.

## Phase 3: Verification

- Open `/admin/avatars`, clear nation and archetype. Preview should show base (default.png or selected variant).
- Select Argyra + Bold Heart. Preview should show base + nation layers + playbook layers. If only heart still shows, the issue is likely overlay assets with opaque backgrounds—document in spec and add asset audit task.

## File Structure

| Action | File |
|--------|------|
| Modify | [src/lib/avatar-utils.ts](../../../src/lib/avatar-utils.ts) — parseAvatarConfig accept base-only |
| Modify | [src/components/admin/AssignAvatarForm.tsx](../../../src/components/admin/AssignAvatarForm.tsx) — base-only previewConfig |
| Modify | [src/components/Avatar.tsx](../../../src/components/Avatar.tsx) — add bg-zinc-900 |

## Out of Scope (Asset Fix)

If stacking still fails after code changes, overlay sprites (nation_body/argyra.png, playbook_outfit/bold-heart.png, etc.) may have opaque backgrounds. Per SPRITE_ASSETS.md they should have "transparent background except clothing." If assets are opaque, regenerate or edit them. No code change for asset creation.
