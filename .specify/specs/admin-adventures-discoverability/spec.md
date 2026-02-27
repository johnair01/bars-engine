# Spec: Admin Adventures Discoverability

## Purpose
Admins must be able to discover and access the Adventures management UI from the Admin section. The `/admin/adventures` route exists (list, create, edit adventures and passages) but was not linked from the Admin navigation, making it undiscoverable.

## User stories

### P1: Admin can find Adventures from Admin nav
**As an admin**, I want an "Adventures" link in the Admin sidebar/nav, so I can manage pre-auth CYOA campaigns (Wake-Up, etc.) and edit passage text/choices without searching the codebase.

**Acceptance**: AdminNav includes "Adventures" linking to `/admin/adventures`. Admin dashboard includes an Adventures card linking to the same.

### P2: Certification quest instructions are accurate
**As a tester** following a certification quest that says "Go to Admin → Adventures", I want that path to exist in the UI, so I can complete the verification steps.

**Acceptance**: The path "Admin → Adventures → [Adventure] → Edit passage" is navigable from the Admin section.

## Functional requirements

- **FR1**: AdminNav MUST include an "Adventures" nav item linking to `/admin/adventures`.
- **FR2**: Admin dashboard (Control Center) MUST include an Adventures card or quick link to `/admin/adventures`.
- **FR3**: Certification quest passage text that references "Admin → Adventures" MUST remain accurate (the link must exist).

## Non-functional requirements

- No schema changes; UI-only.
- Placement: Adventures near Twine Stories (both relate to narrative content).

## Reference
- AdminNav: `src/components/AdminNav.tsx`
- Admin dashboard: `src/app/admin/page.tsx`
- Adventures admin: `src/app/admin/adventures/`
