# Plan: Twine Authoring Preview, Filter, and Template

## Architecture

- **Preview**: Extend the Twine edit UI with a "Preview" button/tab that renders the story in a modal or split pane using the existing Twine player.
- **Filter**: Add filter controls to the Twine story list page (admin); query params or client-side filter.
- **Template**: Add `isTemplate` (or similar) to Adventure/Twine model; "Create from template" flow that clones structure.

## File impacts

| Action | Path |
|--------|------|
| Modify | Admin Twine edit page / edit pane |
| Modify | Admin Twine story list page |
| Modify | Prisma schema (if template flag needed) |
| Add | Template clone/create flow |

## Implementation notes

- Preview: Reuse PassageRenderer or Twine player component; load story data from current edit state.
- Filter: Follow patterns from market-clear-filters; consider campaign, status, search.
- Template: May require Adventure.isTemplate, or a separate Template model; clone passages and links.
