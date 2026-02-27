# Prompt: Admin Adventures Discoverability

**Use this prompt when admin routes exist but are not linked from the Admin navigation.**

## Prompt text

> Ensure admin-only routes are discoverable from the Admin section. Add nav items to [AdminNav](src/components/AdminNav.tsx) and dashboard cards to [admin/page.tsx](src/app/admin/page.tsx) so admins can reach management UIs without guessing URLs. When certification quests or docs reference "Admin → [Feature]", that path MUST exist in the Admin nav. See [.specify/specs/admin-adventures-discoverability/spec.md](../../specs/admin-adventures-discoverability/spec.md).

## Checklist for new admin routes

- [ ] Add nav item to AdminNav with descriptive name and icon
- [ ] Add dashboard card to admin Control Center if the feature is a primary admin surface
- [ ] Update certification quests or testing docs if they reference the admin path

## Reference

- Spec: [.specify/specs/admin-adventures-discoverability/spec.md](../../specs/admin-adventures-discoverability/spec.md)
