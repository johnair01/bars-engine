# Tasks: Ontology glossary wiki bridge (OGW)

## A — Spec kit land

- [x] Create `spec.md`, `plan.md`, `tasks.md`
- [x] Add `GLOSSARY.md` (wiki index)
- [x] Add `COPY_VIOLATIONS_INVENTORY.md` (methodology + seed list)
- [x] Add `NARRATIVE_BRIDGE_SIX_FACE.md`
- [x] Add row to `BACKLOG.md` (OGW)
- [x] Add `STORY_WORLD_LAYER.md` + `src/lib/ontology/content-layer.ts` (ops vs story layer, no second Instance)

## B — Compost & cross-links

- [ ] Add “See also” links from glossary to `campaign-hub-spoke-landing-architecture/spec.md`, `campaign-subcampaigns/spec.md`, `bar-quest-link-campaign-drafts/spec.md` where terms overlap
- [ ] If `docs/wiki/` pattern exists: generate **stub pages** from glossary `wiki_slug` (manual or script — optional)
- [ ] Add pointer from `docs/DEVELOPER_ONBOARDING.md` or `ARCHITECTURE.md` → glossary (one sentence) — **only if** maintainers want it

## C — Copy violation triage (follow-up PRs)

- [ ] Run inventory grep quarterly; promote fixes to P0/P1
- [ ] Batch UI copy fixes using glossary canonical phrases (no drive-by renames of routes)

## D — Schema touch protocol

- [ ] When `prisma/schema.prisma` changes Instance/campaign fields: update **GLOSSARY.md** “Prisma / code” column for affected terms
