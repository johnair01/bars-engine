# Tasks: Twine Authoring Preview, Filter, and Template

## Phase 1: In-Editor Preview

- [x] Add Preview button/tab to Twine edit pane.
- [x] Render story preview in modal or split pane using existing player.
- [x] Verify edits are reflected in preview (compile from current IR state).

## Phase 2: Twine Story Page Filter

- [x] Add filter controls (status, campaign, search) to Twine story list.
- [x] Wire filters to list query; persist in URL if appropriate.

## Phase 3: Template Support

- [x] Add isTemplate (or equivalent) to schema if needed.
- [x] Add "Set as template" action for admins.
- [x] Add "Create from template" flow that clones structure.

## Verification

- [ ] Run cert-twine-authoring-ir-v1; verify preview, filter, and template flows.
- [ ] No regressions on existing Twine authoring.
