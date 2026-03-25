# Spec Kit Prompt: Admin books list overflow + home compass row (ABCL)

## Role

You are a Spec Kit agent implementing layout and IA fixes for admin book pipeline UX and the NOW dashboard compass.

## Objective

Implement per [.specify/specs/admin-books-compass-compact-ui/spec.md](../../specs/admin-books-compass-compact-ui/spec.md). Fix clipped action buttons on `/admin/books`, add **Open book** hub at `/admin/books/[id]`, **See more** for overflow actions, and collapse **Four moves** + **Current move** into one row from `sm` breakpoint up; stack below `sm`.

## Prompt (UI-first)

> Follow **tasks.md** in order. Reuse existing server actions (`books`, `book-analyze`); no schema changes. Extract shared book action UI between list and hub. Keep `OrientationCompass` suggestion logic unchanged — layout only.

## Requirements

- **Surfaces**: `BookList.tsx`, new `admin/books/[id]/page.tsx`, `OrientationCompass.tsx`
- **Mechanics**: `flex-wrap`, `min-w-0`, primary vs secondary actions, cert quest for regression
- **Persistence**: None (v1)
- **Verification**: `cert-admin-books-compass-compact-ui-v1` + npm seed script

## Checklist

- [ ] Book hub parity with list actions
- [ ] No horizontal clip at 320–1440px on book cards
- [ ] Compass row at `sm+`, stack on mobile
- [ ] `npm run build` && `npm run check`

## Deliverables

- [ ] Code per plan.md
- [ ] Tasks.md checkboxes updated
- [ ] Cert story seeded
