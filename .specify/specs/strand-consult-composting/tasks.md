# Tasks: Strand Consult Composting

## Phase 1: Policy & Plan

- [x] Create plan.md with merge/compost/wieldy policy
- [x] Document archive location: `.specify/archive/strand-consults/<spec-name>/`
- [x] Document script design in plan.md

## Phase 2: Script Implementation

- [x] Create `scripts/compost-strand-consults.ts`
- [x] Parse BACKLOG.md and ARCHIVE.md for Done/Superseded rows
- [x] Extract spec names from feature links
- [x] Find `*CONSULT*.md` files in Done spec dirs
- [x] Copy to archive, replace with stub
- [x] Add `npm run compost:strand-consults` to package.json

## Phase 3: Spec & Docs

- [x] Update spec.md with acceptance criteria
- [x] Add strand consult composting to docs/AGENT_WORKFLOWS.md

## Phase 4: Verification

- [x] Run `npm run compost:strand-consults` — composted 2 consults (bar-social-links, admin-agent-forge)
- [ ] Run `npm run build` and `npm run check` (build fails on pre-existing Prisma migration; check passes)
