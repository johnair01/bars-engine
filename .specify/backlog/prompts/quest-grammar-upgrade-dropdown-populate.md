# Quest Grammar Upgrade Dropdown Populate

Implement the spec per [.specify/specs/quest-grammar-upgrade-dropdown-populate/spec.md](../specs/quest-grammar-upgrade-dropdown-populate/spec.md).

## Summary

1. **Problem**: "Start from existing quest" dropdown does not populate. Errors are silently swallowed.
2. **Goal**: Dropdown shows available quests; loading, error, and empty states are visible.
3. **Approach**: Add `getAdminQuestsForUpgrade` with error-return shape and filter; update UpgradeFromQuest for loading/error/empty UX.

## Key files

- `src/actions/admin.ts` — Add getAdminQuestsForUpgrade
- `src/app/admin/quest-grammar/UpgradeFromQuest.tsx` — Use new action; add loading, error, empty states

## Tasks

See [.specify/specs/quest-grammar-upgrade-dropdown-populate/tasks.md](../specs/quest-grammar-upgrade-dropdown-populate/tasks.md).
